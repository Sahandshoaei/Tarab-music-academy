-- AlterTable: add tuition rates per class type
ALTER TABLE "school_settings" ADD COLUMN "private_rate" INTEGER;
ALTER TABLE "school_settings" ADD COLUMN "group_rate" INTEGER;
ALTER TABLE "school_settings" ADD COLUMN "semi_group_rate" INTEGER;
ALTER TABLE "school_settings" ADD COLUMN "practice_rate" INTEGER;
