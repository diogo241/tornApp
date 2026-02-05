-- DropForeignKey
ALTER TABLE "club_balance" DROP CONSTRAINT "club_balance_clubId_fkey";

-- DropForeignKey
ALTER TABLE "club_funding" DROP CONSTRAINT "club_funding_clubId_fkey";

-- DropForeignKey
ALTER TABLE "referee_assignment" DROP CONSTRAINT "referee_assignment_refereeId_fkey";

-- DropForeignKey
ALTER TABLE "referee_assignment" DROP CONSTRAINT "referee_assignment_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "tournament" DROP CONSTRAINT "tournament_clubId_fkey";

-- AlterTable
ALTER TABLE "referee_assignment" ADD COLUMN     "countARef" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "countBRef" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "countCRef" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "tournament" ADD CONSTRAINT "tournament_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_assignment" ADD CONSTRAINT "referee_assignment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_assignment" ADD CONSTRAINT "referee_assignment_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "referee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_funding" ADD CONSTRAINT "club_funding_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_balance" ADD CONSTRAINT "club_balance_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
