
import pool from "../config/db.js";
import { recordActivity } from "./activityLogService.js";

export class StudentPromotionCriteriaManagementError extends Error {
    constructor(message, statusCode = 400, details = null) {
        super(message);
        this.name = "StudentPromotionCriteriaManagementError";
        this.statusCode = statusCode;
        this.details = details;
    }
}

const createManagementError = (
    message,
    statusCode = 400,
    details = null
) => {
    throw new StudentPromotionCriteriaManagementError(
        message,
        statusCode,
        details
    );
};


const withTransaction = async (callback) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await callback(client);

        await client.query("COMMIT");

        return result;
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            // Preserve the original operation error if rollback also fails.
            error.rollbackError = rollbackError;
        }

        if (error.code === "23505") {
            if (
                error.constraint ===
                "unique_school_default_promotion_criteria"
            ) {
                createManagementError(
                    "A school-wide default promotion criteria configuration already exists.",
                    409
                );
            }

            if (
                error.constraint ===
                "unique_level_promotion_criteria"
            ) {
                createManagementError(
                    "A promotion criteria configuration already exists for this academic level.",
                    409
                );
            }

            if (
                error.constraint ===
                "unique_promotion_criteria_version_number"
            ) {
                createManagementError(
                    "This promotion criteria version number already exists. Please retry the operation.",
                    409
                );
            }
        }

        throw error;
    } finally {
        client.release();
    }
};


const validateUuid = (value, fieldName) => {
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
        typeof value !== "string"
        || !uuidPattern.test(value)
    ) {
        createManagementError(
            `${fieldName} must be a valid UUID.`
        );
    }

    return value;
};



const validateThresholds = ({
    minimumSessionAverage,
    subjectPassMark,
    minimumSubjectsPassed,
}) => {
    const requiredValues = [
        {
            value: minimumSessionAverage,
            name: "Minimum session average",
        },
        {
            value: subjectPassMark,
            name: "Subject pass mark",
        },
        {
            value: minimumSubjectsPassed,
            name: "Minimum subjects passed",
        },
    ];

    for (const item of requiredValues) {
        if (
            item.value === null
            || item.value === undefined
            || (
                typeof item.value === "string"
                && item.value.trim() === ""
            )
            || !["number", "string"].includes(typeof item.value)
        ) {
            createManagementError(
                `${item.name} is required and must be a valid number.`
            );
        }
    }

    const average = Number(minimumSessionAverage);
    const passMark = Number(subjectPassMark);
    const subjectsPassed = Number(minimumSubjectsPassed);

    if (
        !Number.isFinite(average)
        || average < 0
        || average > 100
    ) {
        createManagementError(
            "Minimum session average must be between 0 and 100."
        );
    }

    if (
        !Number.isFinite(passMark)
        || passMark < 0
        || passMark > 100
    ) {
        createManagementError(
            "Subject pass mark must be between 0 and 100."
        );
    }

    if (
        !Number.isInteger(subjectsPassed)
        || subjectsPassed < 0
    ) {
        createManagementError(
            "Minimum subjects passed must be a non-negative whole number."
        );
    }

    return {
        minimumSessionAverage: average,
        subjectPassMark: passMark,
        minimumSubjectsPassed: subjectsPassed,
    };
};


const normalizePositiveIntegers = (values, fieldName) => {
    if (!Array.isArray(values)) {
        createManagementError(
            `${fieldName} must be an array.`
        );
    }

    const normalized = values.map(Number);

    if (
        normalized.some(
            (value) =>
                !Number.isInteger(value)
                || value <= 0
        )
    ) {
        createManagementError(
            `${fieldName} must contain positive whole numbers only.`
        );
    }

    if (new Set(normalized).size !== normalized.length) {
        createManagementError(
            `${fieldName} cannot contain duplicates.`
        );
    }

    return normalized.sort((a, b) => a - b);
};

const normalizeUuidArray = (values, fieldName) => {
    if (!Array.isArray(values)) {
        createManagementError(
            `${fieldName} must be an array.`
        );
    }

    const normalized = values.map((value) =>
        validateUuid(value, fieldName)
    );

    if (new Set(normalized).size !== normalized.length) {
        createManagementError(
            `${fieldName} cannot contain duplicates.`
        );
    }

    return normalized;
};

const getValidActiveSubjectCombinations = async (
    client,
    {
        schoolId,
        academicLevelIds,
    }
) => {
    const result = await client.query(
        `
        SELECT
            sc.id,
            sc.name,
            sc.academic_level_id,
            sc.stream_id,
            st.name AS stream_name,

            ARRAY_AGG(
                scs.subject_id
                ORDER BY scs.subject_id
            ) AS subject_ids

        FROM subject_combinations sc

        INNER JOIN streams st
            ON st.id = sc.stream_id
           AND st.school_id = sc.school_id
           AND st.is_active = TRUE

        INNER JOIN stream_academic_levels sal
            ON sal.stream_id = st.id
           AND sal.school_id = st.school_id
           AND sal.academic_level_id = sc.academic_level_id
           AND sal.is_active = TRUE

        INNER JOIN subject_combination_subjects scs
            ON scs.subject_combination_id = sc.id
           AND scs.school_id = sc.school_id

        WHERE sc.school_id = $1
          AND sc.academic_level_id = ANY($2::UUID[])
          AND sc.is_active = TRUE

        GROUP BY
            sc.id,
            sc.name,
            sc.academic_level_id,
            sc.stream_id,
            st.name

        HAVING COUNT(scs.subject_id) > 0

           AND NOT EXISTS (
                SELECT 1
                FROM subject_combination_subjects invalid_scs

                WHERE invalid_scs.subject_combination_id = sc.id
                  AND invalid_scs.school_id = sc.school_id

                  AND NOT EXISTS (
                      SELECT 1
                      FROM subject_academic_levels subject_level

                      WHERE subject_level.subject_id =
                          invalid_scs.subject_id

                        AND subject_level.school_id =
                            invalid_scs.school_id

                        AND subject_level.academic_level_id =
                            sc.academic_level_id
                  )
           )

        ORDER BY
            sc.academic_level_id ASC,
            st.name ASC,
            sc.name ASC;
        `,
        [schoolId, academicLevelIds]
    );

    return result.rows;
};

