CREATE TABLE `welcome_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`subMessage` text,
	`ctaText` varchar(100) NOT NULL DEFAULT 'Get Started',
	`ctaUrl` varchar(500),
	`imageUrl` varchar(500),
	`isActive` int NOT NULL DEFAULT 1,
	`showForNewGoogleUsers` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `users` ADD `welcomeMessageSeen` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_welcome_org` ON `welcome_messages` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_welcome_active` ON `welcome_messages` (`isActive`);