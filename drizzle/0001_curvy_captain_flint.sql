CREATE TABLE `staff_pins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`pinHash` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`role` varchar(50) DEFAULT 'staff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastUsed` timestamp,
	CONSTRAINT `staff_pins_id` PRIMARY KEY(`id`)
);
