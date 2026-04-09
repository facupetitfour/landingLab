/*
  Warnings:

  - A unique constraint covering the columns `[clerk_user_id]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clerk_user_id` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "clerk_user_id" TEXT NOT NULL,
ADD COLUMN     "is_subscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mp_subscription_id" TEXT,
ADD COLUMN     "subscription_status" TEXT,
ALTER COLUMN "credits" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "mp_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_mp_id_key" ON "payments"("mp_id");

-- CreateIndex
CREATE INDEX "idx_payments_user_id" ON "payments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_clerk_user_id_key" ON "profiles"("clerk_user_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
