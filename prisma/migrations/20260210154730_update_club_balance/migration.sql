/*
  Warnings:

  - You are about to drop the column `clubId` on the `club_balance` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `club_balance` table. All the data in the column will be lost.
  - Added the required column `clubBalanceId` to the `club` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "club_balance" DROP CONSTRAINT "club_balance_clubId_fkey";

-- DropIndex
DROP INDEX "club_balance_clubId_year_key";

-- AlterTable
ALTER TABLE "club" ADD COLUMN     "clubBalanceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "club_balance" DROP COLUMN "clubId",
DROP COLUMN "year";

-- AlterTable
ALTER TABLE "club_funding" ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "club" ADD CONSTRAINT "club_clubBalanceId_fkey" FOREIGN KEY ("clubBalanceId") REFERENCES "club_balance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
