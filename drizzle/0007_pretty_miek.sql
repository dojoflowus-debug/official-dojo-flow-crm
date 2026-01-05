CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(500),
	`insideFacility` int DEFAULT 0,
	`facilityName` varchar(255),
	`operatingHours` text,
	`timeBlocks` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_journey_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadGreeting` text,
	`contactPreference` enum('sms','email','both') DEFAULT 'both',
	`responseSpeedMinutes` int DEFAULT 15,
	`trialOffer` varchar(255),
	`trialType` enum('free_class','paid_intro','free_week','assessment'),
	`trialFollowUp` text,
	`welcomeTone` enum('shorter','detailed') DEFAULT 'detailed',
	`miss1ClassAction` varchar(255),
	`miss2WeeksAction` varchar(255),
	`absenceAlertThreshold` int DEFAULT 3,
	`renewalReminderWeeks` int DEFAULT 2,
	`autoBookingPrompts` int DEFAULT 0,
	`encouragementMessages` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `member_journey_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('membership','class_pack','drop_in','private') NOT NULL,
	`ageRange` varchar(100),
	`billing` enum('monthly','weekly','per_session','one_time'),
	`price` int,
	`contractLength` varchar(50),
	`maxSize` int DEFAULT 20,
	`isCoreProgram` int DEFAULT 0,
	`showOnKiosk` int DEFAULT 1,
	`allowAutopilot` int DEFAULT 0,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('owner','manager','instructor','front_desk','coach','trainer','assistant') NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`locationIds` text,
	`addressAs` varchar(255),
	`focusAreas` text,
	`canViewFinancials` int DEFAULT 0,
	`canEditSchedule` int DEFAULT 0,
	`canManageLeads` int DEFAULT 0,
	`viewOnly` int DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `industry` enum('martial_arts','fitness','yoga','pilates','other');--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `businessModel` enum('inside_gym','standalone','mobile','online_hybrid');--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `usePreset` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `businessName` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `dbaName` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `operatorName` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `preferredName` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `pronounsTone` enum('formal','casual','energetic','calm');--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `primaryColor` varchar(20);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `secondaryColor` varchar(20);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `logoSquare` varchar(500);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `logoHorizontal` varchar(500);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `monthlyRent` int;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `monthlyUtilities` int;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `monthlyPayroll` int;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `monthlyMarketing` int;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `currentMembers` int;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `revenueGoal` int;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `maxClassSize` int DEFAULT 20;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `nonNegotiables` text;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `focusSlider` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `riskComfort` int DEFAULT 50;