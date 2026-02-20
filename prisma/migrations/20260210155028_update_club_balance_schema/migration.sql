/*
  Warnings:

  - You are about to drop the column `clubBalanceId` on the `club` table. All the data in the column will be lost.
  - Added the required column `clubId` to the `club_balance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "club" DROP CONSTRAINT "club_clubBalanceId_fkey";

-- AlterTable
ALTER TABLE "club" DROP COLUMN "clubBalanceId";

-- AlterTable
ALTER TABLE "club_balance" ADD COLUMN     "clubId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "club_balance" ADD CONSTRAINT "club_balance_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
