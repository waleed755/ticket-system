-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingNumber" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "customerId" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "reservationExpiresAt" DATETIME,
    "subtotal" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "feeAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "discountCodeId" TEXT,
    "termsAcceptedAt" DATETIME,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "cancelledReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("bookingNumber", "buyerEmail", "buyerName", "buyerPhone", "cancelledAt", "cancelledReason", "createdAt", "currency", "customerId", "discountAmount", "discountCodeId", "eventId", "feeAmount", "id", "isManual", "reservationExpiresAt", "status", "subtotal", "taxAmount", "termsAcceptedAt", "totalAmount", "updatedAt") SELECT "bookingNumber", "buyerEmail", "buyerName", "buyerPhone", "cancelledAt", "cancelledReason", "createdAt", "currency", "customerId", "discountAmount", "discountCodeId", "eventId", "feeAmount", "id", "isManual", "reservationExpiresAt", "status", "subtotal", "taxAmount", "termsAcceptedAt", "totalAmount", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_buyerEmail_idx" ON "Booking"("buyerEmail");
CREATE INDEX "Booking_eventId_idx" ON "Booking"("eventId");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL DEFAULT 'test_card',
    "reference" TEXT NOT NULL,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "failureReason" TEXT,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "succeededAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "attemptedAt", "bookingId", "cardBrand", "cardLast4", "createdAt", "currency", "failureReason", "id", "method", "reference", "status", "succeededAt", "updatedAt") SELECT "amount", "attemptedAt", "bookingId", "cardBrand", "cardLast4", "createdAt", "currency", "failureReason", "id", "method", "reference", "status", "succeededAt", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE TABLE "new_TicketCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "totalQuantity" INTEGER NOT NULL,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "minPerOrder" INTEGER NOT NULL DEFAULT 1,
    "maxPerOrder" INTEGER NOT NULL DEFAULT 10,
    "saleStartAt" DATETIME,
    "saleEndAt" DATETIME,
    "benefits" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "refundEligible" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TicketCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TicketCategory" ("benefits", "createdAt", "currency", "description", "eventId", "id", "maxPerOrder", "minPerOrder", "name", "position", "price", "quantitySold", "refundEligible", "saleEndAt", "saleStartAt", "status", "totalQuantity", "updatedAt", "visible") SELECT "benefits", "createdAt", "currency", "description", "eventId", "id", "maxPerOrder", "minPerOrder", "name", "position", "price", "quantitySold", "refundEligible", "saleEndAt", "saleStartAt", "status", "totalQuantity", "updatedAt", "visible" FROM "TicketCategory";
DROP TABLE "TicketCategory";
ALTER TABLE "new_TicketCategory" RENAME TO "TicketCategory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
