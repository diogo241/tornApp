/*
  Warnings:

  - You are about to drop the column `totalCostToReferees` on the `club_balance` table. All the data in the column will be lost.
  - You are about to drop the column `totalFundingReceived` on the `club_balance` table. All the data in the column will be lost.
  - You are about to drop the column `isPaid` on the `club_funding` table. All the data in the column will be lost.
  - You are about to drop the column `paidDate` on the `club_funding` table. All the data in the column will be lost.
  - Added the required column `clubFundingId` to the `club_balance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "club_funding" DROP CONSTRAINT "club_funding_clubId_fkey";

-- DropIndex
DROP INDEX "club_funding_clubId_year_key";

-- AlterTable
ALTER TABLE "club_balance" DROP COLUMN "totalCostToReferees",
DROP COLUMN "totalFundingReceived",
ADD COLUMN     "clubFundingId" TEXT NOT NULL,
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "club_funding" DROP COLUMN "isPaid",
DROP COLUMN "paidDate",
ALTER COLUMN "clubId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "club_balance" ADD CONSTRAINT "club_balance_clubFundingId_fkey" FOREIGN KEY ("clubFundingId") REFERENCES "club_funding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
