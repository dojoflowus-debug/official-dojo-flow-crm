CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`time` varchar(50) NOT NULL,
	`enrolled` int NOT NULL DEFAULT 0,
	`capacity` int NOT NULL DEFAULT 20,
	`instructor` varchar(255),
	`dayOfWeek` varchar(20),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int,
	`studentName` varchar(255) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kiosk_check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_visitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kiosk_visitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_waivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`signed` int NOT NULL DEFAULT 1,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kiosk_waivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`status` enum('New','Contacted','Interested','Not Interested','Converted') NOT NULL DEFAULT 'New',
	`source` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`age` int,
	`beltRank` varchar(100),
	`status` enum('Active','Inactive','On Hold') NOT NULL DEFAULT 'Active',
	`membershipStatus` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
