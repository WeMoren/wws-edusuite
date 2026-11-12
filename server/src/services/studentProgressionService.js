import pool from "../config/db.js";

import { recordActivity } from "./activityLogService.js";
import {
    createStudentFinancialAccountForCurrentTerm,
} from "./studentFinancialAccountService.js";

const PROGRESSION_OUTCOMES = [
    "promote",
    "repeat",
    "graduate",
    "transfer",
    "withdraw",
];

export class StudentProgressionError extends Error {
    constructor(message, statusCode = 400, details = null) {
        super(message);
        this.name = "StudentProgressionError";
        this.statusCode = statusCode;
        this.details = details;
    }
}

const getAcademicLevelSequence = async (client, schoolId) => {
    const result = await client.query(
        `
        SELECT
            id,
            name,
            category,
            display_order
        FROM academic_levels
        WHERE school_id = $1
        ORDER BY display_order ASC, id ASC;
        `,
        [schoolId]
    );

    const levels = result.rows;

    if (levels.length === 0) {
        throw new StudentProgressionError(
            "This school has no configured academic levels."
        );
    }

    const sequenceErrors = [];

    levels.forEach((level, index) => {
        const expectedOrder = index + 1;

        if (level.display_order !== expectedOrder) {
            sequenceErrors.push({
                levelId: level.id,
                levelName: level.name,
                currentOrder: level.display_order,
                expectedOrder,
            });
        }
    });

    if (sequenceErrors.length > 0) {
        throw new StudentProgressionError(
            "The academic-level sequence is invalid. Please correct duplicate or missing display-order positions before processing student progression.",
            409,
            {
                sequenceErrors,
                configuredLevels: levels.map((level) => ({
                    id: level.id,
                    name: level.name,
                    displayOrder: level.display_order,
                })),
            }
        );
    }

    return levels;
};

const validateProgressionSessions = async (
    client,
    {
        schoolId,
        sourceAcademicSessionId,
        destinationAcademicSessionId,
    }
) => {
    if (
        !sourceAcademicSessionId
        || !destinationAcademicSessionId
    ) {
        throw new StudentProgressionError(
            "Both source and destination academic sessions are required."
        );
    }

    if (
        sourceAcademicSessionId === destinationAcademicSessionId
    ) {
        throw new StudentProgressionError(
            "The source and destination academic sessions must be different."
        );
    }

    const result = await client.query(
        `
        SELECT
            id,
            name,
            is_current,
            start_date,
            end_date
        FROM academic_sessions
        WHERE school_id = $1
          AND id = ANY($2::uuid[])
        FOR SHARE;
        `,
        [
            schoolId,
            [
                sourceAcademicSessionId,
                destinationAcademicSessionId,
            ],
        ]
    );

    const sourceSession = result.rows.find(
        (session) => session.id === sourceAcademicSessionId
    );

    const destinationSession = result.rows.find(
        (session) => session.id === destinationAcademicSessionId
    );

    if (!sourceSession || !destinationSession) {
        throw new StudentProgressionError(
            "The selected source or destination academic session was not found for this school.",
            404
        );
    }

    return {
        sourceSession,
        destinationSession,
    };
};

const getNextAcademicLevel = (
    levels,
    currentAcademicLevelId
) => {
    const currentIndex = levels.findIndex(
        (level) => level.id === currentAcademicLevelId
    );

    if (currentIndex === -1) {
        throw new StudentProgressionError(
            "The student's current academic level is not configured for this school.",
            409
        );
    }

    if (currentIndex === levels.length - 1) {
        throw new StudentProgressionError(
            "The student is already in the highest configured academic level. Graduation must be selected explicitly."
        );
    }

    return levels[currentIndex + 1];
};

