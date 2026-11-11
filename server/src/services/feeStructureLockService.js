export const lockFeeStructureCombination = async (
    client,
    {
        schoolId,
        academicSessionId,
        termId,
        academicLevelId,
    }
) => {
    await client.query(
        `
        SELECT pg_advisory_xact_lock(
            hashtextextended(
                $1::text || ':' ||
                $2::text || ':' ||
                $3::text || ':' ||
                $4::text,
                0
            )
        );
        `,
        [
            schoolId,
            academicSessionId,
            termId,
            academicLevelId,
        ]
    );
};
