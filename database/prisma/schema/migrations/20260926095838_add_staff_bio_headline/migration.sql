-- AlterTable
ALTER TABLE "users" ADD COLUMN     "staffBio" VARCHAR(1000),
ADD COLUMN     "staffHeadline" VARCHAR(120);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
