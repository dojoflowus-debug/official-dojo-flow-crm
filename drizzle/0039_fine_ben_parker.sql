ALTER TABLE `users` ADD `displayName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `preferredName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` varchar(160);--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrlSmall` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `staffId` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `locationIds` text;