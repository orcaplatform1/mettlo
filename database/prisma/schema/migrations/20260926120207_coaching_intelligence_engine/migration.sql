/*
  Warnings:

  - Added the required column `updatedAt` to the `coaching_notes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CoachingClientStatus" AS ENUM ('ACTIVE', 'ONBOARDING', 'AWAITING_ASSESSMENT', 'PAUSED', 'AT_RISK', 'INACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MetricCategory" AS ENUM ('BODY', 'CARDIOVASCULAR', 'PERFORMANCE', 'FLEXIBILITY_MOBILITY', 'SKILL', 'WELLNESS', 'NUTRITION', 'BRANCH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MetricDataType" AS ENUM ('NUMBER', 'PERCENTAGE', 'DURATION_SEC', 'SCALE_1_5', 'SCALE_1_10', 'YES_NO', 'TEXT');

-- CreateEnum
CREATE TYPE "MetricSide" AS ENUM ('NONE', 'LEFT_RIGHT');

-- CreateEnum
CREATE TYPE "MetricSource" AS ENUM ('MANUAL', 'COACH_ENTRY', 'WEARABLE', 'ASSESSMENT', 'CALCULATED');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('WEIGHT_MANAGEMENT', 'STRENGTH', 'HYPERTROPHY', 'ENDURANCE', 'MOBILITY', 'FLEXIBILITY', 'TECHNIQUE', 'PERFORMANCE', 'SKILL', 'COMPETITION', 'WELLNESS', 'STRESS_MANAGEMENT', 'HABIT_BUILDING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'PAUSED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AssessmentFieldType" AS ENUM ('TEXT', 'NUMBER', 'DECIMAL', 'DATE', 'DROPDOWN', 'MULTI_SELECT', 'CHECKBOX', 'RADIO', 'SCALE_1_5', 'SCALE_1_10', 'YES_NO', 'TEXTAREA', 'PHOTO', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('PENDING', 'DRAFT', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "CheckinFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CheckinStatus" AS ENUM ('PENDING', 'SUBMITTED', 'REVIEWED', 'NEEDS_ACTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('MISSED_WORKOUT', 'OVERDUE_CHECKIN', 'LOW_ADHERENCE', 'PROGRAM_ENDING', 'NO_ACTIVITY', 'METRIC_REGRESSION', 'CHECKIN_REPLY_PENDING', 'GOAL_STALLED', 'MESSAGE_UNANSWERED', 'SUBSCRIPTION_EXPIRING');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('WORKOUT_COMPLETED', 'WORKOUT_MISSED', 'CHECKIN_SUBMITTED', 'ASSESSMENT_SUBMITTED', 'METRIC_RECORDED', 'PHOTO_UPLOADED', 'SESSION_ATTENDED', 'SESSION_MISSED', 'MESSAGE_SENT', 'COACH_NOTE', 'GOAL_ACHIEVED', 'PROGRAM_STARTED', 'PROGRAM_COMPLETED', 'SUBSCRIPTION_STARTED', 'ALERT_RAISED');

-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('PRIVATE_COACH', 'SHARED_CLIENT');

-- CreateEnum
CREATE TYPE "NoteCategory" AS ENUM ('GENERAL', 'SESSION', 'ASSESSMENT', 'NUTRITION', 'TECHNIQUE', 'FOLLOW_UP', 'PROGRESS');

-- CreateEnum
CREATE TYPE "SetType" AS ENUM ('WARMUP', 'WORKING', 'DROP_SET', 'AMRAP', 'FAILURE', 'BACKOFF', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'CUSTOM');

-- DropIndex
DROP INDEX "coaching_notes_clientId_idx";

-- AlterTable
ALTER TABLE "coaching_checkins" ADD COLUMN     "challenges" TEXT,
ADD COLUMN     "coachReviewedAt" TIMESTAMP(3),
ADD COLUMN     "energyScore" INTEGER,
ADD COLUMN     "highlights" TEXT,
ADD COLUMN     "moodScore" INTEGER,
ADD COLUMN     "motivationScore" INTEGER,
ADD COLUMN     "nutritionAdherencePct" INTEGER,
ADD COLUMN     "period" TEXT,
ADD COLUMN     "questions" TEXT,
ADD COLUMN     "recoveryScore" INTEGER,
ADD COLUMN     "sleepHours" DECIMAL(4,1),
ADD COLUMN     "sorenessScore" INTEGER,
ADD COLUMN     "status" "CheckinStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN     "stressScore" INTEGER,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "trainingAdherencePct" INTEGER;

-- AlterTable
ALTER TABLE "coaching_clients" ADD COLUMN     "coachingStatus" "CoachingClientStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "nextCheckinAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "coaching_notes" ADD COLUMN     "category" "NoteCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVATE_COACH';

-- AlterTable
ALTER TABLE "progress_photos" ADD COLUMN     "category" "PhotoCategory" NOT NULL DEFAULT 'FRONT',
ADD COLUMN     "coachAnnotation" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "weightKgSnapshot" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "workout_exercises" ADD COLUMN     "rirTarget" INTEGER,
ADD COLUMN     "rpeTarget" DECIMAL(3,1),
ADD COLUMN     "setType" "SetType" NOT NULL DEFAULT 'WORKING',
ADD COLUMN     "volumeKg" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "metric_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MetricCategory" NOT NULL,
    "dataType" "MetricDataType" NOT NULL DEFAULT 'NUMBER',
    "unit" TEXT,
    "unitOptions" TEXT[],
    "creatorId" TEXT,
    "branchId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sides" "MetricSide" NOT NULL DEFAULT 'NONE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_values" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "valueRight" DECIMAL(14,4),
    "unit" TEXT NOT NULL,
    "source" "MetricSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "mediaId" TEXT,
    "coachId" TEXT,
    "checkinId" TEXT,
    "assessmentId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_goals" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "GoalCategory" NOT NULL DEFAULT 'CUSTOM',
    "metricId" TEXT,
    "baselineValue" DECIMAL(14,4),
    "targetValue" DECIMAL(14,4),
    "unit" TEXT,
    "targetDate" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "coachNote" TEXT,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_templates" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "branchId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" "AssessmentFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "minValue" DECIMAL(10,2),
    "maxValue" DECIMAL(10,2),
    "unit" TEXT,
    "metricId" TEXT,
    "hint" TEXT,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_responses" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "periodLabel" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "coachNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_response_items" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DECIMAL(14,4),
    "valueJson" JSONB,
    "mediaIds" TEXT[],

    CONSTRAINT "assessment_response_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_templates" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "frequency" "CheckinFrequency" NOT NULL DEFAULT 'WEEKLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkin_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_schedules" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "checkin_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_alerts" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_timeline_events" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metric_definitions_slug_key" ON "metric_definitions"("slug");

-- CreateIndex
CREATE INDEX "metric_definitions_creatorId_idx" ON "metric_definitions"("creatorId");

-- CreateIndex
CREATE INDEX "metric_definitions_branchId_idx" ON "metric_definitions"("branchId");

-- CreateIndex
CREATE INDEX "metric_definitions_isSystem_category_idx" ON "metric_definitions"("isSystem", "category");

-- CreateIndex
CREATE INDEX "metric_values_userId_metricId_recordedAt_idx" ON "metric_values"("userId", "metricId", "recordedAt");

-- CreateIndex
CREATE INDEX "metric_values_coachId_idx" ON "metric_values"("coachId");

-- CreateIndex
CREATE INDEX "client_goals_clientId_status_idx" ON "client_goals"("clientId", "status");

-- CreateIndex
CREATE INDEX "assessment_templates_creatorId_idx" ON "assessment_templates"("creatorId");

-- CreateIndex
CREATE INDEX "assessment_questions_templateId_position_idx" ON "assessment_questions"("templateId", "position");

-- CreateIndex
CREATE INDEX "assessment_responses_templateId_clientId_idx" ON "assessment_responses"("templateId", "clientId");

-- CreateIndex
CREATE INDEX "assessment_response_items_responseId_idx" ON "assessment_response_items"("responseId");

-- CreateIndex
CREATE INDEX "checkin_templates_creatorId_idx" ON "checkin_templates"("creatorId");

-- CreateIndex
CREATE INDEX "checkin_schedules_clientId_dueAt_idx" ON "checkin_schedules"("clientId", "dueAt");

-- CreateIndex
CREATE INDEX "client_alerts_creatorId_isRead_createdAt_idx" ON "client_alerts"("creatorId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "client_alerts_clientId_idx" ON "client_alerts"("clientId");

-- CreateIndex
CREATE INDEX "client_timeline_events_clientId_createdAt_idx" ON "client_timeline_events"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "coaching_checkins_clientId_status_idx" ON "coaching_checkins"("clientId", "status");

-- CreateIndex
CREATE INDEX "coaching_clients_creatorId_coachingStatus_idx" ON "coaching_clients"("creatorId", "coachingStatus");

-- CreateIndex
CREATE INDEX "coaching_notes_clientId_visibility_idx" ON "coaching_notes"("clientId", "visibility");

-- AddForeignKey
ALTER TABLE "coaching_checkins" ADD CONSTRAINT "coaching_checkins_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checkin_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_definitions" ADD CONSTRAINT "metric_definitions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metric_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "coaching_checkins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_values" ADD CONSTRAINT "metric_values_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_goals" ADD CONSTRAINT "client_goals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "coaching_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_goals" ADD CONSTRAINT "client_goals_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metric_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metric_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "assessment_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "coaching_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_response_items" ADD CONSTRAINT "assessment_response_items_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "assessment_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_response_items" ADD CONSTRAINT "assessment_response_items_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_templates" ADD CONSTRAINT "checkin_templates_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_schedules" ADD CONSTRAINT "checkin_schedules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checkin_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_schedules" ADD CONSTRAINT "checkin_schedules_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "coaching_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_alerts" ADD CONSTRAINT "client_alerts_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_alerts" ADD CONSTRAINT "client_alerts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "coaching_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_timeline_events" ADD CONSTRAINT "client_timeline_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "coaching_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
