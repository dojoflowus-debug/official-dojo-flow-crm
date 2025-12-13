CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderType` varchar(20) NOT NULL,
	`senderRole` varchar(50),
	`body` text NOT NULL,
	`mentions` text NOT NULL DEFAULT ('[]'),
	`readBy` text NOT NULL DEFAULT ('[]'),
	`triggeredKai` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contextType` varchar(50) NOT NULL DEFAULT 'general',
	`contextId` int,
	`participants` text NOT NULL DEFAULT ('[]'),
	`subject` varchar(255),
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`noteType` varchar(20) NOT NULL DEFAULT 'note',
	`createdBy` int,
	`createdByName` varchar(255),
	`content` text,
	`threadId` int,
	`messageId` int,
	`isPinned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unread_message_counts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userType` varchar(20) NOT NULL,
	`threadId` int NOT NULL,
	`unreadCount` int NOT NULL DEFAULT 0,
	`lastReadMessageId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unread_message_counts_id` PRIMARY KEY(`id`)
);
