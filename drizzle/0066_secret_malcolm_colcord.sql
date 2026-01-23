CREATE TABLE `custom_cinematic_backgrounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` varchar(500) NOT NULL,
	`thumbnailUrl` varchar(500),
	`s3Key` varchar(500) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(50) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_custom_bg_org` ON `custom_cinematic_backgrounds` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_custom_bg_user` ON `custom_cinematic_backgrounds` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_custom_bg_active` ON `custom_cinematic_backgrounds` (`isActive`);