const getEligibleSourceEnrollment = async (
    client,
    {
        schoolId,
        studentId,
        sourceAcademicSessionId,
        lockRows = false,
    }
) => {
    const lockClause = lockRows
        ? "FOR UPDATE OF s, se"
        : "";

    const result = await client.query(
        `
        SELECT
            s.id AS student_id,
            s.admission_no,
            s.first_name,
            s.middle_name,
            s.last_name,
            s.status AS student_status,

            se.id AS source_enrollment_id,
            se.academic_session_id,
            se.class_id,
            se.section_id,
            se.stream_id,
            se.subject_combination_id,
            se.status AS enrollment_status,

            c.name AS class_name,
            c.academic_level_id,

            al.name AS academic_level_name,
            al.display_order

        FROM students s

        JOIN student_enrollments se
            ON se.student_id = s.id
           AND se.school_id = s.school_id

        JOIN classes c
            ON c.id = se.class_id
           AND c.school_id = se.school_id
           AND c.academic_session_id = se.academic_session_id

        JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id

        WHERE s.id = $1
          AND s.school_id = $2
          AND se.academic_session_id = $3
          AND s.status = 'active'
          AND se.status = 'active'

        LIMIT 1
        ${lockClause};
        `,
        [
            studentId,
            schoolId,
            sourceAcademicSessionId,
        ]
    );

    if (result.rows.length === 0) {
        throw new StudentProgressionError(
            "The student has no active enrollment in the selected source session, is inactive, or does not belong to this school.",
            404
        );
    }

    return result.rows[0];
};

const validateDestinationPlacement = async (
    client,
    {
        schoolId,
        destinationAcademicSessionId,
        academicLevelId,
        classId,
        sectionId,
        streamId = null,
        subjectCombinationId = null,
    }
) => {
    if (!classId || !sectionId) {
        throw new StudentProgressionError(
            "A destination class and section are required for promotion or repetition."
        );
    }

    if (subjectCombinationId && !streamId) {
        throw new StudentProgressionError(
            "A destination stream is required when selecting a subject combination."
        );
    }

    const classResult = await client.query(
        `
        SELECT
            id,
            name,
            academic_level_id
        FROM classes
        WHERE id = $1
          AND school_id = $2
          AND academic_session_id = $3
          AND academic_level_id = $4
        LIMIT 1;
        `,
        [
            classId,
            schoolId,
            destinationAcademicSessionId,
            academicLevelId,
        ]
    );

    if (classResult.rows.length === 0) {
        throw new StudentProgressionError(
            "The selected destination class does not belong to the destination session and academic level.",
            404
        );
    }

    const sectionResult = await client.query(
        `
        SELECT id, name
        FROM sections
        WHERE id = $1
          AND school_id = $2
          AND class_id = $3
        LIMIT 1;
        `,
        [sectionId, schoolId, classId]
    );

    if (sectionResult.rows.length === 0) {
        throw new StudentProgressionError(
            "The selected destination section does not belong to the selected class.",
            404
        );
    }

    if (streamId) {
        const streamResult = await client.query(
            `
            SELECT st.id
            FROM streams st

            JOIN stream_academic_levels sal
                ON sal.stream_id = st.id
               AND sal.school_id = st.school_id

            WHERE st.id = $1
              AND st.school_id = $2
              AND st.is_active = TRUE
              AND sal.academic_level_id = $3
              AND sal.is_active = TRUE

            LIMIT 1;
            `,
            [streamId, schoolId, academicLevelId]
        );

        if (streamResult.rows.length === 0) {
            throw new StudentProgressionError(
                "The selected destination stream is inactive or is not assigned to the destination academic level.",
                400
            );
        }
    }

    if (subjectCombinationId) {
        const combinationResult = await client.query(
            `
            SELECT sc.id
            FROM subject_combinations sc

            JOIN streams st
                ON st.id = sc.stream_id
               AND st.school_id = sc.school_id

            JOIN stream_academic_levels sal
                ON sal.stream_id = st.id
               AND sal.school_id = st.school_id

            WHERE sc.id = $1
              AND sc.school_id = $2
              AND sc.academic_level_id = $3
              AND sc.stream_id = $4
              AND sc.is_active = TRUE
              AND st.is_active = TRUE
              AND sal.academic_level_id = $3
              AND sal.is_active = TRUE

              AND EXISTS (
                  SELECT 1
                  FROM subject_combination_subjects scs
                  WHERE scs.subject_combination_id = sc.id
                    AND scs.school_id = sc.school_id
              )

              AND NOT EXISTS (
                  SELECT 1
                  FROM subject_combination_subjects scs

                  WHERE scs.subject_combination_id = sc.id
                    AND scs.school_id = sc.school_id

                    AND NOT EXISTS (
                        SELECT 1
                        FROM subject_academic_levels sal_subject

                        WHERE sal_subject.subject_id = scs.subject_id
                          AND sal_subject.school_id = scs.school_id
                          AND sal_subject.academic_level_id = $3
                    )
              )

            LIMIT 1;
            `,
            [
                subjectCombinationId,
                schoolId,
                academicLevelId,
                streamId,
            ]
        );

        if (combinationResult.rows.length === 0) {
            throw new StudentProgressionError(
                "The selected subject combination is invalid, inactive, or does not belong to the destination stream and academic level.",
                400
            );
        }
    }

    return {
        classId,
        sectionId,
        streamId,
        subjectCombinationId,
    };
};

