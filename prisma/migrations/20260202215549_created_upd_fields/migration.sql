/*
  Warnings:

  - Added the required column `updatedAt` to the `club_balance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `club_funding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `rate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `referee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `referee_assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `tournament` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "club_balance" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "club_funding" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "rate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "referee" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "referee_assignment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tournament" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
