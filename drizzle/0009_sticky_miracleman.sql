ALTER TABLE `dojo_settings` ADD `paymentProcessor` enum('stripe','square','clover','none') DEFAULT 'stripe';--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `paymentApiKey` varchar(500);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `paymentMerchantId` varchar(500);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `paymentSetupLater` int DEFAULT 0;