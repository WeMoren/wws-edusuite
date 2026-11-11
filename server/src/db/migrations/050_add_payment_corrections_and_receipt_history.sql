-- Preserve issued receipts while allowing corrected receipts.

ALTER TABLE payment_receipts
    DROP CONSTRAINT unique_payment_receipt_payment;

ALTER TABLE payment_receipts
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'current',
    ADD COLUMN superseded_at TIMESTAMPTZ,
    ADD COLUMN superseded_by UUID,
    ADD COLUMN superseded_reason TEXT;

ALTER TABLE payment_receipts
    ADD CONSTRAINT valid_payment_receipt_status
    CHECK (status IN ('current', 'superseded'));

ALTER TABLE payment_receipts
    ADD CONSTRAINT fk_payment_receipts_superseded_by
    FOREIGN KEY (superseded_by)
    REFERENCES users(id)
    ON DELETE RESTRICT;

CREATE UNIQUE INDEX unique_current_payment_receipt
    ON payment_receipts (payment_id)
    WHERE status = 'current';

CREATE TABLE payment_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL,
    payment_id UUID NOT NULL,
    corrected_by UUID NOT NULL,

    correction_reason TEXT NOT NULL,

    old_values JSONB NOT NULL,
    new_values JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payment_corrections_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_corrections_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_corrections_user
        FOREIGN KEY (corrected_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_payment_correction_reason
        CHECK (LENGTH(TRIM(correction_reason)) > 0)
);

CREATE INDEX idx_payment_corrections_payment
    ON payment_corrections (school_id, payment_id, created_at DESC);

CREATE INDEX idx_payment_corrections_user
    ON payment_corrections (corrected_by);
