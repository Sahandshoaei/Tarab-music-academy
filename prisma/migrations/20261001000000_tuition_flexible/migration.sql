-- Drop old installment system (invoices, installments, payments, payment_installments)
DROP TABLE IF EXISTS "payment_installments" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "installments" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;

-- Create flexible tuition payment system (any amount, receipt required, manual class allocation)
CREATE TABLE "tuition_payments" (
    "id" SERIAL PRIMARY KEY,
    "student_id" INTEGER NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "amount" INTEGER NOT NULL,
    "paid_at" DATE NOT NULL,
    "receipt_image_url" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "tuition_payments_student_id_idx" ON "tuition_payments"("student_id");

CREATE TABLE "tuition_payment_allocations" (
    "payment_id" INTEGER NOT NULL REFERENCES "tuition_payments"("id") ON DELETE CASCADE,
    "class_id" INTEGER NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
    "amount" INTEGER NOT NULL,
    CONSTRAINT "tuition_payment_allocations_pkey" PRIMARY KEY ("payment_id", "class_id")
);
