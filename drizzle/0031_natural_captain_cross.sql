CREATE TABLE `student_message_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_message_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`senderType` enum('student','staff') NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`subject` varchar(500),
	`content` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`parentMessageId` int,
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_messages_id` PRIMARY KEY(`id`)
);
