/*
  Warnings:

  - A unique constraint covering the columns `[clubId]` on the table `club_balance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "club_balance_clubId_key" ON "club_balance"("clubId");
