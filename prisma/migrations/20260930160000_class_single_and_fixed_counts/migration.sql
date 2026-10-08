-- Update class scheduling: fixed 10/10/10/8 sessions, SINGLE pattern, remove weekday2 (group 2-days removed)
ALTER TYPE "ScheduleType" ADD VALUE IF NOT EXISTS 'SINGLE';
ALTER TABLE "classes" DROP COLUMN IF EXISTS "weekday2";
