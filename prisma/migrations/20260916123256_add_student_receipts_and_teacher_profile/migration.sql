-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('TAMIN_EJTEMAEI', 'SALAMAT', 'OTHER');

-- DropIndex
DROP INDEX "students_full_name_trgm";

-- DropIndex
DROP INDEX "students_phone_trgm";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "signature_image_url" TEXT;

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "insurance_number" TEXT,
ADD COLUMN     "insurance_type" "InsuranceType",
ADD COLUMN     "is_qualified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualification_note" TEXT,
ADD COLUMN     "resume_image_url" TEXT,
ADD COLUMN     "teaching_experience_note" TEXT,
ADD COLUMN     "teaching_experience_years" INTEGER;

-- CreateTable
CREATE TABLE "student_receipts" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_at" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_receipts_student_id_idx" ON "student_receipts"("student_id");

-- AddForeignKey
ALTER TABLE "student_receipts" ADD CONSTRAINT "student_receipts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
