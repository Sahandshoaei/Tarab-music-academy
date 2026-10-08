-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('PRIVATE', 'GROUP', 'SEMI_GROUP', 'PRACTICE');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('WEEKLY', 'AD_HOC');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('FRIENDS', 'INSTAGRAM', 'SIGN', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "SmsAudienceType" AS ENUM ('INDIVIDUAL', 'CLASS', 'INSTRUMENT', 'ALL_ACTIVE', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "SmsRecipientPhone" AS ENUM ('STUDENT', 'GUARDIAN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "instruments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "national_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "guardian_phone" TEXT NOT NULL,
    "address" TEXT,
    "registration_date" DATE NOT NULL,
    "referral_source" "ReferralSource",
    "referral_note" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_instruments" (
    "teacher_id" INTEGER NOT NULL,
    "instrument_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_instruments_pkey" PRIMARY KEY ("teacher_id","instrument_id")
);

-- CreateTable
CREATE TABLE "student_instruments" (
    "student_id" INTEGER NOT NULL,
    "instrument_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_instruments_pkey" PRIMARY KEY ("student_id","instrument_id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "school_name" TEXT,
    "open_time" TEXT NOT NULL DEFAULT '09:00',
    "close_time" TEXT NOT NULL DEFAULT '21:00',
    "closed_days" "Weekday"[] DEFAULT ARRAY['THURSDAY', 'FRIDAY']::"Weekday"[],
    "sms_provider" TEXT,
    "sms_api_key" TEXT,
    "sms_sender_line" TEXT,
    "sms_default_phone_target" "SmsRecipientPhone" NOT NULL DEFAULT 'STUDENT',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "type" "ClassType" NOT NULL,
    "schedule_type" "ScheduleType" NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "instrument_id" INTEGER NOT NULL,
    "term_id" INTEGER NOT NULL,
    "weekday" "Weekday",
    "start_time" TEXT,
    "end_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "room_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "is_overridden" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "recorded_by_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "term_id" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "note" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installments" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod",
    "paid_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_installments" (
    "payment_id" INTEGER NOT NULL,
    "installment_id" INTEGER NOT NULL,
    "applied_amount" INTEGER NOT NULL,

    CONSTRAINT "payment_installments_pkey" PRIMARY KEY ("payment_id","installment_id")
);

-- CreateTable
CREATE TABLE "sms_templates" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_batches" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "audience_type" "SmsAudienceType" NOT NULL,
    "audience_ref" TEXT,
    "total_count" INTEGER NOT NULL,
    "sent_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_messages" (
    "id" SERIAL NOT NULL,
    "batch_id" TEXT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_target" "SmsRecipientPhone" NOT NULL,
    "template_id" INTEGER,
    "body" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "provider_ref" TEXT,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_name_key" ON "instruments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE INDEX "teachers_phone_idx" ON "teachers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "students_national_id_key" ON "students"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "students_full_name_idx" ON "students"("full_name");

-- CreateIndex
CREATE INDEX "students_phone_idx" ON "students"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");

-- CreateIndex
CREATE INDEX "classes_teacher_id_idx" ON "classes"("teacher_id");

-- CreateIndex
CREATE INDEX "classes_room_id_idx" ON "classes"("room_id");

-- CreateIndex
CREATE INDEX "classes_term_id_idx" ON "classes"("term_id");

-- CreateIndex
CREATE INDEX "classes_schedule_type_idx" ON "classes"("schedule_type");

-- CreateIndex
CREATE INDEX "class_sessions_date_idx" ON "class_sessions"("date");

-- CreateIndex
CREATE INDEX "class_sessions_room_id_date_idx" ON "class_sessions"("room_id", "date");

-- CreateIndex
CREATE INDEX "class_sessions_teacher_id_date_idx" ON "class_sessions"("teacher_id", "date");

-- CreateIndex
CREATE INDEX "class_sessions_class_id_date_idx" ON "class_sessions"("class_id", "date");

-- CreateIndex
CREATE INDEX "enrollments_student_id_idx" ON "enrollments"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_class_id_student_id_key" ON "enrollments"("class_id", "student_id");

-- CreateIndex
CREATE INDEX "attendances_student_id_idx" ON "attendances"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_session_id_student_id_key" ON "attendances"("session_id", "student_id");

-- CreateIndex
CREATE INDEX "invoices_student_id_idx" ON "invoices"("student_id");

-- CreateIndex
CREATE INDEX "invoices_term_id_idx" ON "invoices"("term_id");

-- CreateIndex
CREATE INDEX "installments_invoice_id_idx" ON "installments"("invoice_id");

-- CreateIndex
CREATE INDEX "installments_due_date_idx" ON "installments"("due_date");

-- CreateIndex
CREATE INDEX "payments_student_id_idx" ON "payments"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "sms_templates_title_key" ON "sms_templates"("title");

-- CreateIndex
CREATE INDEX "sms_batches_created_at_idx" ON "sms_batches"("created_at");

-- CreateIndex
CREATE INDEX "sms_messages_student_id_created_at_idx" ON "sms_messages"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "sms_messages_status_idx" ON "sms_messages"("status");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_instruments" ADD CONSTRAINT "teacher_instruments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_instruments" ADD CONSTRAINT "teacher_instruments_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_instruments" ADD CONSTRAINT "student_instruments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_instruments" ADD CONSTRAINT "student_instruments_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "installments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_batches" ADD CONSTRAINT "sms_batches_sent_by_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "sms_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "sms_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════ قیود دستی (خارج از قدرت بیان Prisma) — مرجع: docs/03-database-design.md §۷ ═══════════

-- ۱) حداکثر یک ترم فعال (F0-AC2) — ایندکس یکتای جزئی
CREATE UNIQUE INDEX "terms_one_active" ON "terms" ("is_active") WHERE "is_active" = true;

-- ۲) جستجوی متنی سریع روی نام/تلفن هنرجو (F2-AC5)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "students_full_name_trgm" ON "students" USING gin ("full_name" gin_trgm_ops);
CREATE INDEX "students_phone_trgm" ON "students" USING gin ("phone" gin_trgm_ops);
