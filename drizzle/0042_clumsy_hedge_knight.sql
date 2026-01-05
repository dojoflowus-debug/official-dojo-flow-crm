CREATE TABLE `account_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`flagType` enum('billing_risk','abuse','review_required','high_usage','support_escalation') NOT NULL,
	`notes` text,
	`resolved` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `add_ons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`addOnType` enum('seminar','workshop','tournament','camp','merchandise','equipment','private_lesson','other') NOT NULL,
	`price` int NOT NULL,
	`pricingType` enum('one_time','per_session','subscription') NOT NULL DEFAULT 'one_time',
	`availableFrom` timestamp,
	`availableUntil` timestamp,
	`maxCapacity` int,
	`currentEnrollment` int NOT NULL DEFAULT 0,
	`requiresMembership` int NOT NULL DEFAULT 0,
	`minimumBeltRank` varchar(50),
	`showOnKiosk` int NOT NULL DEFAULT 1,
	`showOnEnrollment` int NOT NULL DEFAULT 1,
	`imageUrl` varchar(500),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `ai_credit_balance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`periodAllowance` int NOT NULL DEFAULT 0,
	`periodUsed` int NOT NULL DEFAULT 0,
	`totalPurchased` int NOT NULL DEFAULT 0,
	`totalUsed` int NOT NULL DEFAULT 0,
	`lastResetAt` timestamp,
	`nextResetAt` timestamp,
	`lowCreditThreshold` int NOT NULL DEFAULT 50,
	`lowCreditAlertSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `ai_credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`type` enum('deduction','refund','allocation','purchase','bonus') NOT NULL DEFAULT 'deduction',
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`taskType` enum('kai_chat','ai_sms','ai_email','ai_phone_call','automation','data_analysis','other'),
	`description` text,
	`metadata` text,
	`relatedId` int,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `alert_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`isEnabled` int NOT NULL DEFAULT 1,
	`notifyEmail` int NOT NULL DEFAULT 1,
	`notifySms` int NOT NULL DEFAULT 0,
	`checkIntervalMinutes` int NOT NULL DEFAULT 360,
	`recipientEmails` text,
	`recipientPhones` text,
	`alertCooldownHours` int NOT NULL DEFAULT 24,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classSessionId` int,
	`status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
	`checkInTime` timestamp,
	`checkOutTime` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `automation_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`enrolledType` enum('lead','student') NOT NULL,
	`enrolledId` int NOT NULL,
	`currentStepId` int,
	`status` enum('active','paused','completed','cancelled') NOT NULL DEFAULT 'active',
	`nextExecutionAt` timestamp,
	`enrolledAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `automation_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`trigger` enum('new_lead','trial_scheduled','trial_completed','trial_no_show','enrollment','missed_class','inactive_student','renewal_due','custom') NOT NULL,
	`triggerConditions` text,
	`isActive` int NOT NULL DEFAULT 1,
	`enrollmentCount` int DEFAULT 0,
	`completedCount` int DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `automation_step_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`stepId` int NOT NULL,
	`status` enum('pending','completed','failed','skipped') NOT NULL DEFAULT 'pending',
	`executedAt` timestamp,
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `automation_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`stepType` enum('wait','send_sms','send_email','condition','end') NOT NULL,
	`waitMinutes` int,
	`subject` varchar(500),
	`message` text,
	`condition` text,
	`nextStepIdTrue` int,
	`nextStepIdFalse` int,
	`name` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `automation_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`isActive` int NOT NULL DEFAULT 1,
	`config` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `belt_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`currentBelt` varchar(50) NOT NULL DEFAULT 'White',
	`nextBelt` varchar(50) NOT NULL DEFAULT 'Yellow',
	`progressPercent` int NOT NULL DEFAULT 0,
	`qualifiedClasses` int NOT NULL DEFAULT 0,
	`classesRequired` int NOT NULL DEFAULT 20,
	`qualifiedAttendance` int NOT NULL DEFAULT 0,
	`attendanceRequired` int NOT NULL DEFAULT 80,
	`nextEvaluationDate` timestamp,
	`isEligible` int NOT NULL DEFAULT 0,
	`instructorNotes` text,
	`lastPromotionDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `belt_test_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`studentId` int NOT NULL,
	`studentName` varchar(255) NOT NULL,
	`currentBelt` varchar(50) NOT NULL,
	`status` enum('registered','cancelled','passed','failed','no_show') NOT NULL DEFAULT 'registered',
	`attendanceAtRegistration` int,
	`classesAtRegistration` int,
	`paymentStatus` enum('pending','paid','refunded','waived') DEFAULT 'pending',
	`instructorNotes` text,
	`resultNotes` text,
	`registeredAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`amountPaid` int
);
--> statement-breakpoint
CREATE TABLE `belt_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`beltLevel` varchar(50) NOT NULL,
	`testDate` timestamp NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10),
	`location` varchar(255) NOT NULL,
	`maxCapacity` int NOT NULL DEFAULT 20,
	`currentRegistrations` int NOT NULL DEFAULT 0,
	`instructorId` int,
	`instructorName` varchar(255),
	`fee` int DEFAULT 0,
	`status` enum('open','closed','completed','cancelled') NOT NULL DEFAULT 'open',
	`notes` text,
	`minAttendanceRequired` int DEFAULT 80,
	`minClassesRequired` int DEFAULT 20,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `billing_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`provider` varchar(50),
	`status` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`businessName` varchar(255),
	`dbaName` varchar(255),
	`businessAddress` text,
	`businessPhone` varchar(20),
	`ownerName` varchar(255),
	`ownerCell` varchar(20),
	`managerName` varchar(255),
	`managerCell` varchar(20),
	`hoursOfOperation` varchar(255),
	`daysOfOperation` varchar(255),
	`estimatedMonthlyVolume` int,
	`specialInstructions` text,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `billing_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`documentType` enum('drivers_license','voided_check','state_ein','address_verification','bank_letter') NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` varchar(500) NOT NULL,
	`fileName` varchar(255),
	`fileSize` int,
	`mimeType` varchar(100),
	`verified` int NOT NULL DEFAULT 0,
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `billing_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`studentId` int,
	`paymentMethodId` int,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`type` enum('payment','refund','adjustment') NOT NULL DEFAULT 'payment',
	`description` text,
	`stripePaymentIntentId` varchar(255),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `campaign_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`recipientType` enum('lead','student') NOT NULL,
	`recipientId` int NOT NULL,
	`status` enum('pending','sent','delivered','opened','clicked','bounced','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('email','sms','push') NOT NULL DEFAULT 'email',
	`status` enum('draft','scheduled','active','paused','completed') NOT NULL DEFAULT 'draft',
	`subject` varchar(255),
	`content` text,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `class_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classId` int NOT NULL,
	`smsRemindersEnabled` int NOT NULL DEFAULT 1,
	`status` enum('active','paused','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `class_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`classesPerWeek` int,
	`classesPerMonth` int,
	`isUnlimited` int NOT NULL DEFAULT 0,
	`allowedDurations` varchar(255),
	`allowedCategories` text,
	`requiresAdvanceBooking` int NOT NULL DEFAULT 0,
	`bookingWindowDays` int NOT NULL DEFAULT 7,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `class_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classId` int NOT NULL,
	`classDate` timestamp NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`twilioMessageId` varchar(100),
	`status` enum('pending','sent','failed','delivered') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `class_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`sessionDate` timestamp NOT NULL,
	`startTime` varchar(20) NOT NULL,
	`endTime` varchar(20),
	`floorPlanId` int,
	`instructorId` int,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`time` varchar(50) NOT NULL,
	`enrolled` int NOT NULL DEFAULT 0,
	`capacity` int NOT NULL DEFAULT 20,
	`instructor` varchar(255),
	`dayOfWeek` varchar(20),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`instructorId` int,
	`program` varchar(255),
	`level` varchar(50),
	`room` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`floorPlanId` int,
	`organizationId` int
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(255),
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastMessageAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_top_ups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`credits` int NOT NULL,
	`amountPaid` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`purchasedBy` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderType` varchar(20) NOT NULL,
	`senderRole` varchar(50),
	`body` text NOT NULL,
	`mentions` text NOT NULL,
	`readBy` text NOT NULL,
	`triggeredKai` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `directed_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientType` enum('student','staff','group') NOT NULL,
	`recipientId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`subject` varchar(500),
	`sourceConversationId` int,
	`sourceMessageId` int,
	`kaiMentioned` int NOT NULL DEFAULT 0,
	`isRead` int NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`label` varchar(100) DEFAULT 'message',
	`attachments` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`discountType` enum('percentage','fixed_amount','waive_fee','special_rate') NOT NULL,
	`discountValue` int NOT NULL,
	`appliesTo` enum('monthly_fee','registration_fee','down_payment','all_fees') NOT NULL,
	`eligibilityRules` text,
	`applicableToPrograms` text,
	`applicableToPlans` text,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`maxUses` int,
	`currentUses` int NOT NULL DEFAULT 0,
	`requiresApproval` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerType` enum('student','guardian','staff','account') NOT NULL,
	`ownerId` int NOT NULL,
	`linkedStudentId` int,
	`threadId` int,
	`messageId` int,
	`source` enum('chat_upload','waiver','invoice','onboarding','manual_upload','receipt') NOT NULL,
	`filename` varchar(500) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageUrl` varchar(1000) NOT NULL,
	`tags` text,
	`permissions` text,
	`description` text,
	`uploadedById` int,
	`uploadedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `dojo_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessName` varchar(255),
	`dbaName` varchar(255),
	`operatorName` varchar(255),
	`preferredName` varchar(255),
	`pronounsTone` varchar(50),
	`timezone` varchar(100) DEFAULT 'America/New_York',
	`primaryColor` varchar(20) DEFAULT '#3b82f6',
	`secondaryColor` varchar(20) DEFAULT '#8b5cf6',
	`logoSquare` text,
	`logoHorizontal` text,
	`setupCompleted` tinyint DEFAULT 0,
	`createdAt` datetime DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` datetime DEFAULT (CURRENT_TIMESTAMP),
	`industry` varchar(50),
	`businessModel` varchar(50),
	`usePreset` int DEFAULT 1,
	`monthlyRent` int,
	`monthlyUtilities` int,
	`monthlyPayroll` int,
	`monthlyMarketing` int,
	`currentMembers` int,
	`revenueGoal` int,
	`maxClassSize` int DEFAULT 20,
	`nonNegotiables` text,
	`focusSlider` int DEFAULT 50,
	`riskComfort` int DEFAULT 50,
	`schoolName` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(20),
	`website` varchar(500),
	`instructorTitle` varchar(50),
	`instructorFirstName` varchar(255),
	`instructorLastName` varchar(255),
	`martialArtsStyle` varchar(100),
	`addressLine1` varchar(255),
	`addressLine2` varchar(255),
	`city` varchar(100),
	`state` varchar(100),
	`zipCode` varchar(20),
	`country` varchar(100) DEFAULT 'United States',
	`weatherApiKey` varchar(255),
	`enableWeatherAlerts` int DEFAULT 1,
	`hasOutdoorClasses` int DEFAULT 0,
	`heatIndexThreshold` int DEFAULT 95,
	`airQualityThreshold` int DEFAULT 150,
	`paymentProvider` varchar(50),
	`stripeApiKey` varchar(255),
	`stripePublishableKey` varchar(255),
	`stripeWebhookSecret` varchar(255),
	`squareAccessToken` varchar(255),
	`squareLocationId` varchar(255),
	`paymentProcessor` varchar(50) DEFAULT 'stripe',
	`paymentApiKey` varchar(500),
	`paymentMerchantId` varchar(500),
	`paymentSetupLater` int DEFAULT 0,
	`twilioAccountSid` varchar(255),
	`twilioAuthToken` varchar(255),
	`twilioPhoneNumber` varchar(20),
	`enableSmsForLeads` int DEFAULT 0,
	`emailProvider` varchar(50) DEFAULT 'sendgrid',
	`senderEmail` varchar(320),
	`sendgridApiKey` varchar(500),
	`smtpHost` varchar(255),
	`smtpPort` int,
	`smtpUser` varchar(255),
	`smtpPassword` varchar(500),
	`enableEmailForLeads` int DEFAULT 0,
	`notifyStaffOnNewLead` int DEFAULT 1,
	`staffNotificationMethod` varchar(50) DEFAULT 'email',
	`staffNotificationPhone` varchar(20),
	`staffNotificationEmail` varchar(320),
	`autoSendSmsToLead` int DEFAULT 0,
	`autoSendEmailToLead` int DEFAULT 1,
	`autoUpdatePipelineStage` int DEFAULT 1,
	`bookingLink` varchar(500),
	`logoDarkUrl` varchar(500),
	`logoLightUrl` varchar(500),
	`organizationId` int
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('kai','form','staff') NOT NULL DEFAULT 'form',
	`status` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`dateOfBirth` timestamp,
	`age` int,
	`phone` varchar(20),
	`email` varchar(320),
	`streetAddress` varchar(255),
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`guardianName` varchar(255),
	`guardianRelationship` varchar(50),
	`guardianPhone` varchar(20),
	`guardianEmail` varchar(320),
	`programInterest` varchar(100),
	`experienceLevel` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`classType` varchar(100),
	`goals` text,
	`motivation` text,
	`allergies` text,
	`medicalConditions` text,
	`emergencyContactName` varchar(255),
	`emergencyContactPhone` varchar(20),
	`selectedMembershipPlan` varchar(100),
	`pricingNotes` text,
	`waiverSigned` int NOT NULL DEFAULT 0,
	`waiverSignature` text,
	`waiverSignedAt` timestamp,
	`consentGiven` int NOT NULL DEFAULT 0,
	`conversationId` int,
	`conversationTranscript` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`featureName` varchar(100) NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`config` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `floor_plan_spots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`floorPlanId` int NOT NULL,
	`spotNumber` int NOT NULL,
	`spotLabel` varchar(50) NOT NULL,
	`positionX` int,
	`positionY` int,
	`rowIdentifier` varchar(10),
	`columnIdentifier` varchar(10),
	`isAvailable` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`spotType` enum('bag','mat','rank_position') NOT NULL DEFAULT 'rank_position'
);
--> statement-breakpoint
CREATE TABLE `floor_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomName` varchar(255) NOT NULL,
	`locationId` int,
	`lengthFeet` int,
	`widthFeet` int,
	`squareFeet` int,
	`safetySpacingFeet` int NOT NULL DEFAULT 3,
	`templateType` enum('kickboxing_bags','yoga_grid','karate_lines') NOT NULL,
	`matRotation` enum('horizontal','vertical') DEFAULT 'horizontal',
	`maxCapacity` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `kai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL DEFAULT 'New Conversation',
	`summary` text,
	`preview` text,
	`threadType` enum('kai_direct','group') NOT NULL DEFAULT 'kai_direct',
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`category` enum('kai','growth','billing','operations','general') NOT NULL DEFAULT 'kai',
	`priority` enum('neutral','attention','urgent') NOT NULL DEFAULT 'neutral',
	`lastMessageAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	`archivedAt` timestamp,
	`participantIds` text
);
--> statement-breakpoint
CREATE TABLE `kai_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`organizationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`attachments` text
);
--> statement-breakpoint
CREATE TABLE `kiosk_check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int,
	`visitorId` int,
	`checkInType` enum('student','visitor','trial') NOT NULL DEFAULT 'student',
	`checkInTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`checkOutTime` timestamp,
	`classSessionId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kiosk_visitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`visitPurpose` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kiosk_waivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` int,
	`studentId` int,
	`waiverTemplateId` int NOT NULL,
	`signatureData` text,
	`signedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kiosk_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`locationId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`settings` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `lead_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`type` enum('call','email','sms','note','status_change','meeting','task') NOT NULL,
	`title` varchar(255),
	`content` text,
	`previousStatus` varchar(100),
	`newStatus` varchar(100),
	`callDuration` int,
	`callOutcome` enum('answered','voicemail','no_answer','busy','wrong_number'),
	`isAutomated` int NOT NULL DEFAULT 0,
	`createdById` int,
	`createdByName` varchar(255),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `lead_scoring_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`points` int NOT NULL,
	`description` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `lead_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(100),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`stage` enum('new','contacted','appointment_set','trial_scheduled','trial_completed','proposal_sent','negotiation','won','lost') NOT NULL DEFAULT 'new',
	`source` varchar(100),
	`interestedProgram` varchar(100),
	`notes` text,
	`assignedTo` int,
	`lastContactDate` timestamp,
	`nextFollowUpDate` timestamp,
	`locationId` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`address` varchar(255),
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`lat` varchar(50),
	`lng` varchar(50),
	`status` enum('New Lead','Attempting Contact','Contact Made','Intro Scheduled','Offer Presented','Enrolled','Nurture','Lost/Winback') NOT NULL DEFAULT 'New Lead',
	`message` text,
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`utmContent` varchar(255),
	`utmTerm` varchar(255),
	`leadScore` int NOT NULL DEFAULT 50,
	`leadScoreUpdatedAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`organizationId` int
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`phone` varchar(20),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`isActive` tinyint DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`kioskEnabled` int NOT NULL DEFAULT 0,
	`kioskSlug` varchar(255),
	`kioskSettings` text,
	`organizationId` int
);
--> statement-breakpoint
CREATE TABLE `membership_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`billingFrequency` enum('monthly','weekly','daily','drop_in') NOT NULL DEFAULT 'monthly',
	`priceAmount` int NOT NULL DEFAULT 0,
	`billingInterval` int DEFAULT 1,
	`monthlyAmount` int NOT NULL,
	`termLength` int,
	`billingCycle` enum('monthly','biweekly','weekly','annual') NOT NULL DEFAULT 'monthly',
	`billingDays` varchar(50),
	`downPayment` int NOT NULL DEFAULT 0,
	`registrationFee` int NOT NULL DEFAULT 0,
	`autoRenew` int NOT NULL DEFAULT 1,
	`cancellationPolicy` text,
	`isPopular` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`billingAnchorDayOfWeek` int,
	`termLengthUnits` enum('months','weeks','days','visits'),
	`termLengthValue` int,
	`perVisitPrice` int,
	`visitPackSize` int,
	`visitPackExpiryDays` int,
	`chargeOnAttendance` int DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `merchandise_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('uniform','gear','belt','equipment','other') NOT NULL,
	`defaultPrice` int NOT NULL DEFAULT 0,
	`requiresSize` int NOT NULL DEFAULT 0,
	`sizeOptions` text,
	`description` text,
	`imageUrl` varchar(500),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`stockQuantity` int,
	`lowStockThreshold` int,
	`reorderPoint` int,
	`reorderQuantity` int,
	`averageDailyUsage` varchar(20),
	`lastCalculatedAt` timestamp,
	`leadTimeDays` int DEFAULT 7,
	`safetyStockMultiplier` varchar(10) DEFAULT '1.5'
);
--> statement-breakpoint
CREATE TABLE `message_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('email','sms') NOT NULL DEFAULT 'email',
	`subject` varchar(255),
	`content` text NOT NULL,
	`variables` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `message_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contextType` varchar(50) NOT NULL DEFAULT 'general',
	`contextId` int,
	`participants` text NOT NULL,
	`subject` varchar(255),
	`lastMessageAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`organizationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`accountData` text,
	`isVerified` int NOT NULL DEFAULT 0,
	`schoolData` text,
	`selectedPlanId` int,
	`paymentCompleted` int NOT NULL DEFAULT 0,
	`isCompleted` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `one_time_fees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`amount` int NOT NULL,
	`feeType` enum('registration','down_payment','certification','testing','equipment','uniform','other') NOT NULL,
	`chargeWhen` enum('signup','first_class','certification_event','testing_event','manual') NOT NULL DEFAULT 'signup',
	`applicableToPrograms` text,
	`applicableToPlans` text,
	`isRequired` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `organization_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('trial','active','past_due','cancelled','paused') NOT NULL DEFAULT 'trial',
	`billingCycle` enum('monthly','annual') NOT NULL DEFAULT 'monthly',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`trialEndsAt` timestamp,
	`cancelledAt` timestamp,
	`cancellationReason` text,
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `organization_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`role` enum('owner','admin','staff','instructor','read_only') NOT NULL DEFAULT 'staff',
	`isPrimary` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(500),
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`timezone` varchar(100) NOT NULL DEFAULT 'America/New_York',
	`programs` text,
	`estimatedStudents` int,
	`launchDate` timestamp,
	`logoUrl` varchar(500),
	`planId` int,
	`subscriptionStatus` enum('trial','active','past_due','cancelled','inactive') NOT NULL DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastActivity` timestamp,
	`settings` text
);
--> statement-breakpoint
CREATE TABLE `owner_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`bio` text,
	`specialties` text,
	`certifications` text,
	`yearsExperience` int,
	`profilePhotoUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`studentId` int,
	`type` enum('card','bank_account','cash','check') NOT NULL DEFAULT 'card',
	`provider` varchar(50),
	`last4` varchar(4),
	`brand` varchar(50),
	`expiryMonth` int,
	`expiryYear` int,
	`isDefault` int NOT NULL DEFAULT 0,
	`stripePaymentMethodId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `plan_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`entitlementId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `platform_onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`stepsCompleted` text,
	`completed` int NOT NULL DEFAULT 0,
	`lastStepAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `platform_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`plan` varchar(100) NOT NULL,
	`billingStatus` enum('active','past_due','canceled','unpaid','trialing') NOT NULL DEFAULT 'trialing',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`canceledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `program_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`programId` int NOT NULL,
	`status` enum('pending_waiver','pending_payment','pending_approval','trial','active','expired','cancelled') NOT NULL DEFAULT 'pending_waiver',
	`enrollmentType` enum('paid','free_trial','prorated_trial','instructor_approval') NOT NULL DEFAULT 'paid',
	`trialStartDate` timestamp,
	`trialEndDate` timestamp,
	`trialLengthDays` int,
	`amountPaid` int DEFAULT 0,
	`stripeSubscriptionId` varchar(255),
	`signedWaiverId` int,
	`approvedBy` int,
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `program_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int NOT NULL,
	`planId` int NOT NULL,
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('membership','class_pack','drop_in','private') NOT NULL,
	`ageRange` varchar(100),
	`billing` enum('monthly','weekly','per_session','one_time'),
	`price` int,
	`contractLength` varchar(50),
	`maxSize` int DEFAULT 20,
	`isCoreProgram` int DEFAULT 0,
	`showOnKiosk` int DEFAULT 1,
	`allowAutopilot` int DEFAULT 0,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`waiverRequired` int NOT NULL DEFAULT 1,
	`paymentRequired` int NOT NULL DEFAULT 1,
	`approvalRequired` int NOT NULL DEFAULT 0,
	`trialType` enum('none','free','prorated') DEFAULT 'none',
	`trialLengthDays` int DEFAULT 7,
	`trialPrice` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`termLength` int,
	`eligibility` enum('open','invitation_only','upgrade_only') NOT NULL DEFAULT 'open',
	`showOnEnrollment` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`organizationId` int
);
--> statement-breakpoint
CREATE TABLE `session_spot_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`studentId` int NOT NULL,
	`spotId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`assignmentMethod` enum('auto','manual','student_choice') NOT NULL DEFAULT 'auto',
	`attended` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `signed_waivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`waiverTemplateId` int NOT NULL,
	`programId` int,
	`signerType` enum('student','guardian') NOT NULL,
	`signerName` varchar(255) NOT NULL,
	`signerEmail` varchar(320),
	`signatureData` text NOT NULL,
	`pdfUrl` varchar(500),
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `sms_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`optedIn` int NOT NULL DEFAULT 1,
	`classReminders` int NOT NULL DEFAULT 1,
	`billingReminders` int NOT NULL DEFAULT 1,
	`promotionalMessages` int NOT NULL DEFAULT 0,
	`reminderHoursBefore` int NOT NULL DEFAULT 24,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `staff_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`senderType` enum('staff','student','system') NOT NULL,
	`senderId` int,
	`senderName` varchar(255) NOT NULL,
	`subject` varchar(500),
	`content` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`parentMessageId` int,
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`readAt` timestamp,
	`attachments` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `staff_pins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`pinHash` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`role` varchar(50) DEFAULT 'staff',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastUsed` timestamp,
	`organizationId` int
);
--> statement-breakpoint
CREATE TABLE `stock_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`alertType` enum('low_stock','out_of_stock') NOT NULL DEFAULT 'low_stock',
	`quantityAtAlert` int NOT NULL,
	`threshold` int NOT NULL,
	`lastAlertSent` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`alertCount` int NOT NULL DEFAULT 1,
	`isResolved` int NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `stock_usage_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`quantityChange` int NOT NULL,
	`changeType` enum('fulfillment','bulk_assignment','adjustment','received_shipment','inventory_count','damage','return','other') NOT NULL,
	`quantityAfter` int NOT NULL,
	`notes` text,
	`changedBy` int,
	`timestamp` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `student_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `student_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classId` int,
	`className` varchar(255),
	`instructorName` varchar(255),
	`classDate` timestamp NOT NULL,
	`status` enum('attended','missed','excused','upcoming') NOT NULL DEFAULT 'upcoming',
	`isQualified` int NOT NULL DEFAULT 1,
	`checkedInAt` timestamp,
	`location` varchar(255),
	`beltRequirement` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `student_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`documentType` enum('waiver','receipt','certificate','medical','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`isImmutable` int NOT NULL DEFAULT 0,
	`relatedType` varchar(50),
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `student_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`programId` int NOT NULL,
	`planId` int NOT NULL,
	`entitlementId` int,
	`status` enum('active','paused','cancelled','completed') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`nextBillingDate` timestamp,
	`appliedDiscounts` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `student_merchandise` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`itemId` int NOT NULL,
	`size` varchar(20),
	`pricePaid` int NOT NULL DEFAULT 0,
	`fulfillmentStatus` enum('pending','handed_out','confirmed','disputed') NOT NULL DEFAULT 'pending',
	`handedOutAt` timestamp,
	`handedOutBy` int,
	`confirmedAt` timestamp,
	`confirmationMethod` enum('sms','email','in_person'),
	`confirmationToken` varchar(255),
	`confirmationTokenExpiry` timestamp,
	`disputeReason` text,
	`disputedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `student_message_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `student_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`senderType` enum('student','staff') NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`subject` varchar(500),
	`content` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`parentMessageId` int,
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `student_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`noteType` varchar(20) NOT NULL DEFAULT 'note',
	`createdBy` int,
	`createdByName` varchar(255),
	`content` text,
	`threadId` int,
	`messageId` int,
	`isPinned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `student_password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` int NOT NULL DEFAULT 0,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `student_passwords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`lastChangedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`dateOfBirth` timestamp,
	`age` int,
	`beltRank` varchar(100),
	`status` enum('Active','Inactive','On Hold') NOT NULL DEFAULT 'Active',
	`membershipStatus` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`photoUrl` varchar(500),
	`program` varchar(100),
	`streetAddress` varchar(255),
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`guardianName` varchar(255),
	`guardianRelationship` varchar(50),
	`guardianPhone` varchar(20),
	`guardianEmail` varchar(320),
	`organizationId` int
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`monthlyPrice` int NOT NULL,
	`annualPrice` int,
	`maxStudents` int NOT NULL,
	`maxLocations` int NOT NULL,
	`monthlyCredits` int NOT NULL,
	`features` text NOT NULL,
	`aiPhoneEnabled` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`displayOrder` int NOT NULL DEFAULT 0,
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('owner','manager','instructor','front_desk','coach','trainer','assistant') NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`locationIds` text,
	`addressAs` varchar(255),
	`focusAreas` text,
	`canViewFinancials` int DEFAULT 0,
	`canEditSchedule` int DEFAULT 0,
	`canManageLeads` int DEFAULT 0,
	`viewOnly` int DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`photoUrl` varchar(500),
	`organizationId` int
);
--> statement-breakpoint
CREATE TABLE `thread_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`participantType` enum('staff','student','system') NOT NULL,
	`participantId` int,
	`participantName` varchar(255) NOT NULL,
	`role` enum('owner','member','viewer') NOT NULL DEFAULT 'member',
	`addedById` int,
	`addedByName` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`lastReadMessageId` int,
	`lastReadAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `unread_message_counts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userType` varchar(20) NOT NULL,
	`threadId` int NOT NULL,
	`unreadCount` int NOT NULL DEFAULT 0,
	`lastReadMessageId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`type` enum('kai_call','sms','email','ai_action','phone_call') NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`metadata` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`provider` varchar(64),
	`providerId` varchar(255),
	`name` text,
	`email` varchar(320),
	`password` varchar(255),
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`loginMethod` varchar(64),
	`role` enum('user','admin','owner','staff') NOT NULL DEFAULT 'user',
	`globalRole` enum('platform_admin','support','none') NOT NULL DEFAULT 'none',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`displayName` varchar(255),
	`preferredName` varchar(255),
	`phone` varchar(20),
	`bio` varchar(160),
	`photoUrl` varchar(500),
	`photoUrlSmall` varchar(500),
	`staffId` varchar(50),
	`locationIds` text
);
--> statement-breakpoint
CREATE TABLE `verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(320) NOT NULL,
	`code` varchar(6) NOT NULL,
	`type` enum('email','sms','login') NOT NULL DEFAULT 'email',
	`expiresAt` timestamp NOT NULL,
	`isUsed` int NOT NULL DEFAULT 0,
	`attempts` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `waiver_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `webhook_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`apiKey` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_org_resolved` ON `account_flags` (`organizationId`,`resolved`);--> statement-breakpoint
