-- CreateEnum
CREATE TYPE "CoachWorkMode" AS ENUM ('FREELANCE', 'BUSINESS', 'MULTI_BUSINESS', 'HYBRID');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "EventTicketStatus" AS ENUM ('ACTIVE', 'USED', 'CANCELLED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EventRegistrationStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "JobPostStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "FoodItemStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "FoodOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('PICKUP', 'DELIVERY', 'BOTH');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutAccountStatus" AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BalanceAccountType" AS ENUM ('CREATOR', 'BUSINESS', 'EVENT_ORGANIZER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BusinessCategory" ADD VALUE 'HEALTHY_FOOD';
ALTER TYPE "BusinessCategory" ADD VALUE 'SMOOTHIE_BAR';
ALTER TYPE "BusinessCategory" ADD VALUE 'MEAL_PREP';
ALTER TYPE "BusinessCategory" ADD VALUE 'PROTEIN_BAR';
ALTER TYPE "BusinessCategory" ADD VALUE 'HEALTHY_CAFE';
ALTER TYPE "BusinessCategory" ADD VALUE 'SPORTS_NUTRITION';
ALTER TYPE "BusinessCategory" ADD VALUE 'VEGAN';
ALTER TYPE "BusinessCategory" ADD VALUE 'VEGETARIAN';
ALTER TYPE "BusinessCategory" ADD VALUE 'GLUTEN_FREE';
ALTER TYPE "BusinessCategory" ADD VALUE 'RAW_FOOD';
ALTER TYPE "BusinessCategory" ADD VALUE 'FUNCTIONAL_NUTRITION';
ALTER TYPE "BusinessCategory" ADD VALUE 'FUNCTIONAL_BEVERAGES';
ALTER TYPE "BusinessCategory" ADD VALUE 'SPECIAL_DIET';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentKind" ADD VALUE 'EVENT_TICKET';
ALTER TYPE "PaymentKind" ADD VALUE 'FOOD_ORDER';

-- AlterTable
ALTER TABLE "coach_workplaces" ADD COLUMN     "workMode" "CoachWorkMode";

-- AlterTable
ALTER TABLE "creator_earnings" ADD COLUMN     "commissionRateSnapshot" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "platform_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "platform_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_categories" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_items" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceKurus" INTEGER NOT NULL,
    "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'BOTH',
    "status" "FoodItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "nutritionJson" JSONB,
    "allergens" TEXT,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "preparationMinutes" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_orders" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "FoodOrderStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryMode" "DeliveryMode" NOT NULL,
    "totalKurus" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitKurus" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "food_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "businessId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "locationName" TEXT,
    "locationAddress" TEXT,
    "cityId" INTEGER,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "onlineLink" TEXT,
    "capacityLimit" INTEGER,
    "ticketPriceKurus" INTEGER NOT NULL DEFAULT 0,
    "commissionPct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_tickets" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "EventTicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "qrToken" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EventRegistrationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "workMode" "CoachWorkMode" NOT NULL DEFAULT 'BUSINESS',
    "branchSlugs" TEXT[],
    "cityId" INTEGER,
    "status" "JobPostStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_job_applications" (
    "id" TEXT NOT NULL,
    "jobPostId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_offers" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "jobPostId" TEXT,
    "message" TEXT NOT NULL,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_matching_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "queryJson" JSONB NOT NULL,
    "responseJson" JSONB,
    "modelUsed" TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_matching_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings_balances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" "BalanceAccountType" NOT NULL,
    "businessId" TEXT,
    "totalEarningsKurus" INTEGER NOT NULL DEFAULT 0,
    "pendingKurus" INTEGER NOT NULL DEFAULT 0,
    "availableKurus" INTEGER NOT NULL DEFAULT 0,
    "totalPaidOutKurus" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earnings_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ibanEnc" TEXT NOT NULL,
    "ibanHash" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "bankName" TEXT,
    "status" "PayoutAccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "providerRef" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "payoutAccountId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "amountKurus" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "providerPayoutId" TEXT,
    "providerResponse" JSONB,
    "failureReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payoutId" TEXT,
    "rawPayload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_configs_key_key" ON "platform_configs"("key");

-- CreateIndex
CREATE INDEX "food_categories_businessId_sortOrder_idx" ON "food_categories"("businessId", "sortOrder");

-- CreateIndex
CREATE INDEX "food_items_businessId_status_idx" ON "food_items"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "food_orders_paymentId_key" ON "food_orders"("paymentId");

-- CreateIndex
CREATE INDEX "food_orders_businessId_status_idx" ON "food_orders"("businessId", "status");

-- CreateIndex
CREATE INDEX "food_orders_customerId_idx" ON "food_orders"("customerId");

-- CreateIndex
CREATE INDEX "food_order_items_orderId_idx" ON "food_order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_organizerId_status_idx" ON "events"("organizerId", "status");

-- CreateIndex
CREATE INDEX "events_startsAt_idx" ON "events"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_paymentId_key" ON "event_tickets"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_qrToken_key" ON "event_tickets"("qrToken");

-- CreateIndex
CREATE INDEX "event_tickets_eventId_status_idx" ON "event_tickets"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_tickets_holderId_idx" ON "event_tickets"("holderId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_eventId_userId_key" ON "event_registrations"("eventId", "userId");

-- CreateIndex
CREATE INDEX "job_posts_businessId_status_idx" ON "job_posts"("businessId", "status");

-- CreateIndex
CREATE INDEX "job_posts_status_cityId_idx" ON "job_posts"("status", "cityId");

-- CreateIndex
CREATE INDEX "coach_job_applications_creatorId_status_idx" ON "coach_job_applications"("creatorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "coach_job_applications_jobPostId_creatorId_key" ON "coach_job_applications"("jobPostId", "creatorId");

-- CreateIndex
CREATE INDEX "business_offers_businessId_idx" ON "business_offers"("businessId");

-- CreateIndex
CREATE INDEX "business_offers_creatorId_status_idx" ON "business_offers"("creatorId", "status");

-- CreateIndex
CREATE INDEX "ai_matching_logs_userId_createdAt_idx" ON "ai_matching_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "earnings_balances_userId_key" ON "earnings_balances"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "earnings_balances_businessId_key" ON "earnings_balances"("businessId");

-- CreateIndex
CREATE INDEX "earnings_balances_accountType_idx" ON "earnings_balances"("accountType");

-- CreateIndex
CREATE INDEX "payout_accounts_userId_isActive_idx" ON "payout_accounts"("userId", "isActive");

-- CreateIndex
CREATE INDEX "payout_accounts_ibanHash_idx" ON "payout_accounts"("ibanHash");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_idempotencyKey_key" ON "payouts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payouts_requestedById_status_idx" ON "payouts"("requestedById", "status");

-- CreateIndex
CREATE INDEX "payouts_balanceId_status_idx" ON "payouts"("balanceId", "status");

-- CreateIndex
CREATE INDEX "payouts_status_createdAt_idx" ON "payouts"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payout_webhook_events_eventId_key" ON "payout_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "payout_webhook_events_payoutId_idx" ON "payout_webhook_events"("payoutId");

-- AddForeignKey
ALTER TABLE "platform_configs" ADD CONSTRAINT "platform_configs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_categories" ADD CONSTRAINT "food_categories_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "food_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "food_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "turkey_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "turkey_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_job_applications" ADD CONSTRAINT "coach_job_applications_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_job_applications" ADD CONSTRAINT "coach_job_applications_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_offers" ADD CONSTRAINT "business_offers_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_offers" ADD CONSTRAINT "business_offers_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_offers" ADD CONSTRAINT "business_offers_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "job_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_matching_logs" ADD CONSTRAINT "ai_matching_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings_balances" ADD CONSTRAINT "earnings_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings_balances" ADD CONSTRAINT "earnings_balances_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "earnings_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payoutAccountId_fkey" FOREIGN KEY ("payoutAccountId") REFERENCES "payout_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
