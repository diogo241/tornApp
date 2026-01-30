/*
  Warnings:

  - You are about to drop the `Club` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Club";

-- CreateTable
CREATE TABLE "club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "players" INTEGER NOT NULL,
    "refRate" DOUBLE PRECISION NOT NULL,
    "aRate" DOUBLE PRECISION NOT NULL,
    "minuteRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalGames" INTEGER NOT NULL,
    "countA" INTEGER NOT NULL DEFAULT 0,
    "durationA" INTEGER NOT NULL DEFAULT 0,
    "countB" INTEGER NOT NULL DEFAULT 0,
    "durationB" INTEGER NOT NULL DEFAULT 0,
    "countC" INTEGER NOT NULL DEFAULT 0,
    "durationC" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clubId" TEXT NOT NULL,
    "rateId" TEXT NOT NULL,

    CONSTRAINT "tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "referee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referee_assignment" (
    "id" TEXT NOT NULL,
    "countA" INTEGER NOT NULL DEFAULT 0,
    "countB" INTEGER NOT NULL DEFAULT 0,
    "countC" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tournamentId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,

    CONSTRAINT "referee_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_funding" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 300.00,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" TIMESTAMP(3),

    CONSTRAINT "club_funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_balance" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalCostToReferees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFundingReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netBalance" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "club_balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_funding_clubId_year_key" ON "club_funding"("clubId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "club_balance_clubId_year_key" ON "club_balance"("clubId", "year");

-- AddForeignKey
ALTER TABLE "tournament" ADD CONSTRAINT "tournament_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament" ADD CONSTRAINT "tournament_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "rate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_assignment" ADD CONSTRAINT "referee_assignment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_assignment" ADD CONSTRAINT "referee_assignment_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "referee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_funding" ADD CONSTRAINT "club_funding_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_balance" ADD CONSTRAINT "club_balance_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
