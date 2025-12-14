CREATE TABLE `directed_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientType` enum('student','staff','group') NOT NULL,
	`recipientId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`subject` varchar(500),
	`sourceConversationId` int,
	`sourceMessageId` int,
	`kaiMentioned` int NOT NULL DEFAULT 0,
	`isRead` int NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`label` varchar(100) DEFAULT 'message',
	`attachments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `directed_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`senderType` enum('staff','student','system') NOT NULL,
	`senderId` int,
	`senderName` varchar(255) NOT NULL,
	`subject` varchar(500),
	`content` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`parentMessageId` int,
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`readAt` timestamp,
	`attachments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_messages_id` PRIMARY KEY(`id`)
);
