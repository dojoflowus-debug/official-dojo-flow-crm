CREATE TABLE `lead_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`type` enum('call','email','sms','note','status_change','meeting','task') NOT NULL,
	`title` varchar(255),
	`content` text,
	`previousStatus` varchar(100),
	`newStatus` varchar(100),
	`callDuration` int,
	`callOutcome` enum('answered','voicemail','no_answer','busy','wrong_number'),
	`isAutomated` int NOT NULL DEFAULT 0,
	`createdById` int,
	`createdByName` varchar(255),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_activities_id` PRIMARY KEY(`id`)
);
