/*
  Warnings:

  - You are about to drop the column `providerId` on the `account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider,accountId]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider` to the `account` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "account_providerId_accountId_key";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "providerId",
ADD COLUMN     "provider" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_accountId_key" ON "account"("provider", "accountId");
