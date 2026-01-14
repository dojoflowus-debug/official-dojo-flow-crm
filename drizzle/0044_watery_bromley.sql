CREATE TABLE `kai_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`type` enum('warning','error','info','success') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text,
	`severity` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`dismissed` int NOT NULL DEFAULT 0,
	`dismissedAt` timestamp,
	`dismissedBy` int,
	`actionUrl` varchar(500),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `kai_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`severity` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`status` enum('open','acknowledged','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`category` enum('system','infrastructure','security','performance','other') NOT NULL DEFAULT 'other',
	`assignedTo` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	`deletedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `kai_operations_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`actionType` enum('create','update','delete','execute','query','other') NOT NULL DEFAULT 'other',
	`details` text,
	`status` enum('success','pending','failed') NOT NULL DEFAULT 'pending',
	`performedBy` int,
	`relatedIncidentId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kai_system_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`systemName` varchar(255) NOT NULL,
	`status` enum('healthy','degraded','offline','unknown') NOT NULL DEFAULT 'unknown',
	`uptime` int,
	`lastCheckedAt` timestamp,
	`responseTime` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_kai_alerts_org` ON `kai_alerts` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_kai_alerts_dismissed` ON `kai_alerts` (`dismissed`);--> statement-breakpoint
CREATE INDEX `idx_kai_alerts_severity` ON `kai_alerts` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_kai_alerts_created` ON `kai_alerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_kai_incidents_org` ON `kai_incidents` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_kai_incidents_status` ON `kai_incidents` (`status`);--> statement-breakpoint
CREATE INDEX `idx_kai_incidents_severity` ON `kai_incidents` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_kai_incidents_created` ON `kai_incidents` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_kai_operations_org` ON `kai_operations_log` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_kai_operations_type` ON `kai_operations_log` (`actionType`);--> statement-breakpoint
CREATE INDEX `idx_kai_operations_status` ON `kai_operations_log` (`status`);--> statement-breakpoint
CREATE INDEX `idx_kai_operations_created` ON `kai_operations_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_kai_system_org` ON `kai_system_status` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_kai_system_status` ON `kai_system_status` (`status`);--> statement-breakpoint
CREATE INDEX `idx_kai_system_checked` ON `kai_system_status` (`lastCheckedAt`);