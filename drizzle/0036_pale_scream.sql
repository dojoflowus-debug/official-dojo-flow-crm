CREATE TABLE `student_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`content` text NOT NULL,
	`noteType` enum('manual','extraction','action_item','follow_up') NOT NULL DEFAULT 'manual',
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`createdById` int,
	`createdByName` varchar(255),
	`sourceConversationId` int,
	`isCompleted` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_notes_id` PRIMARY KEY(`id`)
);