const validateCriteriaDetails = async (
    client,
    {
        schoolId,
        academicLevelId,
        termDisplayOrders,
        subjectIds,
        minimumSubjectsPassed,
    }
) => {
    const normalizedTerms = normalizePositiveIntegers(
        termDisplayOrders,
        "Required terms"
    );

    const normalizedSubjects = normalizeUuidArray(
        subjectIds,
        "Required subjects"
    );

    if (normalizedTerms.length === 0) {
        createManagementError(
            "Select at least one required term."
        );
    }

    if (normalizedSubjects.length === 0) {
        createManagementError(
            "Select at least one required subject."
        );
    }

    if (minimumSubjectsPassed > normalizedSubjects.length) {
        createManagementError(
            "Minimum subjects passed cannot exceed the number of required subjects."
        );
    }

    const levelResult = await client.query(
        `
        SELECT
             id,
            name,
            requires_subject_combination
        FROM academic_levels
        WHERE school_id = $1
        ORDER BY display_order ASC, name ASC;
        `,
        [schoolId]
    );

    if (levelResult.rows.length === 0) {
        createManagementError(
            "Create at least one academic level before configuring promotion criteria.",
            409
        );
    }

    if (
        academicLevelId
        && !levelResult.rows.some(
            (level) => level.id === academicLevelId
        )
    ) {
        createManagementError(
            "The selected academic level does not belong to this school.",
            404
        );
    }

    const combinationRequiredLevels =
    levelResult.rows.filter(
        (level) =>
            level.requires_subject_combination
            && (
                !academicLevelId
                || level.id === academicLevelId
            )
    );

    
    const subjectResult = await client.query(
        `
        SELECT
            s.id,

            COUNT(DISTINCT sal.academic_level_id)::INTEGER
                AS assigned_level_count,

            COUNT(DISTINCT sal.academic_level_id)
                FILTER (
                    WHERE sal.academic_level_id = $3::UUID
                )::INTEGER AS selected_level_assignment_count

        FROM subjects s

        LEFT JOIN subject_academic_levels sal
            ON sal.subject_id = s.id
           AND sal.school_id = s.school_id

        WHERE s.school_id = $1
          AND s.id = ANY($2::UUID[])

        GROUP BY s.id;
        `,
        [schoolId, normalizedSubjects, academicLevelId]
    );


    if (subjectResult.rows.length !== normalizedSubjects.length) {
        createManagementError(
            "One or more selected subjects do not belong to this school."
        );
    }

   
    const invalidSubjects = subjectResult.rows.filter(
        (subject) => {
            if (academicLevelId) {
                return Number(
                    subject.selected_level_assignment_count
                ) === 0;
            }

            return Number(subject.assigned_level_count)
                !== levelResult.rows.length;
        }
    );


    if (invalidSubjects.length > 0) {
        createManagementError(
            academicLevelId
                ? "Every selected subject must be assigned to the selected academic level."
                : "School-wide criteria can only use subjects assigned to every academic level.",
            400,
            {
                invalidSubjectIds: invalidSubjects.map(
                    (subject) => subject.id
                ),
            }
        );
    }

    let minimumApplicableSubjectCount = normalizedSubjects.length;
let applicableCombinations = [];

if (combinationRequiredLevels.length > 0) {
    const combinations = await getValidActiveSubjectCombinations(
        client,
        {
            schoolId,
            academicLevelIds: combinationRequiredLevels.map(
                (level) => level.id
            ),
        }
    );

    const combinationsByLevel = new Map();

    for (const combination of combinations) {
        if (!combinationsByLevel.has(combination.academic_level_id)) {
            combinationsByLevel.set(
                combination.academic_level_id,
                []
            );
        }

        combinationsByLevel
            .get(combination.academic_level_id)
            .push(combination);
    }

    const levelsWithoutValidCombinations =
        combinationRequiredLevels.filter(
            (level) =>
                !combinationsByLevel.has(level.id)
        );

    if (levelsWithoutValidCombinations.length > 0) {
        createManagementError(
            "Promotion criteria cannot be configured for academic levels that require subject combinations until each level has at least one valid active subject combination.",
            409,
            {
                academicLevels: levelsWithoutValidCombinations.map(
                    (level) => ({
                        id: level.id,
                        name: level.name,
                    })
                ),
            }
        );
    }

    applicableCombinations = combinations.map(
        (combination) => {
            const combinationSubjectIds = new Set(
                combination.subject_ids
            );

            const applicableSubjectIds =
                normalizedSubjects.filter(
                    (subjectId) =>
                        combinationSubjectIds.has(subjectId)
                );

            return {
                ...combination,
                applicable_subject_ids: applicableSubjectIds,
                applicable_subject_count:
                    applicableSubjectIds.length,
            };
        }
    );

    const emptyIntersections = applicableCombinations.filter(
        (combination) =>
            combination.applicable_subject_count === 0
    );

    if (emptyIntersections.length > 0) {
        createManagementError(
            "Every active subject combination must share at least one subject with the configured promotion criteria subjects.",
            400,
            {
                combinations: emptyIntersections.map(
                    (combination) => ({
                        id: combination.id,
                        name: combination.name,
                        streamName: combination.stream_name,
                    })
                ),
            }
        );
    }

    minimumApplicableSubjectCount = Math.min(
        ...applicableCombinations.map(
            (combination) =>
                combination.applicable_subject_count
        )
    );

    if (
        minimumSubjectsPassed >
        minimumApplicableSubjectCount
    ) {
        createManagementError(
            `Minimum subjects passed cannot exceed ${minimumApplicableSubjectCount}, the smallest applicable subject count across the active subject combinations.`,
            400,
            {
                maximumMinimumSubjectsPassed:
                    minimumApplicableSubjectCount,
            }
        );
    }
}

    // Every configured term order must exist in each session
    // that has at least one term configured.
    const sessionCoverageResult = await client.query(
        `
        SELECT
            s.id AS session_id,
            s.name AS session_name,
            COALESCE(
                ARRAY_AGG(DISTINCT t.display_order)
                    FILTER (WHERE t.id IS NOT NULL),
                ARRAY[]::INTEGER[]
            ) AS configured_term_orders

        FROM academic_sessions s

        LEFT JOIN terms t
            ON t.school_id = s.school_id
           AND t.academic_session_id = s.id

        WHERE s.school_id = $1

        GROUP BY s.id, s.name, s.start_date

        ORDER BY s.start_date DESC;
        `,
        [schoolId]
    );

    const missingTermCoverage =
        sessionCoverageResult.rows
            .filter(
                (session) =>
                    session.configured_term_orders.length > 0
            )
            .map((session) => {
                const availableOrders =
                    session.configured_term_orders.map(Number);

                const missingOrders = normalizedTerms.filter(
                    (order) => !availableOrders.includes(order)
                );

                return {
                    sessionId: session.session_id,
                    sessionName: session.session_name,
                    missingTermOrders: missingOrders,
                };
            })
            .filter(
                (session) =>
                    session.missingTermOrders.length > 0
            );

    if (missingTermCoverage.length > 0) {
        createManagementError(
            "One or more required terms are missing from academic sessions that already have terms configured.",
            409,
            { missingTermCoverage }
        );
    }

    return {
        termDisplayOrders: normalizedTerms,
        subjectIds: normalizedSubjects,
        minimumApplicableSubjectCount,
    };
};


