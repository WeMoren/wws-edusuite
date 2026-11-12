BEGIN;

-- ============================================================
-- 1. ENFORCE TERM-TO-SESSION SCHOOL CONSISTENCY
-- ============================================================

-- Required as the referenced composite key for school-scoped
-- term relationships.
ALTER TABLE terms
ADD CONSTRAINT unique_terms_school_session_id
UNIQUE (school_id, academic_session_id, id);

-- Ensure a term cannot reference an academic session owned
-- by another school.
ALTER TABLE terms
ADD CONSTRAINT fk_terms_academic_session_school
FOREIGN KEY (school_id, academic_session_id)
REFERENCES academic_sessions (school_id, id)
ON DELETE RESTRICT;


-- ============================================================
-- 2. ADD OPTIONAL ACADEMIC PERIOD TO EXPENSES
-- ============================================================

-- Existing expenses remain unallocated.
ALTER TABLE expenses
ADD COLUMN academic_session_id UUID,
ADD COLUMN term_id UUID;

-- An expense must either belong to both a session and term,
-- or remain unallocated with both references NULL.
ALTER TABLE expenses
ADD CONSTRAINT valid_expense_academic_period
CHECK (
    (academic_session_id IS NULL AND term_id IS NULL)
    OR
    (academic_session_id IS NOT NULL AND term_id IS NOT NULL)
);


-- ============================================================
-- 3. ENFORCE SAME-SCHOOL SESSION AND TERM OWNERSHIP
-- ============================================================

ALTER TABLE expenses
ADD CONSTRAINT fk_expenses_academic_session_school
FOREIGN KEY (school_id, academic_session_id)
REFERENCES academic_sessions (school_id, id)
ON DELETE RESTRICT;

ALTER TABLE expenses
ADD CONSTRAINT fk_expenses_term_school_session
FOREIGN KEY (school_id, academic_session_id, term_id)
REFERENCES terms (school_id, academic_session_id, id)
ON DELETE RESTRICT;


-- ============================================================
-- 4. REPORTING INDEX
-- ============================================================

CREATE INDEX idx_expenses_school_academic_period
ON expenses (school_id, academic_session_id, term_id);


COMMIT;
