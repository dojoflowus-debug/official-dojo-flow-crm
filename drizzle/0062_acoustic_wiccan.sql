ALTER TABLE `users` ADD `googleSub` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` enum('password','google') DEFAULT 'password' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_users_googleSub` ON `users` (`googleSub`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);