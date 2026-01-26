CREATE TABLE `webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookId` int NOT NULL,
	`organizationId` int NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`leadId` int,
	`payload` text NOT NULL,
	`statusCode` int,
	`responseBody` text,
	`errorMessage` text,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`nextRetryAt` timestamp,
	`deliveredAt` timestamp,
	`deliveryStatus` enum('success','failed','pending','retrying') NOT NULL DEFAULT 'pending',
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`events` varchar(255) NOT NULL DEFAULT 'lead.captured',
	`isActive` int NOT NULL DEFAULT 1,
	`secret` varchar(255) NOT NULL,
	`headers` text,
	`retryAttempts` int NOT NULL DEFAULT 3,
	`retryDelaySeconds` int NOT NULL DEFAULT 300,
	`maxTimeout` int NOT NULL DEFAULT 30,
	`lastDeliveryAt` timestamp,
	`lastDeliveryStatus` enum('success','failed','pending') DEFAULT 'pending',
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_webhook_log_webhook` ON `webhook_logs` (`webhookId`);--> statement-breakpoint
CREATE INDEX `idx_webhook_log_org` ON `webhook_logs` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_webhook_log_lead` ON `webhook_logs` (`leadId`);--> statement-breakpoint
CREATE INDEX `idx_webhook_log_status` ON `webhook_logs` (`deliveryStatus`);--> statement-breakpoint
CREATE INDEX `idx_webhook_log_created` ON `webhook_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_webhook_log_retry` ON `webhook_logs` (`nextRetryAt`);--> statement-breakpoint
CREATE INDEX `idx_webhook_org` ON `webhooks` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_webhook_active` ON `webhooks` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_webhook_org_active` ON `webhooks` (`organizationId`,`isActive`);