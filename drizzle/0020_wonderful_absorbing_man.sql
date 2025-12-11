CREATE TABLE `kai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL DEFAULT 'New Conversation',
	`preview` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`category` enum('kai','growth','billing','operations','general') NOT NULL DEFAULT 'kai',
	`priority` enum('neutral','attention','urgent') NOT NULL DEFAULT 'neutral',
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kai_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kai_messages_id` PRIMARY KEY(`id`)
);
