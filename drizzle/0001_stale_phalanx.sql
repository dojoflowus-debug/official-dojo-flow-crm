CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`collection` varchar(100),
	`isPinned` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`stage` enum('new','contacted','appointment_set','trial_scheduled','trial_completed','proposal_sent','negotiation','won','lost') NOT NULL DEFAULT 'new',
	`source` varchar(100),
	`interestedProgram` varchar(100),
	`notes` text,
	`assignedTo` int,
	`lastContactDate` timestamp,
	`nextFollowUpDate` timestamp,
	`locationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`phone` varchar(20),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`attachments` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`dateOfBirth` timestamp,
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`beltRank` enum('white','yellow','orange','green','blue','purple','brown','red','black') NOT NULL DEFAULT 'white',
	`stripes` int NOT NULL DEFAULT 0,
	`program` varchar(100),
	`category` enum('A','B','C') NOT NULL DEFAULT 'B',
	`status` enum('active','inactive','trial','frozen') NOT NULL DEFAULT 'active',
	`membershipType` varchar(100),
	`monthlyRate` int DEFAULT 0,
	`credits` int DEFAULT 0,
	`lastPaymentDate` timestamp,
	`paymentStatus` enum('current','late','overdue') DEFAULT 'current',
	`guardianName` varchar(200),
	`guardianPhone` varchar(20),
	`guardianEmail` varchar(320),
	`guardianRelation` varchar(50),
	`photoUrl` text,
	`notes` text,
	`locationId` int,
	`joinDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
