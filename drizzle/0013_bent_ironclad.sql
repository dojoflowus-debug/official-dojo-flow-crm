CREATE TABLE `webhook_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`apiKey` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_keys_apiKey_unique` UNIQUE(`apiKey`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `message` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `utmSource` varchar(255);--> statement-breakpoint
ALTER TABLE `leads` ADD `utmMedium` varchar(255);--> statement-breakpoint
ALTER TABLE `leads` ADD `utmCampaign` varchar(255);--> statement-breakpoint
ALTER TABLE `leads` ADD `utmContent` varchar(255);--> statement-breakpoint
ALTER TABLE `leads` ADD `utmTerm` varchar(255);