export const validateAcademicLevelCombinationRequirement = async (
    client,
    {
        schoolId,
        academicLevelId,
    }
) => {
    const levelCriteriaResult = await client.query(
        `
        SELECT id, academic_level_id
        FROM student_promotion_criteria
        WHERE school_id = $1
          AND academic_level_id = $2
          AND is_active = TRUE
        LIMIT 1;
        `,
        [schoolId, academicLevelId]
    );

    let criteria = levelCriteriaResult.rows[0] || null;

    // An active level-specific configuration takes precedence.
    // Otherwise, check the active school-wide default.
    if (!criteria) {
        const defaultCriteriaResult = await client.query(
            `
            SELECT id, academic_level_id
            FROM student_promotion_criteria
            WHERE school_id = $1
              AND academic_level_id IS NULL
              AND is_active = TRUE
            LIMIT 1;
            `,
            [schoolId]
        );

        criteria = defaultCriteriaResult.rows[0] || null;
    }

    // No active criteria applies to this level yet.
    // Future criteria creation or activation will run validation.
    if (!criteria) {
        return;
    }

    const versionResult = await client.query(
        `
        SELECT
            id,
            minimum_subjects_passed
        FROM student_promotion_criteria_versions
        WHERE school_id = $1
          AND criteria_id = $2
          AND is_sealed = TRUE
        ORDER BY version_number DESC
        LIMIT 1;
        `,
        [schoolId, criteria.id]
    );

    if (versionResult.rows.length === 0) {
        createManagementError(
            "The active promotion criteria configuration has no sealed version. Review its configuration before enabling subject combinations.",
            409
        );
    }

    const latestVersion = versionResult.rows[0];

    const [termResult, subjectResult] = await Promise.all([
        client.query(
            `
            SELECT term_display_order
            FROM student_promotion_criteria_terms
            WHERE school_id = $1
              AND criteria_version_id = $2
            ORDER BY term_display_order ASC;
            `,
            [schoolId, latestVersion.id]
        ),

        client.query(
            `
            SELECT subject_id
            FROM student_promotion_criteria_subjects
            WHERE school_id = $1
              AND criteria_version_id = $2
            ORDER BY subject_id ASC;
            `,
            [schoolId, latestVersion.id]
        ),
    ]);

    await validateCriteriaDetails(client, {
        schoolId,
        academicLevelId: criteria.academic_level_id,
        termDisplayOrders: termResult.rows.map(
            (row) => row.term_display_order
        ),
        subjectIds: subjectResult.rows.map(
            (row) => row.subject_id
        ),
        minimumSubjectsPassed: Number(
            latestVersion.minimum_subjects_passed
        ),
    });
};


