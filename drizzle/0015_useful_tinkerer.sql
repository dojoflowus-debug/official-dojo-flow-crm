CREATE TABLE `automation_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`enrolledType` enum('lead','student') NOT NULL,
	`enrolledId` int NOT NULL,
	`currentStepId` int,
	`status` enum('active','paused','completed','cancelled') NOT NULL DEFAULT 'active',
	`nextExecutionAt` timestamp,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`trigger` enum('new_lead','trial_scheduled','trial_completed','trial_no_show','enrollment','missed_class','inactive_student','renewal_due','custom') NOT NULL,
	`triggerConditions` text,
	`isActive` int NOT NULL DEFAULT 1,
	`enrollmentCount` int DEFAULT 0,
	`completedCount` int DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`stepType` enum('wait','send_sms','send_email','condition','end') NOT NULL,
	`waitMinutes` int,
	`subject` varchar(500),
	`message` text,
	`condition` text,
	`nextStepIdTrue` int,
	`nextStepIdFalse` int,
	`name` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaign_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`recipientType` enum('lead','student') NOT NULL,
	`recipientId` int NOT NULL,
	`recipientName` varchar(255) NOT NULL,
	`recipientContact` varchar(320) NOT NULL,
	`status` enum('pending','sent','delivered','failed','bounced','opened','clicked') NOT NULL DEFAULT 'pending',
	`externalMessageId` varchar(255),
	`errorMessage` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('sms','email') NOT NULL,
	`status` enum('draft','scheduled','sending','sent','cancelled') NOT NULL DEFAULT 'draft',
	`subject` varchar(500),
	`message` text NOT NULL,
	`audienceFilter` text,
	`recipientCount` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`deliveredCount` int DEFAULT 0,
	`failedCount` int DEFAULT 0,
	`openedCount` int DEFAULT 0,
	`clickedCount` int DEFAULT 0,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`completedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantType` enum('lead','student') NOT NULL,
	`participantId` int NOT NULL,
	`participantName` varchar(255) NOT NULL,
	`participantPhone` varchar(20) NOT NULL,
	`status` enum('open','closed','archived') NOT NULL DEFAULT 'open',
	`assignedTo` int,
	`lastMessagePreview` text,
	`lastMessageAt` timestamp,
	`unreadCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('greeting','follow_up','reminder','confirmation','general') NOT NULL,
	`type` enum('sms','email') NOT NULL,
	`subject` varchar(500),
	`content` text NOT NULL,
	`isSystem` int NOT NULL DEFAULT 0,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`content` text NOT NULL,
	`senderType` enum('system','staff','automation','customer'),
	`senderId` int,
	`status` enum('pending','sent','delivered','failed','read') NOT NULL DEFAULT 'pending',
	`externalMessageId` varchar(255),
	`errorMessage` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
