CREATE TABLE `kiosk_design_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`createdByUserId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`config` text NOT NULL,
	`thumbnailUrl` varchar(500),
	`isPublic` tinyint NOT NULL DEFAULT 0,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_design_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_templates_org` ON `kiosk_design_templates` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_templates_user` ON `kiosk_design_templates` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `idx_templates_public` ON `kiosk_design_templates` (`isPublic`);