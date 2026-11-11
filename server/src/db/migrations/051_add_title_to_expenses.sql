-- Add a distinct title to school expenses.

ALTER TABLE expenses
    ADD COLUMN title VARCHAR(150);

-- Preserve existing expense records by using their category name as the initial title.
UPDATE expenses
SET title = expense_category_name
WHERE title IS NULL;

ALTER TABLE expenses
    ALTER COLUMN title SET NOT NULL;

ALTER TABLE expenses
    ADD CONSTRAINT valid_expense_title
    CHECK (LENGTH(TRIM(title)) > 0);
