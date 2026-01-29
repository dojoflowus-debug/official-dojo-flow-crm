CREATE TABLE `school_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`displayName` varchar(255),
	`tagline` varchar(500),
	`phone` varchar(50),
	`email` varchar(255),
	`website` varchar(500),
	`addressStreet` varchar(255),
	`addressCity` varchar(100),
	`addressState` varchar(100),
	`addressPostal` varchar(20),
	`addressCountry` varchar(100),
	`logoLightUrl` varchar(1000),
	`logoDarkUrl` varchar(1000),
	`timezone` varchar(100),
	`currency` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `school_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `school_profiles_organizationId_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
CREATE INDEX `idx_school_profile_org` ON `school_profiles` (`organizationId`);