export const getStudentPromotionCriteriaSupportingData = async (
    schoolId
) => {
    return withTransaction(async (client) => {
        const levelResult = await client.query(
            `
            SELECT
                id,
                name,
                category,
                display_order,
                requires_subject_combination

            FROM academic_levels

            WHERE school_id = $1

            ORDER BY display_order ASC, name ASC;
            `,
            [schoolId]
        );

                const combinationRequiredLevels =
            levelResult.rows.filter(
                (level) => level.requires_subject_combination
            );

        const combinations =
            combinationRequiredLevels.length > 0
                ? await getValidActiveSubjectCombinations(
                    client,
                    {
                        schoolId,
                        academicLevelIds:
                            combinationRequiredLevels.map(
                                (level) => level.id
                            ),
                    }
                )
                : [];

        const subjectResult = await client.query(
            `
            SELECT
                s.id,
                s.name,
                s.code,
                s.category,
                s.is_core,

                COALESCE(
                    JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                            'id', al.id,
                            'name', al.name,
                            'display_order', al.display_order
                        )
                        ORDER BY al.display_order ASC
                    ) FILTER (WHERE al.id IS NOT NULL),
                    '[]'::JSONB
                ) AS academic_levels

            FROM subjects s

            LEFT JOIN subject_academic_levels sal
                ON sal.subject_id = s.id
               AND sal.school_id = s.school_id

            LEFT JOIN academic_levels al
                ON al.id = sal.academic_level_id
               AND al.school_id = sal.school_id

            WHERE s.school_id = $1

            GROUP BY s.id

            ORDER BY s.name ASC;
            `,
            [schoolId]
        );

        const sessionResult = await client.query(
            `
            SELECT
                s.id,
                s.name,
                s.is_current,
                s.start_date,
                s.end_date,

                COALESCE(
                    JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                            'id', t.id,
                            'name', t.name,
                            'display_order', t.display_order,
                            'is_current', t.is_current
                        )
                        ORDER BY t.display_order ASC
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'::JSONB
                ) AS terms

            FROM academic_sessions s

            LEFT JOIN terms t
                ON t.school_id = s.school_id
               AND t.academic_session_id = s.id

            WHERE s.school_id = $1

            GROUP BY s.id

            ORDER BY s.start_date DESC;
            `,
            [schoolId]
        );

        const levelCount = levelResult.rows.length;

        const commonSubjects = subjectResult.rows
            .filter(
                (subject) =>
                    subject.academic_levels.length === levelCount
                    && levelCount > 0
            )
            .map((subject) => subject.id);

        return {
            levels: levelResult.rows,
            subjects: subjectResult.rows,
            combinations,
            commonSubjectIds: commonSubjects,
            sessions: sessionResult.rows,
        };
    });
};



export const getStudentPromotionCriteriaConfigurations = async (
    schoolId
) => {
    return withTransaction(async (client) => {
        const result = await client.query(
            `
            SELECT
                c.id,
                c.academic_level_id,
                c.is_active,
                c.created_at,
                c.updated_at,

                al.name AS academic_level_name,

                sealed.id AS sealed_version_id,
                sealed.version_number AS sealed_version_number,
                sealed.minimum_session_average AS sealed_minimum_session_average,
                sealed.subject_pass_mark AS sealed_subject_pass_mark,
                sealed.minimum_subjects_passed AS sealed_minimum_subjects_passed,

                draft.id AS draft_version_id,
                draft.version_number AS draft_version_number,
                draft.minimum_session_average AS draft_minimum_session_average,
                draft.subject_pass_mark AS draft_subject_pass_mark,
                draft.minimum_subjects_passed AS draft_minimum_subjects_passed,

                COALESCE(sealed_terms.term_display_orders, '[]'::JSONB)
                    AS sealed_term_display_orders,

                COALESCE(sealed_subjects.subject_ids, '[]'::JSONB)
                    AS sealed_subject_ids,

                COALESCE(draft_terms.term_display_orders, '[]'::JSONB)
                    AS draft_term_display_orders,

                COALESCE(draft_subjects.subject_ids, '[]'::JSONB)
                    AS draft_subject_ids

            FROM student_promotion_criteria c

            LEFT JOIN academic_levels al
                ON al.id = c.academic_level_id
               AND al.school_id = c.school_id

            LEFT JOIN LATERAL (
                SELECT *
                FROM student_promotion_criteria_versions v
                WHERE v.school_id = c.school_id
                  AND v.criteria_id = c.id
                  AND v.is_sealed = TRUE
                ORDER BY v.version_number DESC
                LIMIT 1
            ) sealed ON TRUE

            LEFT JOIN LATERAL (
                SELECT *
                FROM student_promotion_criteria_versions v
                WHERE v.school_id = c.school_id
                  AND v.criteria_id = c.id
                  AND v.is_sealed = FALSE
                ORDER BY v.version_number DESC
                LIMIT 1
            ) draft ON TRUE

            LEFT JOIN LATERAL (
                SELECT JSONB_AGG(
                    ct.term_display_order
                    ORDER BY ct.term_display_order
                ) AS term_display_orders
                FROM student_promotion_criteria_terms ct
                WHERE ct.school_id = c.school_id
                  AND ct.criteria_version_id = sealed.id
            ) sealed_terms ON TRUE

            LEFT JOIN LATERAL (
                SELECT JSONB_AGG(
                    cs.subject_id
                    ORDER BY cs.subject_id
                ) AS subject_ids
                FROM student_promotion_criteria_subjects cs
                WHERE cs.school_id = c.school_id
                  AND cs.criteria_version_id = sealed.id
            ) sealed_subjects ON TRUE

            LEFT JOIN LATERAL (
                SELECT JSONB_AGG(
                    ct.term_display_order
                    ORDER BY ct.term_display_order
                ) AS term_display_orders
                FROM student_promotion_criteria_terms ct
                WHERE ct.school_id = c.school_id
                  AND ct.criteria_version_id = draft.id
            ) draft_terms ON TRUE

            LEFT JOIN LATERAL (
                SELECT JSONB_AGG(
                    cs.subject_id
                    ORDER BY cs.subject_id
                ) AS subject_ids
                FROM student_promotion_criteria_subjects cs
                WHERE cs.school_id = c.school_id
                  AND cs.criteria_version_id = draft.id
            ) draft_subjects ON TRUE

            WHERE c.school_id = $1

            ORDER BY
                c.academic_level_id NULLS FIRST,
                al.display_order ASC;
            `,
            [schoolId]
        );

        return result.rows;
    });
};

