ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','owner','staff') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `provider` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `providerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `openId`;