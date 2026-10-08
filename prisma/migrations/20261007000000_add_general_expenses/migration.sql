-- هزینه‌های جانبی آموزشگاه (نظافت/برق/گاز/آب/اجاره/سایر) — ثبت دستی ادمین
CREATE TYPE "GeneralExpenseCategory" AS ENUM ('CLEANING', 'ELECTRICITY', 'GAS', 'WATER', 'RENT', 'OTHER');

CREATE TABLE "general_expenses" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" "GeneralExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "amount" INTEGER NOT NULL,
    "paid_at" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "general_expenses_paid_at_idx" ON "general_expenses"("paid_at");
CREATE INDEX "general_expenses_category_idx" ON "general_expenses"("category");