export const createStudentPromotionCriteria = async ({
    schoolId,
    userId,
    academicLevelId = null,
    minimumSessionAverage,
    subjectPassMark,
    minimumSubjectsPassed,
    termDisplayOrders,
    subjectIds,
}) => {
    validateUuid(schoolId, "School ID");
    validateUuid(userId, "User ID");

    if (academicLevelId !== null) {
        validateUuid(academicLevelId, "Academic level ID");
    }

    const thresholds = validateThresholds({
        minimumSessionAverage,
        subjectPassMark,
        minimumSubjectsPassed,
    });

    return withTransaction(async (client) => {
        const existingResult = await client.query(
            `
            SELECT id
            FROM student_promotion_criteria
            WHERE school_id = $1
              AND academic_level_id IS NOT DISTINCT FROM $2::UUID
            FOR UPDATE;
            `,
            [schoolId, academicLevelId]
        );

        if (existingResult.rows.length > 0) {
            createManagementError(
                academicLevelId
                    ? "Promotion criteria already exists for this academic level."
                    : "A school-wide default promotion criteria configuration already exists.",
                409
            );
        }

        const details = await validateCriteriaDetails(
            client,
            {
                schoolId,
                academicLevelId,
                termDisplayOrders,
                subjectIds,
                minimumSubjectsPassed:
                    thresholds.minimumSubjectsPassed,
            }
        );

        const criteriaResult = await client.query(
            `
            INSERT INTO student_promotion_criteria (
                school_id,
                academic_level_id,
                is_active
            )
            VALUES ($1, $2, FALSE)
            RETURNING id, school_id, academic_level_id, is_active,
                      created_at, updated_at;
            `,
            [schoolId, academicLevelId]
        );

        const criteria = criteriaResult.rows[0];

        const versionResult = await client.query(
            `
            INSERT INTO student_promotion_criteria_versions (
                school_id,
                criteria_id,
                version_number,
                is_sealed,
                minimum_session_average,
                subject_pass_mark,
                minimum_subjects_passed,
                created_by
            )
            VALUES ($1, $2, 1, FALSE, $3, $4, $5, $6)
            RETURNING id, version_number, is_sealed,
                      minimum_session_average, subject_pass_mark,
                      minimum_subjects_passed, created_at;
            `,
            [
                schoolId,
                criteria.id,
                thresholds.minimumSessionAverage,
                thresholds.subjectPassMark,
                thresholds.minimumSubjectsPassed,
                userId,
            ]
        );

        const version = versionResult.rows[0];

        for (const termDisplayOrder of details.termDisplayOrders) {
            await client.query(
                `
                INSERT INTO student_promotion_criteria_terms (
                    school_id,
                    criteria_version_id,
                    term_display_order
                )
                VALUES ($1, $2, $3);
                `,
                [schoolId, version.id, termDisplayOrder]
            );
        }

        for (const subjectId of details.subjectIds) {
            await client.query(
                `
                INSERT INTO student_promotion_criteria_subjects (
                    school_id,
                    criteria_version_id,
                    subject_id
                )
                VALUES ($1, $2, $3);
                `,
                [schoolId, version.id, subjectId]
            );
        }

        await recordActivity({
            schoolId,
            userId,
            action: "promotion_criteria_created",
            description: academicLevelId
                ? "Created a promotion criteria configuration for an academic level."
                : "Created the school-wide default promotion criteria configuration.",
            client,
        });

        return {
            ...criteria,
            draft: {
                ...version,
                term_display_orders: details.termDisplayOrders,
                subject_ids: details.subjectIds,
            },
        };
    });
};



