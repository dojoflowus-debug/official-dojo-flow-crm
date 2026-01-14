CREATE TABLE `kiosk_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`themeId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`assignedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`themeId` int NOT NULL,
	`deploymentStatus` enum('pending','in_progress','deployed','failed','rolled_back') NOT NULL DEFAULT 'pending',
	`deployedAt` timestamp,
	`deployedBy` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_deployments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`deviceName` varchar(255) NOT NULL,
	`location` varchar(255) NOT NULL,
	`deviceType` enum('physical','virtual','web') NOT NULL DEFAULT 'physical',
	`status` enum('active','inactive','maintenance','offline') NOT NULL DEFAULT 'offline',
	`lastSyncAt` timestamp,
	`onlineStatus` int NOT NULL DEFAULT 0,
	`ipAddress` varchar(50),
	`deviceId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `kiosk_devices_deviceId_unique` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`themeId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isRecurring` int NOT NULL DEFAULT 0,
	`cronExpression` varchar(255),
	`autoRevert` int NOT NULL DEFAULT 1,
	`revertThemeId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_theme_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`themeId` int NOT NULL,
	`assetType` enum('logo','background_image','background_video','overlay_graphic','color_primary','color_accent','button_style','welcome_text','idle_message','holiday_message','theme_mode','other') NOT NULL,
	`assetKey` varchar(255) NOT NULL,
	`assetValue` text NOT NULL,
	`assetUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_theme_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_themes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isActive` int NOT NULL DEFAULT 0,
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_themes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_device_assignments` ON `kiosk_assignments` (`deviceId`);--> statement-breakpoint
CREATE INDEX `idx_theme_assignments` ON `kiosk_assignments` (`themeId`);--> statement-breakpoint
CREATE INDEX `idx_deployment_device` ON `kiosk_deployments` (`deviceId`);--> statement-breakpoint
CREATE INDEX `idx_deployment_theme` ON `kiosk_deployments` (`themeId`);--> statement-breakpoint
CREATE INDEX `idx_deployment_status` ON `kiosk_deployments` (`deploymentStatus`);--> statement-breakpoint
CREATE INDEX `idx_org_devices` ON `kiosk_devices` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_device_status` ON `kiosk_devices` (`status`);--> statement-breakpoint
CREATE INDEX `idx_schedule_theme` ON `kiosk_schedules` (`themeId`);--> statement-breakpoint
CREATE INDEX `idx_schedule_dates` ON `kiosk_schedules` (`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `idx_schedule_active` ON `kiosk_schedules` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_theme_assets` ON `kiosk_theme_assets` (`themeId`);--> statement-breakpoint
CREATE INDEX `idx_asset_type` ON `kiosk_theme_assets` (`assetType`);--> statement-breakpoint
CREATE INDEX `idx_org_themes` ON `kiosk_themes` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_theme_active` ON `kiosk_themes` (`isActive`);