const validateProgressionProposal = async (
    client,
    {
        schoolId,
        sourceAcademicSessionId,
        destinationAcademicSessionId,
        studentProgressions,
        lockRows = false,
    }
) => {
    if (
        !Array.isArray(studentProgressions)
        || studentProgressions.length === 0
    ) {
        throw new StudentProgressionError(
            "At least one student progression decision is required."
        );
    }

    const studentIds = studentProgressions.map(
        (item) => item?.studentId
    );

    if (
        studentIds.some((studentId) => !studentId)
        || new Set(studentIds).size !== studentIds.length
    ) {
        throw new StudentProgressionError(
            "Every student must have a valid ID, and duplicate students are not allowed in the same progression batch."
        );
    }

    const { sourceSession, destinationSession } =
        await validateProgressionSessions(client, {
            schoolId,
            sourceAcademicSessionId,
            destinationAcademicSessionId,
        });

    const levels = await getAcademicLevelSequence(
        client,
        schoolId
    );

    const validatedStudents = [];

    for (const item of studentProgressions) {
        const outcome = item.outcome;

        if (!PROGRESSION_OUTCOMES.includes(outcome)) {
            throw new StudentProgressionError(
                `Invalid progression outcome for student ${item.studentId}.`,
                400,
                {
                    studentId: item.studentId,
                    allowedOutcomes: PROGRESSION_OUTCOMES,
                }
            );
        }

        const sourceEnrollment =
            await getEligibleSourceEnrollment(client, {
                schoolId,
                studentId: item.studentId,
                sourceAcademicSessionId,
                lockRows,
            });

        const currentLevel = levels.find(
            (level) =>
                level.id === sourceEnrollment.academic_level_id
        );

        if (!currentLevel) {
            throw new StudentProgressionError(
                `The academic level for student ${item.studentId} is not configured correctly.`,
                409
            );
        }

        let destinationLevel = null;
        let destinationPlacement = null;

        if (outcome === "promote") {
            destinationLevel = getNextAcademicLevel(
                levels,
                currentLevel.id
            );
        }

        if (outcome === "repeat") {
            destinationLevel = currentLevel;
        }

        if (
            outcome === "promote"
            || outcome === "repeat"
        ) {
            const destination = item.destination || {};

            destinationPlacement =
                await validateDestinationPlacement(client, {
                    schoolId,
                    destinationAcademicSessionId,
                    academicLevelId: destinationLevel.id,
                    classId: destination.classId,
                    sectionId: destination.sectionId,
                    streamId: destination.streamId || null,
                    subjectCombinationId:
                        destination.subjectCombinationId || null,
                });
        } else if (item.destination) {
            throw new StudentProgressionError(
                `A destination placement must not be supplied for the ${outcome} outcome.`,
                400,
                {
                    studentId: item.studentId,
                    outcome,
                }
            );
        }

        validatedStudents.push({
            studentId: item.studentId,
            admissionNo: sourceEnrollment.admission_no,
            firstName: sourceEnrollment.first_name,
            middleName: sourceEnrollment.middle_name,
            lastName: sourceEnrollment.last_name,
            sourceEnrollmentId:
                sourceEnrollment.source_enrollment_id,
            currentAcademicLevel: {
                id: currentLevel.id,
                name: currentLevel.name,
                displayOrder: currentLevel.display_order,
            },
            outcome,
            destinationAcademicLevel: destinationLevel
                ? {
                    id: destinationLevel.id,
                    name: destinationLevel.name,
                    displayOrder: destinationLevel.display_order,
                }
                : null,
            destinationPlacement,
        });
    }

    return {
        sourceSession,
        destinationSession,
        students: validatedStudents,
        totalStudents: validatedStudents.length,
        outcomeCounts: validatedStudents.reduce(
            (counts, student) => {
                counts[student.outcome] += 1;
                return counts;
            },
            {
                promote: 0,
                repeat: 0,
                graduate: 0,
                transfer: 0,
                withdraw: 0,
            }
        ),
    };
};

