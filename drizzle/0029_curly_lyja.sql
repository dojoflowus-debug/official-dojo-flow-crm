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
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt_test_registrations_id` PRIMARY KEY(`id`)
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt_tests_id` PRIMARY KEY(`id`)
);
