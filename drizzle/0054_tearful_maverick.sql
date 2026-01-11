CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`actorName` varchar(255),
	`eventType` enum('DELETE_REQUESTED','DELETE_APPROVED','DELETE_DENIED','DELETE_EXECUTED','DELETE_ANONYMIZED') NOT NULL,
	`studentId` int,
	`studentName` varchar(255),
	`deletionRequestId` int,
	`description` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `student_deletion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`studentId` int NOT NULL,
	`requestedByUserId` int NOT NULL,
	`approvedByUserId` int,
	`status` enum('pending','approved','denied','executed','expired') NOT NULL DEFAULT 'pending',
	`reason` text NOT NULL,
	`isPayingMemberAtRequestTime` int NOT NULL DEFAULT 0,
	`billingDecision` enum('cancel_subscription','keep_active','abort'),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `students` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `deletedByUserId` int;--> statement-breakpoint
ALTER TABLE `students` ADD `deletionRequestId` int;--> statement-breakpoint
CREATE INDEX `idx_org_event` ON `audit_logs` (`orgId`,`eventType`);--> statement-breakpoint
CREATE INDEX `idx_student` ON `audit_logs` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_org_student` ON `student_deletion_requests` (`orgId`,`studentId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `student_deletion_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `student_deletion_requests` (`createdAt`);