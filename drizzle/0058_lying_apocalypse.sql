ALTER TABLE `kiosk_locations` ADD `kioskSlug` varchar(255);--> statement-breakpoint
ALTER TABLE `kiosk_locations` ADD CONSTRAINT `kiosk_locations_kioskSlug_unique` UNIQUE(`kioskSlug`);