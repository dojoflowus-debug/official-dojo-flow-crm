CREATE TABLE `student_password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` int NOT NULL DEFAULT 0,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `student_passwords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`lastChangedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_passwords_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_passwords_studentId_unique` UNIQUE(`studentId`)
);
