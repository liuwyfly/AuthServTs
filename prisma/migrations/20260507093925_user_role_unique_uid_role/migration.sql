/*
  Warnings:

  - A unique constraint covering the columns `[uid,role_id]` on the table `user_role` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `user_role_uid_idx` ON `user_role`;

-- CreateIndex
CREATE UNIQUE INDEX `user_role_uid_role_id_key` ON `user_role`(`uid`, `role_id`);
