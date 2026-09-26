-- CreateEnum
CREATE TYPE "BusinessCategory" AS ENUM ('FITNESS_GYM', 'PILATES_STUDIO', 'YOGA_STUDIO', 'DANCE_STUDIO', 'HIIT_STUDIO', 'BOXING_GYM', 'RUNNING_CLUB', 'WELLNESS_CENTER', 'NUTRITION_CLINIC', 'RECOVERY_STUDIO', 'SPORTS_CLUB', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('PENDING_DOCS', 'OPEN', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BusinessVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO');

-- CreateEnum
CREATE TYPE "CoachWorkplaceStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'PAYMENT_PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('FEED', 'STORY', 'SEARCH', 'MAP', 'BRANCH');

-- CreateEnum
CREATE TYPE "AdOwnerType" AS ENUM ('BUSINESS', 'COACH');

-- CreateEnum
CREATE TYPE "AdEventType" AS ENUM ('IMPRESSION', 'CLICK', 'PROFILE_VISIT', 'MAP_VIEW', 'DIRECTIONS_CLICK', 'SERVICE_VIEW', 'BOOKING', 'FOLLOW');

-- AlterEnum
ALTER TYPE "PaymentKind" ADD VALUE 'ADVERTISING';

-- AlterEnum
ALTER TYPE "ReviewTarget" ADD VALUE 'BUSINESS';

-- AlterTable
ALTER TABLE "user_personal_info" ADD COLUMN     "cityId" INTEGER,
ADD COLUMN     "districtId" INTEGER;

-- CreateTable
CREATE TABLE "turkey_cities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plateCode" INTEGER NOT NULL,

    CONSTRAINT "turkey_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turkey_districts" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "turkey_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_accounts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "BusinessCategory" NOT NULL,
    "description" TEXT,
    "shortDesc" VARCHAR(160),
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "website" TEXT,
    "phoneEnc" TEXT,
    "emailEnc" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "status" "BusinessStatus" NOT NULL DEFAULT 'PENDING_DOCS',
    "verificationStatus" "BusinessVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "cityId" INTEGER,
    "districtId" INTEGER,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_directory_entries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "BusinessCategory" NOT NULL,
    "address" TEXT,
    "cityId" INTEGER,
    "districtId" INTEGER,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "website" TEXT,
    "phone" TEXT,
    "businessAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_directory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_locations" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "cityId" INTEGER,
    "districtId" INTEGER,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "qrToken" TEXT NOT NULL,
    "qrRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_verifications" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "taxDocUrlEnc" TEXT,
    "taxDocUploadedAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" "BusinessVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_workplaces" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "directoryEntryId" TEXT,
    "businessId" TEXT,
    "customName" TEXT,
    "status" "CoachWorkplaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "isMainWorkplace" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "coach_workplaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_follows" (
    "followerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_follows_pkey" PRIMARY KEY ("followerId","businessId")
);

-- CreateTable
CREATE TABLE "business_check_ins" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'QR',
    "platform" "DevicePlatform",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "ownerType" "AdOwnerType" NOT NULL,
    "businessId" TEXT,
    "coachUserId" TEXT,
    "placement" "AdPlacement"[],
    "status" "AdStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(100),
    "budget" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "freqCapPerUser" INTEGER NOT NULL DEFAULT 3,
    "storySlotRule" INTEGER NOT NULL DEFAULT 8,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creatives" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "headline" VARCHAR(60) NOT NULL,
    "body" VARCHAR(150),
    "ctaLabel" VARCHAR(30) NOT NULL,
    "ctaUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_targets" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "cityId" INTEGER,
    "districtId" INTEGER,
    "branchSlug" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "gender" "Gender",

    CONSTRAINT "ad_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_events" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "type" "AdEventType" NOT NULL,
    "sessionKey" TEXT,
    "cityId" INTEGER,
    "platform" "DevicePlatform",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_frequency_records" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_frequency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "turkey_cities_name_key" ON "turkey_cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "turkey_cities_slug_key" ON "turkey_cities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "turkey_cities_plateCode_key" ON "turkey_cities"("plateCode");

-- CreateIndex
CREATE INDEX "turkey_cities_slug_idx" ON "turkey_cities"("slug");

-- CreateIndex
CREATE INDEX "turkey_districts_cityId_idx" ON "turkey_districts"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "turkey_districts_cityId_slug_key" ON "turkey_districts"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "business_accounts_slug_key" ON "business_accounts"("slug");

-- CreateIndex
CREATE INDEX "business_accounts_slug_idx" ON "business_accounts"("slug");

-- CreateIndex
CREATE INDEX "business_accounts_status_verificationStatus_idx" ON "business_accounts"("status", "verificationStatus");

-- CreateIndex
CREATE INDEX "business_accounts_cityId_category_idx" ON "business_accounts"("cityId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "business_directory_entries_slug_key" ON "business_directory_entries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "business_directory_entries_businessAccountId_key" ON "business_directory_entries"("businessAccountId");

-- CreateIndex
CREATE INDEX "business_directory_entries_cityId_category_idx" ON "business_directory_entries"("cityId", "category");

-- CreateIndex
CREATE INDEX "business_directory_entries_slug_idx" ON "business_directory_entries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "business_locations_qrToken_key" ON "business_locations"("qrToken");

-- CreateIndex
CREATE INDEX "business_locations_businessId_isActive_idx" ON "business_locations"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "business_verifications_businessId_status_idx" ON "business_verifications"("businessId", "status");

-- CreateIndex
CREATE INDEX "coach_workplaces_creatorId_status_idx" ON "coach_workplaces"("creatorId", "status");

-- CreateIndex
CREATE INDEX "business_follows_businessId_idx" ON "business_follows"("businessId");

-- CreateIndex
CREATE INDEX "business_check_ins_memberId_createdAt_idx" ON "business_check_ins"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "business_check_ins_businessId_createdAt_idx" ON "business_check_ins"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "business_check_ins_locationId_createdAt_idx" ON "business_check_ins"("locationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_configs_key_key" ON "pricing_configs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "advertisements_paymentId_key" ON "advertisements"("paymentId");

-- CreateIndex
CREATE INDEX "advertisements_status_startAt_endAt_idx" ON "advertisements"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "advertisements_businessId_status_idx" ON "advertisements"("businessId", "status");

-- CreateIndex
CREATE INDEX "ad_events_adId_type_createdAt_idx" ON "ad_events"("adId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ad_frequency_records_adId_userId_shownAt_idx" ON "ad_frequency_records"("adId", "userId", "shownAt");

-- AddForeignKey
ALTER TABLE "turkey_districts" ADD CONSTRAINT "turkey_districts_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "turkey_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_personal_info" ADD CONSTRAINT "user_personal_info_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "turkey_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_personal_info" ADD CONSTRAINT "user_personal_info_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "turkey_districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_accounts" ADD CONSTRAINT "business_accounts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_accounts" ADD CONSTRAINT "business_accounts_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_accounts" ADD CONSTRAINT "business_accounts_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "turkey_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_accounts" ADD CONSTRAINT "business_accounts_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "turkey_districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_directory_entries" ADD CONSTRAINT "business_directory_entries_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "turkey_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_directory_entries" ADD CONSTRAINT "business_directory_entries_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "turkey_districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_directory_entries" ADD CONSTRAINT "business_directory_entries_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "business_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "turkey_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "turkey_districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_workplaces" ADD CONSTRAINT "coach_workplaces_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_workplaces" ADD CONSTRAINT "coach_workplaces_directoryEntryId_fkey" FOREIGN KEY ("directoryEntryId") REFERENCES "business_directory_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_workplaces" ADD CONSTRAINT "coach_workplaces_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_follows" ADD CONSTRAINT "business_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_follows" ADD CONSTRAINT "business_follows_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_check_ins" ADD CONSTRAINT "business_check_ins_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_check_ins" ADD CONSTRAINT "business_check_ins_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_check_ins" ADD CONSTRAINT "business_check_ins_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "business_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_adId_fkey" FOREIGN KEY ("adId") REFERENCES "advertisements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_targets" ADD CONSTRAINT "ad_targets_adId_fkey" FOREIGN KEY ("adId") REFERENCES "advertisements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_targets" ADD CONSTRAINT "ad_targets_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "turkey_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_targets" ADD CONSTRAINT "ad_targets_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "turkey_districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_events" ADD CONSTRAINT "ad_events_adId_fkey" FOREIGN KEY ("adId") REFERENCES "advertisements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_frequency_records" ADD CONSTRAINT "ad_frequency_records_adId_fkey" FOREIGN KEY ("adId") REFERENCES "advertisements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_frequency_records" ADD CONSTRAINT "ad_frequency_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
