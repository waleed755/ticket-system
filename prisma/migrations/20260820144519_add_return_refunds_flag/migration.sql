-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "venueName" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "mapUrl" TEXT,
    "onlineUrl" TEXT,
    "onlineInstructions" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "capacity" INTEGER NOT NULL,
    "bookingStartAt" DATETIME NOT NULL,
    "bookingEndAt" DATETIME NOT NULL,
    "refundDeadlineHours" INTEGER NOT NULL DEFAULT 48,
    "refundPolicy" TEXT NOT NULL,
    "termsAndConditions" TEXT NOT NULL,
    "ageRestriction" TEXT,
    "entryRequirements" TEXT,
    "dressCode" TEXT,
    "accessibilityInfo" TEXT,
    "organizerName" TEXT NOT NULL,
    "organizerEmail" TEXT NOT NULL,
    "organizerPhone" TEXT,
    "organizerBio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "accessCode" TEXT,
    "confirmationMessage" TEXT,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "returnRefundsToInventory" BOOLEAN NOT NULL DEFAULT true,
    "cancelledAt" DATETIME,
    "cancelledReason" TEXT,
    "postponedAt" DATETIME,
    "originalStartAt" DATETIME,
    "originalEndAt" DATETIME,
    "originalVenueName" TEXT,
    "rescheduleNote" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("accessCode", "accessibilityInfo", "addressLine1", "addressLine2", "ageRestriction", "bookingEndAt", "bookingStartAt", "cancelledAt", "cancelledReason", "capacity", "categoryId", "city", "confirmationMessage", "country", "coverImage", "createdAt", "createdById", "dressCode", "endAt", "entryRequirements", "featured", "format", "fullDescription", "id", "mapUrl", "name", "onlineInstructions", "onlineUrl", "organizerBio", "organizerEmail", "organizerName", "organizerPhone", "originalEndAt", "originalStartAt", "originalVenueName", "postalCode", "postponedAt", "refundDeadlineHours", "refundPolicy", "region", "rescheduleNote", "shortDescription", "slug", "startAt", "status", "termsAndConditions", "timezone", "updatedAt", "venueName", "visibility", "waitlistEnabled") SELECT "accessCode", "accessibilityInfo", "addressLine1", "addressLine2", "ageRestriction", "bookingEndAt", "bookingStartAt", "cancelledAt", "cancelledReason", "capacity", "categoryId", "city", "confirmationMessage", "country", "coverImage", "createdAt", "createdById", "dressCode", "endAt", "entryRequirements", "featured", "format", "fullDescription", "id", "mapUrl", "name", "onlineInstructions", "onlineUrl", "organizerBio", "organizerEmail", "organizerName", "organizerPhone", "originalEndAt", "originalStartAt", "originalVenueName", "postalCode", "postponedAt", "refundDeadlineHours", "refundPolicy", "region", "rescheduleNote", "shortDescription", "slug", "startAt", "status", "termsAndConditions", "timezone", "updatedAt", "venueName", "visibility", "waitlistEnabled" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
