CREATE TABLE `billing_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`recurringEnabled` int NOT NULL DEFAULT 0,
	`billingCadence` enum('monthly','weekly','custom') DEFAULT 'monthly',
	`customBillingDay` int,
	`retryAttempts` int NOT NULL DEFAULT 3,
	`retryIntervalDays` int NOT NULL DEFAULT 3,
	`autoEmailReceipts` int NOT NULL DEFAULT 1,
	`sendFailedPaymentNotices` int NOT NULL DEFAULT 1,
	`posTrackingEnabled` int NOT NULL DEFAULT 0,
	`posMode` enum('standalone_terminal','integrated_checkout'),
	`dailySettlementSyncTime` varchar(5),
	`paymentMatchingMethod` enum('invoice_number','student_name','amount_date') DEFAULT 'invoice_number',
	`chargeApiEnabled` int NOT NULL DEFAULT 0,
	`refundApiEnabled` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `payment_provider_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`provider` enum('FLUIDPAY','STRIPE') NOT NULL,
	`environment` enum('SANDBOX','PRODUCTION') NOT NULL DEFAULT 'SANDBOX',
	`publicKeyLast4` varchar(4) NOT NULL,
	`secretKeyEncrypted` text NOT NULL,
	`merchantId` varchar(255),
	`terminalId` varchar(255),
	`status` enum('connected','disconnected') NOT NULL DEFAULT 'disconnected',
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `payment_webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`payloadHash` varchar(64) NOT NULL,
	`payload` text NOT NULL,
	`linkedInvoiceId` int,
	`linkedStudentId` int,
	`status` enum('received','processed','failed') NOT NULL DEFAULT 'received',
	`processedAt` timestamp,
	`errorMessage` text,
	`receivedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE INDEX `idx_billing_settings_org` ON `billing_settings` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_payment_provider_org` ON `payment_provider_connections` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_payment_provider_status` ON `payment_provider_connections` (`status`);--> statement-breakpoint
CREATE INDEX `idx_payment_webhook_org` ON `payment_webhook_events` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_payment_webhook_event_type` ON `payment_webhook_events` (`eventType`);--> statement-breakpoint
CREATE INDEX `idx_payment_webhook_status` ON `payment_webhook_events` (`status`);--> statement-breakpoint
CREATE INDEX `idx_payment_webhook_received` ON `payment_webhook_events` (`receivedAt`);