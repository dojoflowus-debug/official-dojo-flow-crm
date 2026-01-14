CREATE TABLE `lead_scoring_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`points` int NOT NULL,
	`description` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_scoring_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_scoring_rules_activityType_unique` UNIQUE(`activityType`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `leadScore` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `leadScoreUpdatedAt` timestamp DEFAULT (now());