export const createStudentPromotionCriteriaVersion = async ({
    schoolId,
    userId,
    criteriaId,
}) => {
    validateUuid(schoolId, "School ID");
    validateUuid(userId, "User ID");
    validateUuid(criteriaId, "Criteria ID");

    return withTransaction(async (client) => {
        const criteriaResult = await client.query(
            `
            SELECT id, academic_level_id
            FROM student_promotion_criteria
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [criteriaId, schoolId]
        );

        if (criteriaResult.rows.length === 0) {
            createManagementError(
                "Promotion criteria configuration was not found.",
                404
            );
        }

        const latestVersionResult = await client.query(
            `
            SELECT
                id,
                version_number,
                is_sealed,
                minimum_session_average,
                subject_pass_mark,
                minimum_subjects_passed

            FROM student_promotion_criteria_versions

            WHERE school_id = $1
              AND criteria_id = $2

            ORDER BY version_number DESC

            LIMIT 1

            FOR UPDATE;
            `,
            [schoolId, criteriaId]
        );

        if (latestVersionResult.rows.length === 0) {
            createManagementError(
                "This configuration has no existing version.",
                409
            );
        }

        const latestVersion = latestVersionResult.rows[0];

        if (!latestVersion.is_sealed) {
            createManagementError(
                "Complete or seal the existing draft before creating another version.",
                409
            );
        }

            const [termResult, subjectResult] = await Promise.all([
            client.query(
                `
                SELECT term_display_order
                FROM student_promotion_criteria_terms
                WHERE school_id = $1
                  AND criteria_version_id = $2
                ORDER BY term_display_order ASC;
                `,
                [schoolId, latestVersion.id]
            ),

            client.query(
                `
                SELECT subject_id
                FROM student_promotion_criteria_subjects
                WHERE school_id = $1
                  AND criteria_version_id = $2
                ORDER BY subject_id ASC;
                `,
                [schoolId, latestVersion.id]
            ),
        ]);

        await validateCriteriaDetails(client, {
            schoolId,
            academicLevelId:
                criteriaResult.rows[0].academic_level_id,
            termDisplayOrders: termResult.rows.map(
                (row) => row.term_display_order
            ),
            subjectIds: subjectResult.rows.map(
                (row) => row.subject_id
            ),
            minimumSubjectsPassed: Number(
                latestVersion.minimum_subjects_passed
            ),
        });

        const nextVersionNumber =
            Number(latestVersion.version_number) + 1;

        const newVersionResult = await client.query(
            `
            INSERT INTO student_promotion_criteria_versions (
                school_id,
                criteria_id,
                version_number,
                is_sealed,
                minimum_session_average,
                subject_pass_mark,
                minimum_subjects_passed,
                created_by
            )
            VALUES ($1, $2, $3, FALSE, $4, $5, $6, $7)
            RETURNING id, version_number, is_sealed,
                      minimum_session_average, subject_pass_mark,
                      minimum_subjects_passed, created_at;
            `,
            [
                schoolId,
                criteriaId,
                nextVersionNumber,
                latestVersion.minimum_session_average,
                latestVersion.subject_pass_mark,
                latestVersion.minimum_subjects_passed,
                userId,
            ]
        );

        const newVersion = newVersionResult.rows[0];

        await client.query(
            `
            INSERT INTO student_promotion_criteria_terms (
                school_id,
                criteria_version_id,
                term_display_order
            )
            SELECT
                school_id,
                $3,
                term_display_order

            FROM student_promotion_criteria_terms

            WHERE school_id = $1
              AND criteria_version_id = $2;
            `,
            [schoolId, latestVersion.id, newVersion.id]
        );

        await client.query(
            `
            INSERT INTO student_promotion_criteria_subjects (
                school_id,
                criteria_version_id,
                subject_id
            )
            SELECT
                school_id,
                $3,
                subject_id

            FROM student_promotion_criteria_subjects

            WHERE school_id = $1
              AND criteria_version_id = $2;
            `,
            [schoolId, latestVersion.id, newVersion.id]
        );

        await recordActivity({
            schoolId,
            userId,
            action: "promotion_criteria_version_created",
            description:
                `Created draft version ${nextVersionNumber} of promotion criteria.`,
            client,
        });

        return {
            ...newVersion,
            term_display_orders: (
                await client.query(
                    `
                    SELECT term_display_order
                    FROM student_promotion_criteria_terms
                    WHERE school_id = $1
                      AND criteria_version_id = $2
                    ORDER BY term_display_order ASC;
                    `,
                    [schoolId, newVersion.id]
                )
            ).rows.map((row) => row.term_display_order),
            subject_ids: (
                await client.query(
                    `
                    SELECT subject_id
                    FROM student_promotion_criteria_subjects
                    WHERE school_id = $1
                      AND criteria_version_id = $2
                    ORDER BY subject_id ASC;
                    `,
                    [schoolId, newVersion.id]
                )
            ).rows.map((row) => row.subject_id),
        };
    });
};



export const updateStudentPromotionCriteriaDraft = async ({
    schoolId,
    userId,
    criteriaId,
    versionId,
    minimumSessionAverage,
    subjectPassMark,
    minimumSubjectsPassed,
    termDisplayOrders,
    subjectIds,
}) => {
    validateUuid(schoolId, "School ID");
    validateUuid(userId, "User ID");
    validateUuid(criteriaId, "Criteria ID");
    validateUuid(versionId, "Version ID");

    const thresholds = validateThresholds({
        minimumSessionAverage,
        subjectPassMark,
        minimumSubjectsPassed,
    });

    return withTransaction(async (client) => {
        const criteriaResult = await client.query(
            `
            SELECT id, academic_level_id
            FROM student_promotion_criteria
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [criteriaId, schoolId]
        );

        if (criteriaResult.rows.length === 0) {
            createManagementError(
                "Promotion criteria configuration was not found.",
                404
            );
        }

        const criteria = criteriaResult.rows[0];

        const versionResult = await client.query(
            `
            SELECT
                id,
                version_number,
                is_sealed

            FROM student_promotion_criteria_versions

            WHERE id = $1
              AND criteria_id = $2
              AND school_id = $3

            FOR UPDATE;
            `,
            [versionId, criteriaId, schoolId]
        );

        if (versionResult.rows.length === 0) {
            createManagementError(
                "Promotion criteria version was not found.",
                404
            );
        }

        const version = versionResult.rows[0];

        if (version.is_sealed) {
            createManagementError(
                "Sealed promotion criteria versions cannot be edited.",
                409
            );
        }

        const historyResult = await client.query(
            `
            SELECT EXISTS (
                SELECT 1
                FROM student_progression_records
                WHERE school_id = $1
                  AND criteria_version_id = $2
            ) AS has_progression_history;
            `,
            [schoolId, versionId]
        );

        if (historyResult.rows[0].has_progression_history) {
            createManagementError(
                "This draft has already been used in progression history and can no longer be edited.",
                409
            );
        }

        const details = await validateCriteriaDetails(
            client,
            {
                schoolId,
                academicLevelId: criteria.academic_level_id,
                termDisplayOrders,
                subjectIds,
                minimumSubjectsPassed:
                    thresholds.minimumSubjectsPassed,
            }
        );

        await client.query(
            `
            UPDATE student_promotion_criteria_versions
            SET
                minimum_session_average = $1,
                subject_pass_mark = $2,
                minimum_subjects_passed = $3

            WHERE id = $4
              AND criteria_id = $5
              AND school_id = $6
              AND is_sealed = FALSE;
            `,
            [
                thresholds.minimumSessionAverage,
                thresholds.subjectPassMark,
                thresholds.minimumSubjectsPassed,
                versionId,
                criteriaId,
                schoolId,
            ]
        );

        await client.query(
            `
            DELETE FROM student_promotion_criteria_terms
            WHERE school_id = $1
              AND criteria_version_id = $2;
            `,
            [schoolId, versionId]
        );

        await client.query(
            `
            DELETE FROM student_promotion_criteria_subjects
            WHERE school_id = $1
              AND criteria_version_id = $2;
            `,
            [schoolId, versionId]
        );

        for (const termDisplayOrder of details.termDisplayOrders) {
            await client.query(
                `
                INSERT INTO student_promotion_criteria_terms (
                    school_id,
                    criteria_version_id,
                    term_display_order
                )
                VALUES ($1, $2, $3);
                `,
                [schoolId, versionId, termDisplayOrder]
            );
        }

        for (const subjectId of details.subjectIds) {
            await client.query(
                `
                INSERT INTO student_promotion_criteria_subjects (
                    school_id,
                    criteria_version_id,
                    subject_id
                )
                VALUES ($1, $2, $3);
                `,
                [schoolId, versionId, subjectId]
            );
        }

        await recordActivity({
            schoolId,
            userId,
            action: "promotion_criteria_version_updated",
            description:
                `Updated draft version ${version.version_number} of promotion criteria.`,
            client,
        });

        return {
            id: version.id,
            version_number: version.version_number,
            is_sealed: false,
            ...thresholds,
            term_display_orders: details.termDisplayOrders,
            subject_ids: details.subjectIds,
        };
    });
};



