-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);


-- Black Friday 2026: 30% off everything until 11:59 pm IST on Friday 27 November.
-- endsAt is UTC (= 11:59:59 pm IST). Switches itself off then; edit it in Admin → Black Friday.
INSERT INTO "Promotion" ("id", "name", "percentOff", "startsAt", "endsAt", "isActive", "updatedAt")
VALUES ('promo_black_friday_2026', 'Black Friday', 30, NULL, '2026-11-27 18:29:59', true, CURRENT_TIMESTAMP);
