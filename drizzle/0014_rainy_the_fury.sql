ALTER TABLE `dojo_settings` ADD `twilioAccountSid` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `twilioAuthToken` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `twilioPhoneNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `enableSmsForLeads` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `emailProvider` enum('sendgrid','smtp') DEFAULT 'sendgrid';--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `senderEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `sendgridApiKey` varchar(500);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `smtpHost` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `smtpPort` int;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `smtpUser` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `smtpPassword` varchar(500);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `enableEmailForLeads` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `notifyStaffOnNewLead` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `staffNotificationMethod` enum('sms','email','both') DEFAULT 'both';--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `staffNotificationPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `staffNotificationEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `autoSendSmsToLead` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `autoSendEmailToLead` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `autoUpdatePipelineStage` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `dojo_settings` ADD `bookingLink` varchar(500);