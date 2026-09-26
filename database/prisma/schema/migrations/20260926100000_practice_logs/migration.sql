-- CreateTable
CREATE TABLE "practice_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL,
    "intensity" INTEGER,
    "moodBefore" INTEGER,
    "moodAfter" INTEGER,
    "caloriesEst" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "practice_logs_userId_branch_date_idx" ON "practice_logs"("userId", "branch", "date");

-- AddForeignKey
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