CREATE INDEX `organizationId` ON `ai_credit_balance` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_org_created` ON `ai_credit_transactions` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_task_type` ON `ai_credit_transactions` (`taskType`);--> statement-breakpoint
CREATE INDEX `idx_attendance_student` ON `attendance` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_attendance_session` ON `attendance` (`classSessionId`);--> statement-breakpoint
CREATE INDEX `idx_automation_step_executions_enrollment` ON `automation_step_executions` (`enrollmentId`);--> statement-breakpoint
CREATE INDEX `belt_progress_studentId_unique` ON `belt_progress` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_billing_applications_user` ON `billing_applications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_billing_documents_application` ON `billing_documents` (`applicationId`);--> statement-breakpoint
CREATE INDEX `idx_billing_transactions_user` ON `billing_transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_billing_transactions_student` ON `billing_transactions` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_campaign_recipients_campaign` ON `campaign_recipients` (`campaignId`);--> statement-breakpoint
CREATE INDEX `idx_class` ON `class_sessions` (`classId`);--> statement-breakpoint
CREATE INDEX `idx_session_date` ON `class_sessions` (`sessionDate`);--> statement-breakpoint
CREATE INDEX `idx_floor_plan` ON `class_sessions` (`floorPlanId`);--> statement-breakpoint
CREATE INDEX `idx_conversations_org` ON `conversations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_conversations_user` ON `conversations` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `idx_conversations_last_message` ON `conversations` (`lastMessageAt`);--> statement-breakpoint
CREATE INDEX `unique_org_feature` ON `feature_flags` (`organizationId`,`featureName`);--> statement-breakpoint
CREATE INDEX `idx_floor_plan` ON `floor_plan_spots` (`floorPlanId`);--> statement-breakpoint
CREATE INDEX `idx_kai_conversations_org` ON `kai_conversations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_kai_conversations_user` ON `kai_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_kai_conversations_last_message` ON `kai_conversations` (`lastMessageAt`);--> statement-breakpoint
CREATE INDEX `idx_kai_messages_conversation` ON `kai_messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_kai_messages_org_conversation` ON `kai_messages` (`organizationId`,`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_kai_messages_created` ON `kai_messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_kiosk_check_ins_student` ON `kiosk_check_ins` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_kiosk_waivers_visitor` ON `kiosk_waivers` (`visitorId`);--> statement-breakpoint
CREATE INDEX `idx_kiosk_waivers_student` ON `kiosk_waivers` (`studentId`);--> statement-breakpoint
CREATE INDEX `lead_scoring_rules_activityType_unique` ON `lead_scoring_rules` (`activityType`);--> statement-breakpoint
CREATE INDEX `idx_locations_kiosk_slug` ON `locations` (`kioskSlug`);--> statement-breakpoint
CREATE INDEX `idx_messages_conversation` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_messages_org_conversation` ON `messages` (`organizationId`,`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_messages_created` ON `messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId` ON `onboarding_progress` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId` ON `organization_subscriptions` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId` ON `owner_profiles` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_payment_methods_user` ON `payment_methods` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_payment_methods_student` ON `payment_methods` (`studentId`);--> statement-breakpoint
CREATE INDEX `organizationId` ON `platform_onboarding_progress` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId` ON `platform_subscriptions` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_session` ON `session_spot_assignments` (`sessionId`);--> statement-breakpoint
CREATE INDEX `idx_student` ON `session_spot_assignments` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_spot` ON `session_spot_assignments` (`spotId`);--> statement-breakpoint
CREATE INDEX `sms_preferences_studentId_unique` ON `sms_preferences` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_itemId` ON `stock_usage_history` (`itemId`);--> statement-breakpoint
CREATE INDEX `idx_timestamp` ON `stock_usage_history` (`timestamp`);--> statement-breakpoint
CREATE INDEX `student_accounts_studentId_unique` ON `student_accounts` (`studentId`);--> statement-breakpoint
CREATE INDEX `student_accounts_email_unique` ON `student_accounts` (`email`);--> statement-breakpoint
CREATE INDEX `idx_student` ON `student_merchandise` (`studentId`);--> statement-breakpoint
CREATE INDEX `idx_item` ON `student_merchandise` (`itemId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `student_merchandise` (`fulfillmentStatus`);--> statement-breakpoint
CREATE INDEX `student_password_reset_tokens_token_unique` ON `student_password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `student_passwords_studentId_unique` ON `student_passwords` (`studentId`);--> statement-breakpoint
CREATE INDEX `name` ON `subscription_plans` (`name`);--> statement-breakpoint
CREATE INDEX `slug` ON `subscription_plans` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_org_created` ON `usage_events` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_type` ON `usage_events` (`type`);--> statement-breakpoint
CREATE INDEX `idx_users_openId` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `idx_webhook_keys_api_key` ON `webhook_keys` (`apiKey`);