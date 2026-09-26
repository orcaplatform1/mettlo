/*
  Warnings:

  - You are about to drop the column `price` on the `session_packs` table. All the data in the column will be lost.
  - Added the required column `priceWeb` to the `session_packs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LiveConnectionEventType" AS ENUM ('CONNECTED', 'DISCONNECTED', 'RECONNECTED', 'SESSION_ENDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LiveStatus" ADD VALUE 'READY';
ALTER TYPE "LiveStatus" ADD VALUE 'CONNECTION_LOST';
ALTER TYPE "LiveStatus" ADD VALUE 'RECONNECTING';
ALTER TYPE "LiveStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "LiveStatus" ADD VALUE 'INTERRUPTED';
ALTER TYPE "LiveStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "live_sessions" ADD COLUMN     "entitlementConsumed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastDisconnectAt" TIMESTAMP(3),
ADD COLUMN     "reconnectGraceExpiresAt" TIMESTAMP(3),
ADD COLUMN     "scheduledDurationMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalConnectedSec" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videoBalanceId" TEXT;

-- AlterTable
ALTER TABLE "session_packs" DROP COLUMN "price",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isVideoCoaching" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceMobile" DECIMAL(12,2),
ADD COLUMN     "priceWeb" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "sessionDurationMin" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "creatorId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "live_connection_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" "LiveConnectionEventType" NOT NULL,
    "connectedSec" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_connection_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_session_balances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "paymentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_session_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_session_consumptions" (
    "id" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_session_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_connection_events_sessionId_createdAt_idx" ON "live_connection_events"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "video_session_balances_userId_remaining_idx" ON "video_session_balances"("userId", "remaining");

-- CreateIndex
CREATE UNIQUE INDEX "video_session_consumptions_sessionId_key" ON "video_session_consumptions"("sessionId");

-- CreateIndex
CREATE INDEX "video_session_consumptions_balanceId_idx" ON "video_session_consumptions"("balanceId");

-- CreateIndex
CREATE INDEX "session_packs_isVideoCoaching_isActive_idx" ON "session_packs"("isVideoCoaching", "isActive");

-- AddForeignKey
ALTER TABLE "live_connection_events" ADD CONSTRAINT "live_connection_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_session_balances" ADD CONSTRAINT "video_session_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_session_balances" ADD CONSTRAINT "video_session_balances_packId_fkey" FOREIGN KEY ("packId") REFERENCES "session_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_session_consumptions" ADD CONSTRAINT "video_session_consumptions_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "video_session_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
