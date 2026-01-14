DROP TABLE `account_flags`;--> statement-breakpoint
DROP TABLE `add_ons`;--> statement-breakpoint
DROP TABLE `ai_credit_balance`;--> statement-breakpoint
DROP TABLE `ai_credit_transactions`;--> statement-breakpoint
DROP TABLE `alert_settings`;--> statement-breakpoint
DROP TABLE `attendance`;--> statement-breakpoint
DROP TABLE `audit_logs`;--> statement-breakpoint
DROP TABLE `automation_enrollments`;--> statement-breakpoint
DROP TABLE `automation_sequences`;--> statement-breakpoint
DROP TABLE `automation_step_executions`;--> statement-breakpoint
DROP TABLE `automation_steps`;--> statement-breakpoint
DROP TABLE `automation_templates`;--> statement-breakpoint
DROP TABLE `belt_progress`;--> statement-breakpoint
DROP TABLE `belt_test_registrations`;--> statement-breakpoint
DROP TABLE `belt_tests`;--> statement-breakpoint
DROP TABLE `billing_applications`;--> statement-breakpoint
DROP TABLE `billing_documents`;--> statement-breakpoint
DROP TABLE `billing_transactions`;--> statement-breakpoint
DROP TABLE `campaign_recipients`;--> statement-breakpoint
DROP TABLE `campaigns`;--> statement-breakpoint
DROP TABLE `class_enrollments`;--> statement-breakpoint
DROP TABLE `class_entitlements`;--> statement-breakpoint
DROP TABLE `class_reminders`;--> statement-breakpoint
DROP TABLE `class_sessions`;--> statement-breakpoint
DROP TABLE `classes`;--> statement-breakpoint
DROP TABLE `conversations`;--> statement-breakpoint
DROP TABLE `credit_top_ups`;--> statement-breakpoint
DROP TABLE `direct_messages`;--> statement-breakpoint
DROP TABLE `directed_messages`;--> statement-breakpoint
DROP TABLE `discounts`;--> statement-breakpoint
DROP TABLE `documents`;--> statement-breakpoint
DROP TABLE `dojo_settings`;--> statement-breakpoint
DROP TABLE `enrollments`;--> statement-breakpoint
DROP TABLE `feature_flags`;--> statement-breakpoint
DROP TABLE `floor_plan_spots`;--> statement-breakpoint
DROP TABLE `floor_plans`;--> statement-breakpoint
DROP TABLE `kai_alerts`;--> statement-breakpoint
DROP TABLE `kai_conversations`;--> statement-breakpoint
DROP TABLE `kai_incidents`;--> statement-breakpoint
DROP TABLE `kai_messages`;--> statement-breakpoint
DROP TABLE `kai_operations_log`;--> statement-breakpoint
DROP TABLE `kai_system_status`;--> statement-breakpoint
DROP TABLE `kiosk_assignments`;--> statement-breakpoint
DROP TABLE `kiosk_check_ins`;--> statement-breakpoint
DROP TABLE `kiosk_deployments`;--> statement-breakpoint
DROP TABLE `kiosk_devices`;--> statement-breakpoint
DROP TABLE `kiosk_schedules`;--> statement-breakpoint
DROP TABLE `kiosk_theme_assets`;--> statement-breakpoint
DROP TABLE `kiosk_themes`;--> statement-breakpoint
DROP TABLE `kiosk_visitors`;--> statement-breakpoint
DROP TABLE `kiosk_waivers`;--> statement-breakpoint
DROP TABLE `kiosk_locations`;--> statement-breakpoint
DROP TABLE `lead_activities`;--> statement-breakpoint
DROP TABLE `lead_scoring_rules`;--> statement-breakpoint
DROP TABLE `lead_sources`;--> statement-breakpoint
DROP TABLE `leads`;--> statement-breakpoint
DROP TABLE `locations`;--> statement-breakpoint
DROP TABLE `membership_plans`;--> statement-breakpoint
DROP TABLE `merchandise_items`;--> statement-breakpoint
DROP TABLE `message_templates`;--> statement-breakpoint
DROP TABLE `message_threads`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
DROP TABLE `onboarding_progress`;--> statement-breakpoint
DROP TABLE `one_time_fees`;--> statement-breakpoint
DROP TABLE `organization_subscriptions`;--> statement-breakpoint
DROP TABLE `organization_users`;--> statement-breakpoint
DROP TABLE `organizations`;--> statement-breakpoint
DROP TABLE `owner_profiles`;--> statement-breakpoint
DROP TABLE `payment_methods`;--> statement-breakpoint
DROP TABLE `plan_entitlements`;--> statement-breakpoint
DROP TABLE `platform_onboarding_progress`;--> statement-breakpoint
DROP TABLE `platform_subscriptions`;--> statement-breakpoint
DROP TABLE `preset_backgrounds`;--> statement-breakpoint
DROP TABLE `program_enrollments`;--> statement-breakpoint
DROP TABLE `program_plans`;--> statement-breakpoint
DROP TABLE `programs`;--> statement-breakpoint
DROP TABLE `session_spot_assignments`;--> statement-breakpoint
DROP TABLE `setup_conflicts`;--> statement-breakpoint
DROP TABLE `setup_import_mappings`;--> statement-breakpoint
DROP TABLE `setup_import_rows`;--> statement-breakpoint
DROP TABLE `setup_imports`;--> statement-breakpoint
DROP TABLE `setup_progress`;--> statement-breakpoint
DROP TABLE `signed_waivers`;--> statement-breakpoint
DROP TABLE `sms_preferences`;--> statement-breakpoint
DROP TABLE `staff_messages`;--> statement-breakpoint
DROP TABLE `staff_pins`;--> statement-breakpoint
DROP TABLE `stock_alerts`;--> statement-breakpoint
DROP TABLE `stock_usage_history`;--> statement-breakpoint
DROP TABLE `student_accounts`;--> statement-breakpoint
DROP TABLE `student_attendance`;--> statement-breakpoint
DROP TABLE `student_cancellation_requests`;--> statement-breakpoint
DROP TABLE `student_contacts`;--> statement-breakpoint
DROP TABLE `student_deletion_requests`;--> statement-breakpoint
DROP TABLE `student_documents`;--> statement-breakpoint
DROP TABLE `student_enrollments`;--> statement-breakpoint
DROP TABLE `student_merchandise`;--> statement-breakpoint
DROP TABLE `student_message_attachments`;--> statement-breakpoint
DROP TABLE `student_messages`;--> statement-breakpoint
DROP TABLE `student_notes`;--> statement-breakpoint
DROP TABLE `student_password_reset_tokens`;--> statement-breakpoint
DROP TABLE `student_passwords`;--> statement-breakpoint
DROP TABLE `student_segment_members`;--> statement-breakpoint
DROP TABLE `student_segments`;--> statement-breakpoint
DROP TABLE `student_tuition`;--> statement-breakpoint
DROP TABLE `students`;--> statement-breakpoint
DROP TABLE `subscription_plans`;--> statement-breakpoint
DROP TABLE `team_members`;--> statement-breakpoint
DROP TABLE `thread_participants`;--> statement-breakpoint
DROP TABLE `unread_message_counts`;--> statement-breakpoint
DROP TABLE `usage_events`;--> statement-breakpoint
DROP TABLE `verification_codes`;--> statement-breakpoint
DROP TABLE `waiver_templates`;--> statement-breakpoint
DROP TABLE `webhook_keys`;--> statement-breakpoint
DROP INDEX `idx_users_openId` ON `users`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_openId_unique` UNIQUE(`openId`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `provider`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `providerId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `resetToken`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `resetTokenExpiry`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `globalRole`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `displayName`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `preferredName`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `phone`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `bio`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `photoUrl`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `photoUrlSmall`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `staffId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `locationIds`;