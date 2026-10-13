BEGIN;

-- Preserve the billing figures used for each individual payment.
ALTER TABLE subscription_payments
ADD COLUMN active_student_count INTEGER,
ADD COLUMN price_per_student NUMERIC(12, 2);

-- Preserve historical payment records by backfilling from their subscriptions.
UPDATE subscription_payments AS payment
SET
active_student_count = COALESCE(subscription.active_student_count, 0),
price_per_student = COALESCE(subscription.price_per_student, 0)
FROM subscriptions AS subscription
WHERE subscription.id = payment.subscription_id;

-- Every payment record must have its own billing snapshot.
ALTER TABLE subscription_payments
ALTER COLUMN active_student_count SET NOT NULL,
ALTER COLUMN price_per_student SET NOT NULL;

ALTER TABLE subscription_payments
ADD CONSTRAINT chk_payment_student_count_nonnegative
CHECK (active_student_count >= 0),
ADD CONSTRAINT chk_payment_price_per_student_nonnegative
CHECK (price_per_student >= 0);

COMMIT;
