-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_VERIFICATION_PENDING';

-- AlterEnum
ALTER TYPE "EmailCategory" ADD VALUE 'PAYMENT_VERIFICATION_PENDING';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'AWAITING_VERIFICATION';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "proofImageUrl" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
