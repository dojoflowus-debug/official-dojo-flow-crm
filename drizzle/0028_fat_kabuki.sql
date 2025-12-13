CREATE TABLE `belt_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`currentBelt` varchar(50) NOT NULL DEFAULT 'White',
	`nextBelt` varchar(50) NOT NULL DEFAULT 'Yellow',
	`progressPercent` int NOT NULL DEFAULT 0,
	`qualifiedClasses` int NOT NULL DEFAULT 0,
	`classesRequired` int NOT NULL DEFAULT 20,
	`qualifiedAttendance` int NOT NULL DEFAULT 0,
	`attendanceRequired` int NOT NULL DEFAULT 80,
	`nextEvaluationDate` timestamp,
	`isEligible` int NOT NULL DEFAULT 0,
	`instructorNotes` text,
	`lastPromotionDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `belt_progress_studentId_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
CREATE TABLE `student_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_accounts_studentId_unique` UNIQUE(`studentId`),
	CONSTRAINT `student_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `student_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classId` int,
	`className` varchar(255),
	`instructorName` varchar(255),
	`classDate` timestamp NOT NULL,
	`status` enum('attended','missed','excused','upcoming') NOT NULL DEFAULT 'upcoming',
	`isQualified` int NOT NULL DEFAULT 1,
	`checkedInAt` timestamp,
	`location` varchar(255),
	`beltRequirement` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_attendance_id` PRIMARY KEY(`id`)
);