export const previewStudentProgression = async ({
    schoolId,
    sourceAcademicSessionId,
    destinationAcademicSessionId,
    studentProgressions,
}) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        const preview = await validateProgressionProposal(
            client,
            {
                schoolId,
                sourceAcademicSessionId,
                destinationAcademicSessionId,
                studentProgressions,
            }
        );

        await client.query("ROLLBACK");
        transactionStarted = false;

        return {
            success: true,
            message: "Student progression preview validated successfully.",
            preview,
        };
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        throw error;
    } finally {
        client.release();
    }
};

export const processStudentProgression = async ({
    schoolId,
    userId,
    sourceAcademicSessionId,
    destinationAcademicSessionId,
    studentProgressions,
}) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        const validatedProposal =
            await validateProgressionProposal(client, {
                schoolId,
                sourceAcademicSessionId,
                destinationAcademicSessionId,
                studentProgressions,
                lockRows: true,
            });

        const {
            outcomeCounts,
            totalStudents,
            students,
        } = validatedProposal;

        const batchResult = await client.query(
            `
            INSERT INTO student_progression_batches (
                school_id,
                source_academic_session_id,
                destination_academic_session_id,
                total_students,
                promoted_count,
                repeated_count,
                graduated_count,
                transferred_count,
                withdrawn_count,
                processed_by,
                processed_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
            )
            RETURNING *;
            `,
            [
                schoolId,
                sourceAcademicSessionId,
                destinationAcademicSessionId,
                totalStudents,
                outcomeCounts.promote,
                outcomeCounts.repeat,
                outcomeCounts.graduate,
                outcomeCounts.transfer,
                outcomeCounts.withdraw,
                userId || null,
            ]
        );

        const batch = batchResult.rows[0];
        const processedStudents = [];

        for (const student of students) {
            const sourceEnrollmentStatus = [
                "promote",
                "repeat",
                "graduate",
            ].includes(student.outcome)
                ? "completed"
                : student.outcome === "transfer"
                    ? "transferred"
                    : "withdrawn";

            const studentStatus = [
                "promote",
                "repeat",
            ].includes(student.outcome)
                ? "active"
                : student.outcome === "graduate"
                    ? "graduated"
                    : student.outcome === "transfer"
                        ? "transferred"
                        : "inactive";

            const enrollmentUpdate = await client.query(
                `
                UPDATE student_enrollments
                SET status = $1
                WHERE school_id = $2
                  AND id = $3
                  AND student_id = $4
                  AND academic_session_id = $5
                  AND status = 'active'
                RETURNING id;
                `,
                [
                    sourceEnrollmentStatus,
                    schoolId,
                    student.sourceEnrollmentId,
                    student.studentId,
                    sourceAcademicSessionId,
                ]
            );

            if (enrollmentUpdate.rowCount !== 1) {
                throw new StudentProgressionError(
                    `Could not safely update the source enrollment for student ${student.studentId}. The progression batch has been cancelled.`,
                    409
                );
            }

            const studentUpdate = await client.query(
                `
                UPDATE students
                SET status = $1
                WHERE school_id = $2
                  AND id = $3
                  AND status = 'active'
                RETURNING id;
                `,
                [
                    studentStatus,
                    schoolId,
                    student.studentId,
                ]
            );

            if (studentUpdate.rowCount !== 1) {
                throw new StudentProgressionError(
                    `Could not safely update the status for student ${student.studentId}. The progression batch has been cancelled.`,
                    409
                );
            }

            let destinationEnrollmentId = null;

            if (student.destinationPlacement) {
                const placement = student.destinationPlacement;

                const enrollmentResult = await client.query(
                    `
                    INSERT INTO student_enrollments (
                        school_id,
                        student_id,
                        academic_session_id,
                        class_id,
                        section_id,
                        status,
                        enrolled_at,
                        stream_id,
                        subject_combination_id
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, 'active',
                        NOW(), $6, $7
                    )
                    RETURNING id;
                    `,
                    [
                        schoolId,
                        student.studentId,
                        destinationAcademicSessionId,
                        placement.classId,
                        placement.sectionId,
                        placement.streamId,
                        placement.subjectCombinationId,
                    ]
                );

                destinationEnrollmentId =
                    enrollmentResult.rows[0].id;

                await createStudentFinancialAccountForCurrentTerm(
                    client,
                    {
                        schoolId,
                        studentId: student.studentId,
                        enrollmentId: destinationEnrollmentId,
                    }
                );
            }

            await client.query(
                `
                INSERT INTO student_progression_records (
                    school_id,
                    batch_id,
                    student_id,
                    source_enrollment_id,
                    destination_enrollment_id,
                    source_academic_session_id,
                    destination_academic_session_id,
                    outcome
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
                `,
                [
                    schoolId,
                    batch.id,
                    student.studentId,
                    student.sourceEnrollmentId,
                    destinationEnrollmentId,
                    sourceAcademicSessionId,
                    destinationAcademicSessionId,
                    student.outcome,
                ]
            );

            processedStudents.push({
                studentId: student.studentId,
                admissionNo: student.admissionNo,
                outcome: student.outcome,
                sourceEnrollmentId: student.sourceEnrollmentId,
                destinationEnrollmentId,
            });
        }

        await recordActivity({
            schoolId,
            userId,
            action: "student_progression",
            description:
                `Processed student progression for ${totalStudents} students: `
                + `${outcomeCounts.promote} promoted, `
                + `${outcomeCounts.repeat} repeated, `
                + `${outcomeCounts.graduate} graduated, `
                + `${outcomeCounts.transfer} transferred, `
                + `${outcomeCounts.withdraw} withdrawn.`,
            client,
        });

        await client.query("COMMIT");
        transactionStarted = false;

        return {
            success: true,
            message: "Student progression processed successfully.",
            batch,
            processedStudents,
        };
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        throw error;
    } finally {
        client.release();
    }
};

