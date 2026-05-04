/*
  Warnings:

  - A unique constraint covering the columns `[userEmailmp]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userEmailmp` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'pending';

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" DROP DEFAULT,
ALTER COLUMN "currency" DROP DEFAULT,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "userEmailmp" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userEmailmp_key" ON "subscriptions"("userEmailmp");
