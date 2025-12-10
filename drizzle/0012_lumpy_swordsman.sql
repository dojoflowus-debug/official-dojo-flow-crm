CREATE TABLE `lead_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceKey` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`icon` varchar(100) NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_sources_sourceKey_unique` UNIQUE(`sourceKey`)
);
