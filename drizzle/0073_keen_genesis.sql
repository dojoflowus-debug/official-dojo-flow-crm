ALTER TABLE `billing_settings` ADD `dualPricingEnabled` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `billing_settings` ADD `dualPricingPosEnabled` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `billing_settings` ADD `dualPricingSubscriptionsEnabled` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `billing_settings` ADD `cashDiscountPercent` decimal(5,2) DEFAULT '3.99' NOT NULL;--> statement-breakpoint
ALTER TABLE `billing_settings` ADD `receiptDisclosureText` text;--> statement-breakpoint
ALTER TABLE `billing_settings` ADD `complianceAcknowledged` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `billing_settings` ADD `complianceAcknowledgedAt` timestamp;