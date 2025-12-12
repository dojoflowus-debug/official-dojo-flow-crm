CREATE TABLE `class_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classId` int NOT NULL,
	`smsRemindersEnabled` int NOT NULL DEFAULT 1,
	`status` enum('active','paused','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `class_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classId` int NOT NULL,
	`classDate` timestamp NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`twilioMessageId` varchar(100),
	`status` enum('pending','sent','failed','delivered') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`optedIn` int NOT NULL DEFAULT 1,
	`classReminders` int NOT NULL DEFAULT 1,
	`billingReminders` int NOT NULL DEFAULT 1,
	`promotionalMessages` int NOT NULL DEFAULT 0,
	`reminderHoursBefore` int NOT NULL DEFAULT 24,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sms_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `sms_preferences_studentId_unique` UNIQUE(`studentId`)
);
