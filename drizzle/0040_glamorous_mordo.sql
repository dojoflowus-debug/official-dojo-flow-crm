CREATE TABLE `kiosk_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int NOT NULL DEFAULT 1,
	`activeThemeId` int,
	`customConfig` json,
	`welcomeHeadline` varchar(50),
	`welcomeSubtext` varchar(100),
	`accentColor` varchar(7),
	`logoLight` varchar(500),
	`logoDark` varchar(500),
	`backgroundBlur` int DEFAULT 5,
	`backgroundOpacity` int DEFAULT 80,
	`scheduledThemeStartDate` timestamp,
	`scheduledThemeEndDate` timestamp,
	`revertToThemeId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_theme_presets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('preset','custom','holiday','event') NOT NULL DEFAULT 'preset',
	`description` text,
	`config` json NOT NULL,
	`previewUrl` varchar(500),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_theme_presets_id` PRIMARY KEY(`id`)
);
