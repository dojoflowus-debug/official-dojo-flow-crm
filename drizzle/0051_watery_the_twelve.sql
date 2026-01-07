CREATE TABLE `preset_backgrounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL DEFAULT 'neutral',
	`imageUrl` varchar(500) NOT NULL,
	`thumbnailUrl` varchar(500),
	`blurDefault` int NOT NULL DEFAULT 0,
	`dimDefault` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `preset_backgrounds_id` PRIMARY KEY(`id`),
	CONSTRAINT `preset_backgrounds_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE INDEX `idx_category` ON `preset_backgrounds` (`category`);--> statement-breakpoint
CREATE INDEX `idx_active` ON `preset_backgrounds` (`isActive`);