export const sealStudentPromotionCriteriaVersion = async ({
    schoolId,
    userId,
    criteriaId,
    versionId,
}) => {
    validateUuid(schoolId, "School ID");
    validateUuid(userId, "User ID");
    validateUuid(criteriaId, "Criteria ID");
    validateUuid(versionId, "Version ID");

    return withTransaction(async (client) => {
        const criteriaResult = await client.query(
            `
            SELECT id, academic_level_id, is_active
            FROM student_promotion_criteria
            WHERE id = $1
              AND school_id = $2
            FOR UPDATE;
            `,
            [criteriaId, schoolId]
        );

        if (criteriaResult.rows.length === 0) {
            createManagementError(
                "Promotion criteria configuration was not found.",
                404
            );
        }

        const criteria = criteriaResult.rows[0];

        const versionResult = await client.query(
            `
            SELECT
                id,
                version_number,
                is_sealed,
                minimum_session_average,
                subject_pass_mark,
                minimum_subjects_passed

            FROM student_promotion_criteria_versions

            WHERE id = $1
              AND criteria_id = $2
              AND school_id = $3

            FOR UPDATE;
            `,
            [versionId, criteriaId, schoolId]
        );

        if (versionResult.rows.length === 0) {
            createManagementError(
                "Promotion criteria version was not found.",
                404
            );
        }

        const version = versionResult.rows[0];

        if (version.is_sealed) {
            createManagementError(
                "This promotion criteria version has already been sealed.",
                409
            );
        }

        const historyResult = await client.query(
            `
            SELECT EXISTS (
                SELECT 1
                FROM student_progression_records
                WHERE school_id = $1
                  AND criteria_version_id = $2
            ) AS has_progression_history;
            `,
            [schoolId, versionId]
        );

        if (historyResult.rows[0].has_progression_history) {
            createManagementError(
                "A draft already referenced in progression history cannot be sealed through this operation.",
                409
            );
        }

        const termResult = await client.query(
            `
            SELECT term_display_order
            FROM student_promotion_criteria_terms
            WHERE school_id = $1
              AND criteria_version_id = $2
            ORDER BY term_display_order ASC;
            `,
            [schoolId, versionId]
        );

        const subjectResult = await client.query(
            `
            SELECT subject_id
            FROM student_promotion_criteria_subjects
            WHERE school_id = $1
              AND criteria_version_id = $2
            ORDER BY subject_id ASC;
            `,
            [schoolId, versionId]
        );

        if (termResult.rows.length === 0) {
            createManagementError(
                "At least one required term must be selected before sealing."
            );
        }

        if (subjectResult.rows.length === 0) {
            createManagementError(
                "At least one required subject must be selected before sealing."
            );
        }

        const details = await validateCriteriaDetails(
            client,
            {
                schoolId,
                academicLevelId: criteria.academic_level_id,
                termDisplayOrders: termResult.rows.map(
                    (row) => row.term_display_order
                ),
                subjectIds: subjectResult.rows.map(
                    (row) => row.subject_id
                ),
                minimumSubjectsPassed: Number(
                    version.minimum_subjects_passed
                ),
            }
        );

        await client.query(
            `
            UPDATE student_promotion_criteria_versions
            SET is_sealed = TRUE

            WHERE id = $1
              AND criteria_id = $2
              AND school_id = $3
              AND is_sealed = FALSE;
            `,
            [versionId, criteriaId, schoolId]
        );

        await recordActivity({
            schoolId,
            userId,
            action: "promotion_criteria_version_sealed",
            description:
                `Sealed promotion criteria version ${version.version_number}.`,
            client,
        });

        return {
            id: version.id,
            version_number: version.version_number,
            is_sealed: true,
            minimum_session_average: version.minimum_session_average,
            subject_pass_mark: version.subject_pass_mark,
            minimum_subjects_passed: version.minimum_subjects_passed,
            term_display_orders: details.termDisplayOrders,
            subject_ids: details.subjectIds,
            configuration_is_active: criteria.is_active,
        };
    });
};


