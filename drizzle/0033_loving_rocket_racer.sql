CREATE TABLE `program_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`programId` int NOT NULL,
	`status` enum('pending_waiver','pending_payment','pending_approval','trial','active','expired','cancelled') NOT NULL DEFAULT 'pending_waiver',
	`enrollmentType` enum('paid','free_trial','prorated_trial','instructor_approval') NOT NULL DEFAULT 'paid',
	`trialStartDate` timestamp,
	`trialEndDate` timestamp,
	`trialLengthDays` int,
	`amountPaid` int DEFAULT 0,
	`stripeSubscriptionId` varchar(255),
	`signedWaiverId` int,
	`approvedBy` int,
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `program_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signed_waivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`waiverTemplateId` int NOT NULL,
	`programId` int,
	`signerType` enum('student','guardian') NOT NULL,
	`signerName` varchar(255) NOT NULL,
	`signerEmail` varchar(320),
	`signatureData` text NOT NULL,
	`pdfUrl` varchar(500),
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signed_waivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`documentType` enum('waiver','receipt','certificate','medical','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`isImmutable` int NOT NULL DEFAULT 0,
	`relatedType` varchar(50),
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waiver_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waiver_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `programs` ADD `waiverRequired` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `paymentRequired` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `approvalRequired` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `trialType` enum('none','free','prorated') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `programs` ADD `trialLengthDays` int DEFAULT 7;--> statement-breakpoint
ALTER TABLE `programs` ADD `trialPrice` int DEFAULT 0;