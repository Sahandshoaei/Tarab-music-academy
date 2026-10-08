-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "card_number" TEXT,
ADD COLUMN     "sheba" TEXT;

-- CreateTable
CREATE TABLE "teacher_receipts" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_at" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_receipts_teacher_id_idx" ON "teacher_receipts"("teacher_id");

-- AddForeignKey
ALTER TABLE "teacher_receipts" ADD CONSTRAINT "teacher_receipts_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
