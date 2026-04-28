/*
  Warnings:

  - You are about to drop the column `credits` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `is_subscribed` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `mp_subscription_id` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_status` on the `profiles` table. All the data in the column will be lost.
  - Changed the type of `role` on the `chat_messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `created_at` on table `chat_messages` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `amount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Made the column `created_at` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `project_outputs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `skeletons` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('authorized', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "CreditReason" AS ENUM ('monthly_grant', 'ai_usage', 'bonus');

-- AlterTable
ALTER TABLE "chat_messages" ALTER COLUMN "role" TYPE "ChatRole" USING "role"::text::"ChatRole",
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ARS',
ADD COLUMN     "raw_data" JSONB,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'subscription',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "project_outputs" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "skeletons" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mp_subscription_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "CreditReason" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- Migrate existing credits to CreditLedger
INSERT INTO "credit_ledger" ("id", "user_id", "amount", "reason", "created_at")
SELECT gen_random_uuid()::text, "id", "credits", 'monthly_grant', NOW()
FROM "profiles" WHERE "credits" > 0;

-- Migrate subscription data to Subscription table
INSERT INTO "subscriptions" ("id", "user_id", "mp_subscription_id", "status", "current_period_start", "current_period_end", "created_at")
SELECT gen_random_uuid()::text, "id", "mp_subscription_id", "subscription_status"::text::"SubscriptionStatus", NOW(), NOW() + INTERVAL '1 month', NOW()
FROM "profiles" WHERE "mp_subscription_id" IS NOT NULL;

-- Drop deprecated columns
ALTER TABLE "profiles" DROP COLUMN "credits",
DROP COLUMN "is_subscribed",
DROP COLUMN "mp_subscription_id",
DROP COLUMN "subscription_status";

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_mp_subscription_id_key" ON "subscriptions"("mp_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "credit_ledger_user_id_idx" ON "credit_ledger"("user_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_chat_messages_project_id" RENAME TO "chat_messages_project_id_idx";

-- RenameIndex
ALTER INDEX "idx_payments_user_id" RENAME TO "payments_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_project_outputs_project_id" RENAME TO "project_outputs_project_id_idx";

-- RenameIndex
ALTER INDEX "idx_projects_user_id" RENAME TO "projects_user_id_idx";