export const getStudentProgressionHistory = async ({
    schoolId,
    page = 1,
    limit = 20,
}) => {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(
        100,
        Math.max(1, Number(limit) || 20)
    );
    const offset = (currentPage - 1) * pageSize;

    const client = await pool.connect();

    try {
        const countResult = await client.query(
            `
            SELECT COUNT(*)::INTEGER AS total_batches
            FROM student_progression_batches
            WHERE school_id = $1;
            `,
            [schoolId]
        );

        const totalBatches = countResult.rows[0].total_batches;

        const result = await client.query(
            `
            WITH batches AS (
                SELECT *
                FROM student_progression_batches
                WHERE school_id = $1
                ORDER BY processed_at DESC, id DESC
                LIMIT $2
                OFFSET $3
            )

            SELECT
                b.id AS batch_id,
                b.status AS batch_status,
                b.total_students,
                b.promoted_count,
                b.repeated_count,
                b.graduated_count,
                b.transferred_count,
                b.withdrawn_count,
                b.processed_by,
                b.processed_at,

                source_session.id AS source_session_id,
                source_session.name AS source_session_name,

                destination_session.id AS destination_session_id,
                destination_session.name AS destination_session_name,

                r.id AS progression_record_id,
                r.outcome,
                r.created_at AS record_created_at,

                s.id AS student_id,
                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                se.id AS source_enrollment_id,
                source_class.name AS source_class_name,
                source_level.id AS source_academic_level_id,
                source_level.name AS source_academic_level_name,

                de.id AS destination_enrollment_id,
                destination_class.name AS destination_class_name,
                destination_level.id AS destination_academic_level_id,
                destination_level.name AS destination_academic_level_name

            FROM batches b

            JOIN academic_sessions source_session
                ON source_session.id = b.source_academic_session_id
               AND source_session.school_id = b.school_id

            JOIN academic_sessions destination_session
                ON destination_session.id = b.destination_academic_session_id
               AND destination_session.school_id = b.school_id

            JOIN student_progression_records r
                ON r.batch_id = b.id
               AND r.school_id = b.school_id

            JOIN students s
                ON s.id = r.student_id
               AND s.school_id = r.school_id

            JOIN student_enrollments se
                ON se.id = r.source_enrollment_id
               AND se.school_id = r.school_id

            JOIN classes source_class
                ON source_class.id = se.class_id
               AND source_class.school_id = se.school_id

            JOIN academic_levels source_level
                ON source_level.id = source_class.academic_level_id
               AND source_level.school_id = source_class.school_id

            LEFT JOIN student_enrollments de
                ON de.id = r.destination_enrollment_id
               AND de.school_id = r.school_id

            LEFT JOIN classes destination_class
                ON destination_class.id = de.class_id
               AND destination_class.school_id = de.school_id

            LEFT JOIN academic_levels destination_level
                ON destination_level.id = destination_class.academic_level_id
               AND destination_level.school_id = destination_class.school_id

            WHERE b.school_id = $1

            ORDER BY
                b.processed_at DESC,
                r.created_at ASC,
                s.last_name ASC,
                s.first_name ASC;
            `,
            [schoolId, pageSize, offset]
        );

        const batches = new Map();

        for (const row of result.rows) {
            if (!batches.has(row.batch_id)) {
                batches.set(row.batch_id, {
                    id: row.batch_id,
                    status: row.batch_status,
                    sourceSession: {
                        id: row.source_session_id,
                        name: row.source_session_name,
                    },
                    destinationSession: {
                        id: row.destination_session_id,
                        name: row.destination_session_name,
                    },
                    totalStudents: row.total_students,
                    outcomeCounts: {
                        promote: row.promoted_count,
                        repeat: row.repeated_count,
                        graduate: row.graduated_count,
                        transfer: row.transferred_count,
                        withdraw: row.withdrawn_count,
                    },
                    processedBy: row.processed_by,
                    processedAt: row.processed_at,
                    students: [],
                });
            }

            batches.get(row.batch_id).students.push({
                progressionRecordId: row.progression_record_id,
                studentId: row.student_id,
                admissionNo: row.admission_no,
                firstName: row.first_name,
                middleName: row.middle_name,
                lastName: row.last_name,
                outcome: row.outcome,
                sourceEnrollment: {
                    id: row.source_enrollment_id,
                    className: row.source_class_name,
                    academicLevel: row.source_academic_level_name,
                },
                destinationEnrollment: row.destination_enrollment_id
                    ? {
                        id: row.destination_enrollment_id,
                        className: row.destination_class_name,
                        academicLevel:
                            row.destination_academic_level_name,
                    }
                    : null,
                createdAt: row.record_created_at,
            });
        }

        return {
            success: true,
            history: Array.from(batches.values()),
            pagination: {
                page: currentPage,
                limit: pageSize,
                totalBatches,
                totalPages: Math.ceil(totalBatches / pageSize),
            },
        };
    } finally {
        client.release();
    }
};

