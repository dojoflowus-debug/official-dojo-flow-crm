ALTER TABLE `floor_plans` ADD `bagsInstalled` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `floor_plans` ADD `defaultLayout` varchar(50) DEFAULT 'grid' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `bagsOnHand` int DEFAULT 0 NOT NULL;