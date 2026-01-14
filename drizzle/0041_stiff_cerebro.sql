CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('kai','form','staff') NOT NULL DEFAULT 'form',
	`status` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`dateOfBirth` timestamp,
	`age` int,
	`phone` varchar(20),
	`email` varchar(320),
	`streetAddress` varchar(255),
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`guardianName` varchar(255),
	`guardianRelationship` varchar(50),
	`guardianPhone` varchar(20),
	`guardianEmail` varchar(320),
	`programInterest` varchar(100),
	`experienceLevel` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`classType` varchar(100),
	`goals` text,
	`motivation` text,
	`allergies` text,
	`medicalConditions` text,
	`emergencyContactName` varchar(255),
	`emergencyContactPhone` varchar(20),
	`selectedMembershipPlan` varchar(100),
	`pricingNotes` text,
	`waiverSigned` int NOT NULL DEFAULT 0,
	`waiverSignature` text,
	`waiverSignedAt` timestamp,
	`consentGiven` int NOT NULL DEFAULT 0,
	`conversationId` int,
	`conversationTranscript` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskTheme` varchar(50) DEFAULT 'default';--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskAccentColor` varchar(7);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskLogoLight` varchar(500);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskLogoDark` varchar(500);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskWelcomeHeadline` varchar(50);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskWelcomeSubtext` varchar(100);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskBackgroundBlur` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskBackgroundOpacity` int DEFAULT 80;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskScheduledThemeStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskScheduledThemeEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `kioskRevertToTheme` varchar(50);