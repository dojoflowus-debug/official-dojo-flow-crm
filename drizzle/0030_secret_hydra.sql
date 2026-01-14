ALTER TABLE `belt_test_registrations` ADD `stripeSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `belt_test_registrations` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `belt_test_registrations` ADD `amountPaid` int;