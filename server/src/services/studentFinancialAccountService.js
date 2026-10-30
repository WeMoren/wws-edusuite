
const getEnrollmentDetails = async (
    client,
    {
        schoolId,
        studentId,
        enrollmentId,
    }
) => {
    const result = await client.query(
        `
        SELECT
            se.id,
            se.student_id,
            se.academic_session_id,
            se.status AS enrollment_status,
            c.academic_level_id
        FROM student_enrollments se

        JOIN classes c
            ON c.id = se.class_id
           AND c.school_id = se.school_id

        WHERE se.id = $1
          AND se.school_id = $2
          AND se.student_id = $3;
        `,
        [enrollmentId, schoolId, studentId]
    );

    return result.rows[0] || null;
};

const findActiveFeeStructure = async (
    client,
    {
        schoolId,
        academicSessionId,
        termId,
        academicLevelId,
    }
) => {
    const result = await client.query(
        `
        SELECT
            fs.id,
            fs.name
        FROM fee_structures fs
        WHERE fs.school_id = $1
          AND fs.academic_session_id = $2
          AND fs.term_id = $3
          AND fs.academic_level_id = $4
          AND fs.is_current = TRUE
        ORDER BY fs.created_at DESC
        LIMIT 2;
        `,
        [
            schoolId,
            academicSessionId,
            termId,
            academicLevelId,
        ]
    );

    if (result.rows.length > 1) {
        throw new Error(
            "Multiple active fee structures exist for this academic level, session, and term. Resolve the conflict before generating financial accounts."
        );
    }

    return result.rows[0] || null;
};

    const calculateFeeStructureTotal = async (
    client,
    {
        schoolId,
        feeStructureId,
    }
) => {
    const result = await client.query(
        `
        SELECT
            COUNT(fsi.id)::int AS item_count,
            COALESCE(SUM(fsi.amount), 0) AS total_due
        FROM fee_structures fs

        LEFT JOIN fee_structure_items fsi
            ON fsi.fee_structure_id = fs.id

        WHERE fs.id = $1
          AND fs.school_id = $2
          AND fs.is_current = TRUE;
        `,
        [feeStructureId, schoolId]
    );

    if (result.rows[0].item_count === 0) {
        throw new Error(
            "The active fee structure has no fee items. Add fee items before generating financial accounts."
        );
    }

    return result.rows[0].total_due;
};


export const createStudentFinancialAccountForTerm = async (
    client,
    {
        schoolId,
        studentId,
        enrollmentId,
        termId,
    }
) => {
    const enrollment = await getEnrollmentDetails(
        client,
        {
            schoolId,
            studentId,
            enrollmentId,
        }
    );

    if (!enrollment) {
        throw new Error(
            "Enrollment not found for the selected student and school."
        );
    }

        if (enrollment.enrollment_status !== "active") {
        return {
            created: false,
            skipped: true,
            reason: "Enrollment is not active.",
            financialAccount: null,
        };
    }

    const termResult = await client.query(
        `
        SELECT
            id,
            academic_session_id,
            name
        FROM terms
        WHERE id = $1
          AND school_id = $2
          AND academic_session_id = $3;
        `,
        [
            termId,
            schoolId,
            enrollment.academic_session_id,
        ]
    );

    if (termResult.rows.length === 0) {
        throw new Error(
            "Term not found for the student's academic session."
        );
    }

    const feeStructure = await findActiveFeeStructure(
        client,
        {
            schoolId,
            academicSessionId:
                enrollment.academic_session_id,
            termId,
            academicLevelId:
                enrollment.academic_level_id,
        }
    );

    if (!feeStructure) {
        throw new Error(
            "No active fee structure exists for the student's academic level and selected term."
        );
    }

    const totalDue = await calculateFeeStructureTotal(
    client,
    {
        schoolId,
        feeStructureId: feeStructure.id,
    }
);

    const result = await client.query(
        `
        INSERT INTO student_financial_accounts (
            school_id,
            student_id,
            enrollment_id,
            academic_session_id,
            term_id,
            fee_structure_id,
            total_due,
            total_paid,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            0,
            'unpaid'
        )
        ON CONFLICT (
            student_id,
            enrollment_id,
            term_id
        )
        DO NOTHING
        RETURNING
            id,
            school_id,
            student_id,
            enrollment_id,
            academic_session_id,
            term_id,
            fee_structure_id,
            total_due,
            total_paid,
            status,
            created_at,
            updated_at;
        `,
        [
            schoolId,
            studentId,
            enrollmentId,
            enrollment.academic_session_id,
            termId,
            feeStructure.id,
            totalDue,
        ]
    );

    if (result.rows.length === 0) {
        const existingResult = await client.query(
            `
            SELECT
                id,
                school_id,
                student_id,
                enrollment_id,
                academic_session_id,
                term_id,
                fee_structure_id,
                total_due,
                total_paid,
                status,
                created_at,
                updated_at
            FROM student_financial_accounts
            WHERE student_id = $1
              AND enrollment_id = $2
              AND term_id = $3;
            `,
            [studentId, enrollmentId, termId, schoolId]
        );

        return {
            created: false,
            financialAccount:
                existingResult.rows[0] || null,
        };
    }

    return {
        created: true,
        financialAccount: result.rows[0],
    };
};

export const createStudentFinancialAccountForCurrentTerm = async (
    client,
    {
        schoolId,
        studentId,
        enrollmentId,
    }
) => {
    const enrollment = await getEnrollmentDetails(
        client,
        {
            schoolId,
            studentId,
            enrollmentId,
        }
    );

    if (!enrollment) {
        throw new Error(
            "Enrollment not found for the selected student and school."
        );
    }

    if (enrollment.enrollment_status !== "active") {
        return {
            created: false,
            skipped: true,
            reason: "Enrollment is not active.",
            financialAccount: null,
        };
    }

    const currentTermResult = await client.query(
        `
        SELECT
            t.id,
            t.academic_session_id
        FROM academic_sessions acs

        JOIN terms t
            ON t.academic_session_id = acs.id
           AND t.school_id = acs.school_id
           AND t.is_current = TRUE

        WHERE acs.id = $1
          AND acs.school_id = $2
          AND acs.is_current = TRUE
          AND t.academic_session_id = $3
        LIMIT 1;
        `,
        [
            enrollment.academic_session_id,
            schoolId,
            enrollment.academic_session_id,
        ]
    );

    if (currentTermResult.rows.length === 0) {
        return {
            created: false,
            skipped: true,
            reason:
                "The enrolment does not belong to the current academic session or no current term is configured.",
            financialAccount: null,
        };
    }

        const activeFeeStructure = await findActiveFeeStructure(
        client,
        {
            schoolId,
            academicSessionId:
                enrollment.academic_session_id,
            termId: currentTermResult.rows[0].id,
            academicLevelId:
                enrollment.academic_level_id,
        }
    );

    if (!activeFeeStructure) {
        return {
            created: false,
            skipped: true,
            reason:
                "No active fee structure exists for the student's academic level and current term.",
            financialAccount: null,
        };
    }

    const result =
        await createStudentFinancialAccountForTerm(
            client,
            {
                schoolId,
                studentId,
                enrollmentId,
                termId: currentTermResult.rows[0].id,
            }
        );

    return {
        ...result,
        skipped: false,
    };
};
