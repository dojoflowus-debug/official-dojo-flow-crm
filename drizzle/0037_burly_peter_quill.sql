CREATE TABLE `thread_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`participantType` enum('staff','student','system') NOT NULL,
	`participantId` int,
	`participantName` varchar(255) NOT NULL,
	`role` enum('owner','member','viewer') NOT NULL DEFAULT 'member',
	`addedById` int,
	`addedByName` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`lastReadMessageId` int,
	`lastReadAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `thread_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `kai_conversations` ADD `threadType` enum('kai_direct','group') DEFAULT 'kai_direct' NOT NULL;