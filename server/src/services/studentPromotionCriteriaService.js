const createCriteriaError = (
    message,
    details = null,
    code = null
) => {
    const error = new Error(message);
    error.statusCode = 409;
    error.details = details;
    error.code = code;
    return error;
};

export const evaluateStudentPromotionCriteria = async (
    client,
    {
        schoolId,
        academicLevelId,
        sourceEnrollmentId,
        sourceAcademicSessionId,
        requiresSubjectCombination = false,
        streamId = null,
        subjectCombinationId = null,
    }
) => {
    // An active level-specific configuration takes precedence.
    // If none is active, the active school-wide configuration is used.
    const criteriaResult = await client.query(
        `
        SELECT
            c.id AS criteria_id,
            c.academic_level_id,
            v.id AS criteria_version_id,
            v.version_number,
            v.is_sealed,
            v.minimum_session_average,
            v.subject_pass_mark,
            v.minimum_subjects_passed

        FROM student_promotion_criteria c

        LEFT JOIN LATERAL (
            SELECT
                id,
                version_number,
                is_sealed,
                minimum_session_average,
                subject_pass_mark,
                minimum_subjects_passed

            FROM student_promotion_criteria_versions

            WHERE school_id = c.school_id
              AND criteria_id = c.id
              AND is_sealed = TRUE

            ORDER BY version_number DESC
            LIMIT 1
        ) v ON TRUE

        WHERE c.school_id = $1
          AND c.is_active = TRUE
          AND (
              c.academic_level_id = $2
              OR c.academic_level_id IS NULL
          )

        ORDER BY
            CASE
                WHEN c.academic_level_id = $2 THEN 0
                ELSE 1
            END

        LIMIT 1;
        `,
        [schoolId, academicLevelId]
    );

        if (criteriaResult.rows.length === 0) {
        throw createCriteriaError(
            "Promotion criteria are not configured. Activate an academic-level-specific configuration or a school-wide default before evaluating progression.",
            null,
            "PROMOTION_CRITERIA_NOT_CONFIGURED"
        );
    }

    const criteria = criteriaResult.rows[0];

    if (
        !criteria.criteria_version_id
        || !criteria.is_sealed
    ) {
        throw createCriteriaError(
            "The active promotion criteria configuration does not have a sealed version. Complete and seal its criteria before evaluating progression.",
            {
                criteriaId: criteria.criteria_id,
                versionNumber: criteria.version_number,
            }
        );
    }

    // Resolve configured term display orders against the source session.
    const termsResult = await client.query(
        `
        SELECT
            cpt.term_display_order,
            t.id AS term_id,
            t.name AS term_name

        FROM student_promotion_criteria_terms cpt

        LEFT JOIN terms t
            ON t.school_id = cpt.school_id
           AND t.academic_session_id = $3
           AND t.display_order = cpt.term_display_order

        WHERE cpt.school_id = $1
          AND cpt.criteria_version_id = $2

        ORDER BY cpt.term_display_order ASC;
        `,
        [
            schoolId,
            criteria.criteria_version_id,
            sourceAcademicSessionId,
        ]
    );

    if (
        termsResult.rows.length === 0
        || termsResult.rows.some((term) => !term.term_id)
    ) {
        throw createCriteriaError(
            "The required promotion criteria terms are not configured in the student's source academic session.",
            {
                requiredTermOrders: termsResult.rows.map(
                    (term) => term.term_display_order
                ),
                sourceAcademicSessionId,
            }
        );
    }

    const termIds = termsResult.rows.map(
        (term) => term.term_id
    );

    if (new Set(termIds).size !== termIds.length) {
        throw createCriteriaError(
            "The source academic session contains duplicate term display orders required by the promotion criteria."
        );
    }

    // Load the subjects included in this criteria version.
    const subjectsResult = await client.query(
        `
        SELECT
            cps.subject_id,
            s.name AS subject_name

        FROM student_promotion_criteria_subjects cps

        JOIN subjects s
            ON s.id = cps.subject_id
           AND s.school_id = cps.school_id

        WHERE cps.school_id = $1
          AND cps.criteria_version_id = $2

        ORDER BY s.name ASC;
        `,
        [
            schoolId,
            criteria.criteria_version_id,
        ]
    );

    if (subjectsResult.rows.length === 0) {
        throw createCriteriaError(
            "The active promotion criteria version has no configured subjects."
        );
    }

    const configuredSubjects = subjectsResult.rows;
    let evaluationSubjects = configuredSubjects;

    let streamName = null;
    let subjectCombinationName = null;
    let incompleteReason = null;

    if (requiresSubjectCombination) {
        let combination = null;

        if (streamId && subjectCombinationId) {
            const combinationResult = await client.query(
                `
                SELECT
                    sc.id,
                    sc.name,
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

                WHERE sc.id = $1
                  AND sc.school_id = $2
                  AND sc.academic_level_id = $3
                  AND sc.stream_id = $4
                  AND sc.is_active = TRUE

                GROUP BY
                    sc.id,
                    sc.name,
                    sc.stream_id,
                    st.name

                HAVING COUNT(scs.subject_id) > 0
                   AND NOT EXISTS (
                       SELECT 1
                       FROM subject_combination_subjects invalid_scs

                       WHERE invalid_scs.subject_combination_id =
                           sc.id
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
                   );
                `,
                [
                    subjectCombinationId,
                    schoolId,
                    academicLevelId,
                    streamId,
                ]
            );

            combination = combinationResult.rows[0] || null;
        }

        if (!streamId || !subjectCombinationId) {
            incompleteReason =
                "The student's enrollment is missing its required stream or subject combination.";
        } else if (!combination) {
            incompleteReason =
                "The student's stream or subject combination is missing, inactive, invalid, or not assigned to this academic level.";
        } else {
            streamName = combination.stream_name;
            subjectCombinationName = combination.name;

            const combinationSubjectIds = new Set(
                combination.subject_ids
            );

            evaluationSubjects = configuredSubjects.filter(
                (subject) => combinationSubjectIds.has(
                    subject.subject_id
                )
            );

            if (evaluationSubjects.length === 0) {
                incompleteReason =
                    "The student's active subject combination has no subjects in common with the configured promotion criteria.";
            }
        }

        if (incompleteReason) {
            return {
                criteriaVersionId: criteria.criteria_version_id,
                evaluationStatus: "incomplete",
                recommendedOutcome: null,

                snapshot: {
                    criteriaVersionId: criteria.criteria_version_id,
                    criteriaVersionNumber: criteria.version_number,

                    thresholds: {
                        minimumSessionAverage: Number(
                            criteria.minimum_session_average
                        ),
                        subjectPassMark: Number(
                            criteria.subject_pass_mark
                        ),
                        minimumSubjectsPassed: Number(
                            criteria.minimum_subjects_passed
                        ),
                    },

                    requiredTerms: termsResult.rows.map((term) => ({
                        id: term.term_id,
                        name: term.term_name,
                        displayOrder: term.term_display_order,
                    })),

                    sessionAverage: null,
                    passedSubjects: 0,

                    totalConfiguredSubjects: configuredSubjects.length,
                    totalApplicableSubjects: 0,

                    requiresSubjectCombination: true,
                    streamId,
                    streamName,
                    subjectCombinationId,
                    subjectCombinationName,

                    applicableSubjects: [],
                    subjects: [],
                    terms: [],

                    incompleteReason,
                },
            };
        }
    }

       if (
        requiresSubjectCombination
        && evaluationSubjects.length > 0
        && Number(criteria.minimum_subjects_passed)
            > evaluationSubjects.length
    ) {
        throw createCriteriaError(
            "The active promotion criteria are not achievable for this student's subject combination. The minimum number of subjects required to pass exceeds the number of applicable subjects. Please update the promotion criteria.",
            {
                criteriaId: criteria.criteria_id,
                criteriaVersionId: criteria.criteria_version_id,
                criteriaVersionNumber: criteria.version_number,
                academicLevelId,
                streamId,
                subjectCombinationId,
                minimumSubjectsPassed: Number(
                    criteria.minimum_subjects_passed
                ),
                availableSubjects: evaluationSubjects.length,
            }
        );
    }

    const subjectIds = evaluationSubjects.map(
        (subject) => subject.subject_id
    );
    // Only officially finalized and fully authorized result documents count.
    const resultsResult = await client.query(
        `
        SELECT
            r.subject_id,
            r.term_id,
            r.total

        FROM results r

        WHERE r.school_id = $1
          AND r.student_enrollment_id = $2
          AND r.term_id = ANY($3::uuid[])
          AND r.subject_id = ANY($4::uuid[])

          AND EXISTS (
              SELECT 1
              FROM result_documents rd

              WHERE rd.school_id = r.school_id
                AND rd.student_enrollment_id =
                    r.student_enrollment_id
                AND rd.term_id = r.term_id
                AND rd.status = 'finalized'
                AND rd.principal_authorized_at IS NOT NULL
                AND rd.exam_officer_authorized_at IS NOT NULL
          );
        `,
        [
            schoolId,
            sourceEnrollmentId,
            termIds,
            subjectIds,
        ]
    );

    const resultsBySubject = new Map();
    const resultsByTerm = new Map();

    resultsResult.rows.forEach((result) => {
        const score = Number(result.total);

        if (!resultsBySubject.has(result.subject_id)) {
            resultsBySubject.set(result.subject_id, []);
        }

        resultsBySubject.get(result.subject_id).push(score);

        if (!resultsByTerm.has(result.term_id)) {
            resultsByTerm.set(result.term_id, []);
        }

        resultsByTerm.get(result.term_id).push(score);
    });

    const requiredTermCount = termIds.length;
    const subjectEvaluations = [];

    let hasIncompleteResults = false;

      evaluationSubjects.forEach((subject) => {
        const subjectResults =
            resultsBySubject.get(subject.subject_id) || [];

        const subjectAverage =
            subjectResults.length === requiredTermCount
                ? subjectResults.reduce(
                    (total, score) => total + score,
                    0
                ) / requiredTermCount
                : null;

        if (subjectAverage === null) {
            hasIncompleteResults = true;
        }

        const passed =
            subjectAverage !== null
            && subjectAverage >= Number(
                criteria.subject_pass_mark
            );

        subjectEvaluations.push({
            subjectId: subject.subject_id,
            subjectName: subject.subject_name,
            completedTerms: subjectResults.length,
            requiredTerms: requiredTermCount,
            average: subjectAverage === null
                ? null
                : Number(subjectAverage.toFixed(2)),
            passed,
        });
    });

    // Match the existing official session-average approach:
    // calculate each term average, then average the required terms.
    const termEvaluations = termsResult.rows.map((term) => {
        const termScores =
            resultsByTerm.get(term.term_id) || [];

        return {
            termId: term.term_id,
            termName: term.term_name,
            termDisplayOrder: term.term_display_order,
            completedSubjects: termScores.length,
                        requiredSubjects: evaluationSubjects.length,
            average: termScores.length === evaluationSubjects.length
                ? termScores.reduce(
                    (total, score) => total + score,
                    0
                    ) / evaluationSubjects.length
                : null,
        };
    });

    if (
        termEvaluations.some(
            (term) => term.average === null
        )
    ) {
        hasIncompleteResults = true;
    }

    const sessionAverage = hasIncompleteResults
        ? null
        : termEvaluations.reduce(
            (total, term) => total + term.average,
            0
        ) / requiredTermCount;

    const passedSubjects = subjectEvaluations.filter(
        (subject) => subject.passed
    ).length;

    const evaluationStatus = hasIncompleteResults
        ? "incomplete"
        : (
            sessionAverage >= Number(
                criteria.minimum_session_average
            )
            && passedSubjects >= Number(
                criteria.minimum_subjects_passed
            )
        )
            ? "eligible"
            : "not_eligible";

    const recommendedOutcome =
        evaluationStatus === "eligible"
            ? "promote"
            : null;

    return {
        criteriaVersionId: criteria.criteria_version_id,
        evaluationStatus,
        recommendedOutcome,
        snapshot: {
            criteriaVersionId: criteria.criteria_version_id,
            criteriaVersionNumber: criteria.version_number,

            thresholds: {
                minimumSessionAverage: Number(
                    criteria.minimum_session_average
                ),
                subjectPassMark: Number(
                    criteria.subject_pass_mark
                ),
                minimumSubjectsPassed: Number(
                    criteria.minimum_subjects_passed
                ),
            },

            requiredTerms: termsResult.rows.map((term) => ({
                id: term.term_id,
                name: term.term_name,
                displayOrder: term.term_display_order,
            })),

            sessionAverage: sessionAverage === null
                ? null
                : Number(sessionAverage.toFixed(2)),

                       passedSubjects,

            totalConfiguredSubjects: configuredSubjects.length,
            totalApplicableSubjects: evaluationSubjects.length,

            requiresSubjectCombination: Boolean(
                requiresSubjectCombination
            ),

            streamId: requiresSubjectCombination ? streamId : null,
            streamName,

            subjectCombinationId: requiresSubjectCombination
                ? subjectCombinationId
                : null,
            subjectCombinationName,

            applicableSubjects: evaluationSubjects.map((subject) => ({
                id: subject.subject_id,
                name: subject.subject_name,
            })),

            incompleteReason,
            subjects: subjectEvaluations,
            terms: termEvaluations,
        },
    };
};
