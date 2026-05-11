/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `role` ADD COLUMN `key` VARCHAR(64) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `role_name_key` ON `role`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `role_key_key` ON `role`(`key`);
