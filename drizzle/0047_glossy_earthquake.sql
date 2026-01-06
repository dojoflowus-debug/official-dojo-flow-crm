ALTER TABLE `organizations` ADD `onboardingStatus` enum('not_started','in_progress','completed','skipped') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `onboardingStep` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `onboardingChecklist` json DEFAULT (JSON_OBJECT()) NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `onboardingCompletedAt` timestamp;