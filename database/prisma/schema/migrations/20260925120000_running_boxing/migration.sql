-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('EASY', 'TEMPO', 'INTERVAL', 'LONG', 'RACE');

-- CreateEnum
CREATE TYPE "RunPlanType" AS ENUM ('EASY', 'TEMPO', 'INTERVAL', 'LONG', 'RACE', 'REST');

-- CreateEnum
CREATE TYPE "RaceDistance" AS ENUM ('FIVE_K', 'TEN_K', 'HALF_MARATHON', 'MARATHON', 'OTHER');

-- CreateEnum
CREATE TYPE "RaceGoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrainingPhase" AS ENUM ('BASE', 'BUILD', 'PEAK', 'TAPER');

-- CreateEnum
CREATE TYPE "BoxingTechniqueCategory" AS ENUM ('JAB', 'CROSS', 'HOOK', 'UPPERCUT', 'BODY_SHOT', 'COMBINATION', 'DEFENSE', 'FOOTWORK');

-- CreateEnum
CREATE TYPE "TechniqueStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'MASTERED');

-- CreateEnum
CREATE TYPE "BoxingSessionType" AS ENUM ('TECHNICAL', 'SPARRING', 'CONDITIONING', 'BAG_WORK');

-- CreateTable
CREATE TABLE "running_profiles" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "maxHeartRate" INTEGER,
    "fiveKPaceSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "running_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "running_shoes" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "purchasedAt" DATE,
    "initialKm" DECIMAL(8,1) NOT NULL DEFAULT 0,
    "totalKm" DECIMAL(8,1) NOT NULL DEFAULT 0,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "running_shoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "running_logs" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "distanceKm" DECIMAL(6,2) NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "avgPaceSecPerKm" INTEGER NOT NULL,
    "avgHeartRate" INTEGER,
    "runType" "RunType" NOT NULL DEFAULT 'EASY',
    "shoeId" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "running_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "running_injury_logs" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startedOn" DATE NOT NULL,
    "endedOn" DATE,
    "area" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "pauseTraining" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "running_injury_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_race_goals" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "coachId" TEXT,
    "name" TEXT NOT NULL,
    "distance" "RaceDistance" NOT NULL,
    "raceDate" DATE NOT NULL,
    "targetTimeSec" INTEGER,
    "status" "RaceGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_race_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_running_plans" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekStart" DATE NOT NULL,
    "phase" "TrainingPhase" NOT NULL DEFAULT 'BASE',
    "dayOfWeek" INTEGER NOT NULL,
    "runType" "RunPlanType" NOT NULL,
    "targetDistanceKm" DECIMAL(6,2),
    "targetPaceZone" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_running_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxing_techniques" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BoxingTechniqueCategory" NOT NULL,
    "notation" TEXT,
    "description" TEXT,
    "videoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boxing_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_technique_progress" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "techniqueId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "status" "TechniqueStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "coachNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_technique_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_weight_categories" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DECIMAL(5,1) NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_weight_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxing_session_logs" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rounds" INTEGER NOT NULL,
    "roundSec" INTEGER NOT NULL,
    "restSec" INTEGER NOT NULL,
    "sessionType" "BoxingSessionType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boxing_session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "running_profiles_memberId_key" ON "running_profiles"("memberId");

-- CreateIndex
CREATE INDEX "running_shoes_memberId_idx" ON "running_shoes"("memberId");

-- CreateIndex
CREATE INDEX "running_logs_memberId_date_idx" ON "running_logs"("memberId", "date");

-- CreateIndex
CREATE INDEX "running_injury_logs_memberId_startedOn_idx" ON "running_injury_logs"("memberId", "startedOn");

-- CreateIndex
CREATE INDEX "member_race_goals_memberId_status_idx" ON "member_race_goals"("memberId", "status");

-- CreateIndex
CREATE INDEX "member_race_goals_coachId_idx" ON "member_race_goals"("coachId");

-- CreateIndex
CREATE INDEX "coach_running_plans_memberId_weekStart_idx" ON "coach_running_plans"("memberId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "coach_running_plans_coachId_memberId_weekStart_dayOfWeek_key" ON "coach_running_plans"("coachId", "memberId", "weekStart", "dayOfWeek");

-- CreateIndex
CREATE INDEX "boxing_techniques_coachId_sortOrder_idx" ON "boxing_techniques"("coachId", "sortOrder");

-- CreateIndex
CREATE INDEX "member_technique_progress_coachId_memberId_idx" ON "member_technique_progress"("coachId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "member_technique_progress_memberId_techniqueId_key" ON "member_technique_progress"("memberId", "techniqueId");

-- CreateIndex
CREATE INDEX "member_weight_categories_memberId_date_idx" ON "member_weight_categories"("memberId", "date");

-- CreateIndex
CREATE INDEX "boxing_session_logs_memberId_date_idx" ON "boxing_session_logs"("memberId", "date");

-- AddForeignKey
ALTER TABLE "running_profiles" ADD CONSTRAINT "running_profiles_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_shoes" ADD CONSTRAINT "running_shoes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_logs" ADD CONSTRAINT "running_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_logs" ADD CONSTRAINT "running_logs_shoeId_fkey" FOREIGN KEY ("shoeId") REFERENCES "running_shoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_injury_logs" ADD CONSTRAINT "running_injury_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_race_goals" ADD CONSTRAINT "member_race_goals_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_race_goals" ADD CONSTRAINT "member_race_goals_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_running_plans" ADD CONSTRAINT "coach_running_plans_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_running_plans" ADD CONSTRAINT "coach_running_plans_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxing_techniques" ADD CONSTRAINT "boxing_techniques_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_technique_progress" ADD CONSTRAINT "member_technique_progress_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_technique_progress" ADD CONSTRAINT "member_technique_progress_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "boxing_techniques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_technique_progress" ADD CONSTRAINT "member_technique_progress_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_weight_categories" ADD CONSTRAINT "member_weight_categories_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxing_session_logs" ADD CONSTRAINT "boxing_session_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

