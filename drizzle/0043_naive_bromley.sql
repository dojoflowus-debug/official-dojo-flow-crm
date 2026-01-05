CREATE TABLE `setup_conflicts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`importId` int,
	`conflictType` enum('overlapping_class','duplicate_name','invalid_data','belt_rank_mismatch','capacity_invalid') NOT NULL,
	`details` text NOT NULL,
	`affectedIds` text,
	`resolvedAt` timestamp,
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `setup_import_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importId` int NOT NULL,
	`columnName` varchar(255) NOT NULL,
	`targetField` varchar(255) NOT NULL,
	`dataType` enum('text','number','date','enum','boolean') NOT NULL DEFAULT 'text',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `setup_import_rows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importId` int NOT NULL,
	`rowNumber` int NOT NULL,
	`rowData` text NOT NULL,
	`status` enum('pending','processed','failed','skipped') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdEntityId` int,
	`createdEntityType` enum('program','class','pricing_plan','staff','location'),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `setup_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`importType` enum('programs','classes','pricing','staff','locations') NOT NULL,
	`status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`totalRows` int NOT NULL DEFAULT 0,
	`processedRows` int NOT NULL DEFAULT 0,
	`filename` varchar(500) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`metadata` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `setup_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`stepsCompleted` text,
	`snoozeUntil` timestamp,
	`isCompleted` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_org_conflict` ON `setup_conflicts` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_conflict_type` ON `setup_conflicts` (`conflictType`);--> statement-breakpoint
CREATE INDEX `idx_mapping_import` ON `setup_import_mappings` (`importId`);--> statement-breakpoint
CREATE INDEX `idx_import_row` ON `setup_import_rows` (`importId`);--> statement-breakpoint
CREATE INDEX `idx_org_import` ON `setup_imports` (`organizationId`,`importType`);--> statement-breakpoint
CREATE INDEX `idx_import_status` ON `setup_imports` (`status`);--> statement-breakpoint
CREATE INDEX `idx_org_progress` ON `setup_progress` (`organizationId`);