export const setStudentPromotionCriteriaActivation = async ({
    schoolId,
    userId,
    criteriaId,
    isActive,
}) => {
    validateUuid(schoolId, "School ID");
    validateUuid(userId, "User ID");
    validateUuid(criteriaId, "Criteria ID");

    if (typeof isActive !== "boolean") {
        createManagementError(
            "Activation status must be either true or false."
        );
    }

    return withTransaction(async (client) => {
        const criteriaResult = await client.query(
            `
            SELECT
                id,
                academic_level_id,
                is_active

            FROM student_promotion_criteria

            WHERE id = $1
              AND school_id = $2

            FOR UPDATE;
            `,
            [criteriaId, schoolId]
        );

        if (criteriaResult.rows.length === 0) {
            createManagementError(
                "Promotion criteria configuration was not found.",
                404
            );
        }

        const criteria = criteriaResult.rows[0];

        if (isActive) {
            const sealedVersionResult = await client.query(
                `
                SELECT
                    id,
                    minimum_subjects_passed

                FROM student_promotion_criteria_versions

                WHERE school_id = $1
                  AND criteria_id = $2
                  AND is_sealed = TRUE

                ORDER BY version_number DESC

                LIMIT 1;
                `,
                [schoolId, criteriaId]
            );

            if (sealedVersionResult.rows.length === 0) {
                createManagementError(
                    "Seal at least one criteria version before activating this configuration.",
                    409
                );
            }

            const latestSealedVersion =
                sealedVersionResult.rows[0];

            const [termResult, subjectResult] = await Promise.all([
                client.query(
                    `
                    SELECT term_display_order
                    FROM student_promotion_criteria_terms
                    WHERE school_id = $1
                      AND criteria_version_id = $2
                    ORDER BY term_display_order ASC;
                    `,
                    [schoolId, latestSealedVersion.id]
                ),

                client.query(
                    `
                    SELECT subject_id
                    FROM student_promotion_criteria_subjects
                    WHERE school_id = $1
                      AND criteria_version_id = $2
                    ORDER BY subject_id ASC;
                    `,
                    [schoolId, latestSealedVersion.id]
                ),
            ]);

            await validateCriteriaDetails(client, {
                schoolId,
                academicLevelId: criteria.academic_level_id,
                termDisplayOrders: termResult.rows.map(
                    (row) => row.term_display_order
                ),
                subjectIds: subjectResult.rows.map(
                    (row) => row.subject_id
                ),
                minimumSubjectsPassed: Number(
                    latestSealedVersion.minimum_subjects_passed
                ),
            });
        }

        if (criteria.is_active !== isActive) {
            await client.query(
                `
                UPDATE student_promotion_criteria
                SET
                    is_active = $1,
                    updated_at = NOW()

                WHERE id = $2
                  AND school_id = $3;
                `,
                [isActive, criteriaId, schoolId]
            );

            await recordActivity({
                schoolId,
                userId,
                action: isActive
                    ? "promotion_criteria_activated"
                    : "promotion_criteria_deactivated",
                description: isActive
                    ? "Activated a promotion criteria configuration."
                    : "Deactivated a promotion criteria configuration.",
                client,
            });
        }

        let affectedLevels = [];

        if (!isActive) {
            if (criteria.academic_level_id) {
                const fallbackResult = await client.query(
                    `
                    SELECT EXISTS (
                        SELECT 1
                        FROM student_promotion_criteria
                        WHERE school_id = $1
                          AND academic_level_id IS NULL
                          AND is_active = TRUE
                    ) AS has_active_default;
                    `,
                    [schoolId]
                );

                if (!fallbackResult.rows[0].has_active_default) {
                    const levelResult = await client.query(
                        `
                        SELECT id, name
                        FROM academic_levels
                        WHERE school_id = $1
                          AND id = $2;
                        `,
                        [schoolId, criteria.academic_level_id]
                    );

                    affectedLevels = levelResult.rows;
                }
            } else {
                const affectedResult = await client.query(
                    `
                    SELECT
                        al.id,
                        al.name

                    FROM academic_levels al

                    WHERE al.school_id = $1

                      AND NOT EXISTS (
                          SELECT 1
                          FROM student_promotion_criteria level_criteria
                          WHERE level_criteria.school_id = al.school_id
                            AND level_criteria.academic_level_id = al.id
                            AND level_criteria.is_active = TRUE
                      )

                    ORDER BY al.display_order ASC, al.name ASC;
                    `,
                    [schoolId]
                );

                affectedLevels = affectedResult.rows;
            }
        }

        const warning = affectedLevels.length > 0
            ? {
                code: "PROMOTION_CRITERIA_FALLBACK_MISSING",
                message:
                    "Progression evaluations will be blocked for the affected academic levels until a valid promotion criteria configuration is activated.",
                affectedLevels,
            }
            : null;

        return {
            id: criteria.id,
            academic_level_id: criteria.academic_level_id,
            is_active: isActive,
            warning,
        };
    });
};

