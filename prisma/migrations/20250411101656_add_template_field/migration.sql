/*
  Warnings:

  - You are about to drop the `user_subscriptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "template" TEXT NOT NULL DEFAULT 'classic';

-- DropTable
DROP TABLE "user_subscriptions";
