-- CreateTable
CREATE TABLE "fee_payment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "method" TEXT NOT NULL DEFAULT 'cash',
    "methodDetail" TEXT,
    "halfFee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_payment_feeId_idx" ON "fee_payment"("feeId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payment_memberId_feeId_key" ON "fee_payment"("memberId", "feeId");

-- AddForeignKey
ALTER TABLE "fee_payment" ADD CONSTRAINT "fee_payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payment" ADD CONSTRAINT "fee_payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
