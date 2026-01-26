ALTER TABLE `locations` ADD `slug` varchar(100);--> statement-breakpoint
ALTER TABLE `locations` ADD `bookingUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `locations` ADD `timezone` varchar(50) DEFAULT 'America/Chicago';--> statement-breakpoint
ALTER TABLE `locations` ADD `hours` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `enabledPrograms` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `leadRoutingEmail` varchar(255);--> statement-breakpoint
ALTER TABLE `locations` ADD `leadRoutingSms` varchar(255);--> statement-breakpoint
ALTER TABLE `locations` ADD `chatEnabled` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `locations` ADD `chatGreeting` text;--> statement-breakpoint
CREATE INDEX `idx_locations_slug` ON `locations` (`slug`);