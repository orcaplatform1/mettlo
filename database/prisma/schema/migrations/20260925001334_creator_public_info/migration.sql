/*
  Warnings:

  - You are about to drop the column `socialLinks` on the `creator_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "creator_profiles" DROP COLUMN "socialLinks",
ADD COLUMN     "careerStartYear" INTEGER;
