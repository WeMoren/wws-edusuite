ALTER TABLE results
DROP CONSTRAINT valid_result_ca,
DROP CONSTRAINT valid_result_exam;

ALTER TABLE results
ADD CONSTRAINT valid_result_ca
    CHECK (ca >= 0),
ADD CONSTRAINT valid_result_exam
    CHECK (exam >= 0);
