CREATE TABLE `automation_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('welcome','trial','engagement','celebration','followup','renewal') NOT NULL,
	`trigger` enum('new_lead','trial_scheduled','trial_completed','trial_no_show','enrollment','missed_class','inactive_student','renewal_due','custom') NOT NULL,
	`triggerConditions` text,
	`steps` text NOT NULL,
	`isSystem` int NOT NULL DEFAULT 1,
	`installCount` int DEFAULT 0,
	`previewImage` varchar(500),
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_templates_id` PRIMARY KEY(`id`)
);
