ALTER TABLE `kiosk_locations` ADD `kioskAppearanceDraft` text;--> statement-breakpoint
ALTER TABLE `kiosk_locations` ADD `kioskAppearancePublished` text;--> statement-breakpoint
ALTER TABLE `kiosk_locations` ADD `kioskAppearanceVersion` int DEFAULT 1 NOT NULL;