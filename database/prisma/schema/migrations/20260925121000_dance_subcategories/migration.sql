-- CreateEnum
CREATE TYPE "DanceSubCategory" AS ENUM ('ZUMBA', 'ORIENTAL', 'MODERN_DANCE', 'POLE_FITNESS');

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN     "danceSubCategories" "DanceSubCategory"[] DEFAULT ARRAY[]::"DanceSubCategory"[];