export const prepareStudentProgression = async ({
    schoolId,
    sourceAcademicSessionId,
    destinationAcademicSessionId = null,
}) => {
    const client = await pool.connect();

    try {
        const sessionResult = await client.query(
            `
            SELECT
                id,
                name,
                start_date,
                end_date,
                is_current
            FROM academic_sessions
            WHERE school_id = $1
            ORDER BY start_date DESC, name DESC;
            `,
            [schoolId]
        );

        const sessions = sessionResult.rows;

        const sourceSession = sessions.find(
            (session) =>
                session.id === sourceAcademicSessionId
        );

        if (!sourceSession) {
            throw new StudentProgressionError(
                "The selected source academic session was not found for this school.",
                404
            );
        }

        let destinationSession = null;

        if (destinationAcademicSessionId) {
            const validatedSessions =
                await validateProgressionSessions(client, {
                    schoolId,
                    sourceAcademicSessionId,
                    destinationAcademicSessionId,
                });

            destinationSession =
                validatedSessions.destinationSession;
        }

        const levels = await getAcademicLevelSequence(
            client,
            schoolId
        );

        const studentResult = await client.query(
            `
            SELECT
                s.id AS student_id,
                s.admission_no,
                s.first_name,
                s.middle_name,
                s.last_name,

                se.id AS source_enrollment_id,
                se.class_id,
                se.section_id,
                se.stream_id,
                se.subject_combination_id,

                c.name AS class_name,
                al.id AS academic_level_id,
                al.name AS academic_level_name,
                al.display_order,

                sec.name AS section_name,
                st.name AS stream_name,
                sc.name AS subject_combination_name

            FROM students s

            JOIN student_enrollments se
                ON se.student_id = s.id
               AND se.school_id = s.school_id

            JOIN classes c
                ON c.id = se.class_id
               AND c.school_id = se.school_id
               AND c.academic_session_id = se.academic_session_id

            JOIN academic_levels al
                ON al.id = c.academic_level_id
               AND al.school_id = c.school_id

            LEFT JOIN sections sec
                ON sec.id = se.section_id
               AND sec.school_id = se.school_id

            LEFT JOIN streams st
                ON st.id = se.stream_id
               AND st.school_id = se.school_id

            LEFT JOIN subject_combinations sc
                ON sc.id = se.subject_combination_id
               AND sc.school_id = se.school_id

            WHERE s.school_id = $1
              AND se.academic_session_id = $2
              AND s.status = 'active'
              AND se.status = 'active'

            ORDER BY
                al.display_order ASC,
                c.name ASC,
                s.last_name ASC,
                s.first_name ASC;
            `,
            [schoolId, sourceAcademicSessionId]
        );

        let destinationOptions = {
            classes: [],
            streams: [],
            subjectCombinations: [],
        };

        if (destinationSession) {
            const classResult = await client.query(
                `
                SELECT
                    c.id AS class_id,
                    c.name AS class_name,
                    c.academic_level_id,
                    al.name AS academic_level_name,
                    al.display_order,

                    sec.id AS section_id,
                    sec.name AS section_name,
                    sec.capacity

                FROM classes c

                JOIN academic_levels al
                    ON al.id = c.academic_level_id
                   AND al.school_id = c.school_id

                LEFT JOIN sections sec
                    ON sec.class_id = c.id
                   AND sec.school_id = c.school_id

                WHERE c.school_id = $1
                  AND c.academic_session_id = $2

                ORDER BY
                    al.display_order ASC,
                    c.name ASC,
                    sec.name ASC;
                `,
                [schoolId, destinationAcademicSessionId]
            );

            const classes = new Map();

            for (const row of classResult.rows) {
                if (!classes.has(row.class_id)) {
                    classes.set(row.class_id, {
                        id: row.class_id,
                        name: row.class_name,
                        academicLevel: {
                            id: row.academic_level_id,
                            name: row.academic_level_name,
                            displayOrder: row.display_order,
                        },
                        sections: [],
                    });
                }

                if (row.section_id) {
                    classes.get(row.class_id).sections.push({
                        id: row.section_id,
                        name: row.section_name,
                        capacity: row.capacity,
                    });
                }
            }

            const streamResult = await client.query(
                `
                SELECT
                    st.id,
                    st.name,
                    st.code,
                    sal.academic_level_id

                FROM streams st

                JOIN stream_academic_levels sal
                    ON sal.stream_id = st.id
                   AND sal.school_id = st.school_id

                WHERE st.school_id = $1
                  AND st.is_active = TRUE
                  AND sal.is_active = TRUE

                ORDER BY st.name ASC;
                `,
                [schoolId]
            );

            const combinationResult = await client.query(
                `
                SELECT
                    sc.id,
                    sc.name,
                    sc.code,
                    sc.academic_level_id,
                    sc.stream_id,
                    COUNT(scs.subject_id)::INTEGER AS subject_count

                FROM subject_combinations sc

                JOIN streams st
                    ON st.id = sc.stream_id
                   AND st.school_id = sc.school_id

                JOIN stream_academic_levels sal
                    ON sal.stream_id = st.id
                   AND sal.school_id = st.school_id
                   AND sal.academic_level_id = sc.academic_level_id

                LEFT JOIN subject_combination_subjects scs
                    ON scs.subject_combination_id = sc.id
                   AND scs.school_id = sc.school_id

                WHERE sc.school_id = $1
                  AND sc.is_active = TRUE
                  AND st.is_active = TRUE
                  AND sal.is_active = TRUE

                GROUP BY
                    sc.id,
                    sc.name,
                    sc.code,
                    sc.academic_level_id,
                    sc.stream_id

                HAVING COUNT(scs.subject_id) > 0

                AND NOT EXISTS (
                        SELECT 1
                        FROM subject_combination_subjects invalid_scs

                        WHERE invalid_scs.subject_combination_id = sc.id
                        AND invalid_scs.school_id = sc.school_id

                        AND NOT EXISTS (
                            SELECT 1
                            FROM subject_academic_levels sal_subject

                            WHERE sal_subject.subject_id = invalid_scs.subject_id
                                AND sal_subject.school_id = invalid_scs.school_id
                                AND sal_subject.academic_level_id = sc.academic_level_id
                        )
                    )

                ORDER BY sc.name ASC;
                `,
                [schoolId]
            );

            destinationOptions = {
                classes: Array.from(classes.values()),
                streams: streamResult.rows.map((stream) => ({
                    id: stream.id,
                    name: stream.name,
                    code: stream.code,
                    academicLevelId: stream.academic_level_id,
                })),
                subjectCombinations: combinationResult.rows.map(
                    (combination) => ({
                        id: combination.id,
                        name: combination.name,
                        code: combination.code,
                        academicLevelId:
                            combination.academic_level_id,
                        streamId: combination.stream_id,
                        subjectCount: combination.subject_count,
                    })
                ),
            };
        }

        return {
            success: true,
            sourceSession,
            destinationSession,
            availableSessions: sessions,
            academicLevels: levels.map((level) => ({
                id: level.id,
                name: level.name,
                category: level.category,
                displayOrder: level.display_order,
            })),
            eligibleStudents: studentResult.rows.map((student) => ({
                studentId: student.student_id,
                admissionNo: student.admission_no,
                firstName: student.first_name,
                middleName: student.middle_name,
                lastName: student.last_name,
                sourceEnrollmentId:
                    student.source_enrollment_id,
                currentPlacement: {
                    classId: student.class_id,
                    className: student.class_name,
                    sectionId: student.section_id,
                    sectionName: student.section_name,
                    academicLevelId: student.academic_level_id,
                    academicLevelName:
                        student.academic_level_name,
                    displayOrder: student.display_order,
                    streamId: student.stream_id,
                    streamName: student.stream_name,
                    subjectCombinationId:
                        student.subject_combination_id,
                    subjectCombinationName:
                        student.subject_combination_name,
                },
            })),
            destinationOptions,
            totalEligibleStudents: studentResult.rows.length,
        };
    } finally {
        client.release();
    }
};
