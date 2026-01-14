CREATE TABLE `student_cancellation_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`requestDate` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`cancellationDate` timestamp,
	`reason` text,
	`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
	`notes` text,
	`processedBy` varchar(255),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `student_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`contactDate` timestamp NOT NULL,
	`contactType` enum('call','sms','email','in_person','message') NOT NULL,
	`notes` text,
	`contactedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `student_segment_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`segmentId` int NOT NULL,
	`studentId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `student_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`criteria` text,
	`studentCount` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `student_tuition` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`amount` int NOT NULL,
	`dueDate` timestamp NOT NULL,
	`paidDate` timestamp,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_cancellation_student` ON `student_cancellation_requests` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_cancellation_status` ON `student_cancellation_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_cancellation_date` ON `student_cancellation_requests` (`requestDate`);--> statement-breakpoint
CREATE INDEX `idx_contact_student` ON `student_contacts` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_contact_date` ON `student_contacts` (`contactDate`);--> statement-breakpoint
CREATE INDEX `idx_member_segment` ON `student_segment_members` (`segmentId`);--> statement-breakpoint
CREATE INDEX `idx_member_student` ON `student_segment_members` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_segment_org` ON `student_segments` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_segment_active` ON `student_segments` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_tuition_student` ON `student_tuition` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_tuition_status` ON `student_tuition` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tuition_due_date` ON `student_tuition` (`dueDate`);