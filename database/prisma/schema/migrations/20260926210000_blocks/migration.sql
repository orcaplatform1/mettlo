-- Add reporter relation index to reports
CREATE INDEX IF NOT EXISTS "reports_reporterId_idx" ON "reports"("reporterId");

-- Create blocks table
CREATE TABLE "blocks" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blocks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "blocks_blockerId_blockedId_key" UNIQUE ("blockerId", "blockedId")
);

CREATE INDEX "blocks_blockerId_idx" ON "blocks"("blockerId");
CREATE INDEX "blocks_blockedId_idx" ON "blocks"("blockedId");
