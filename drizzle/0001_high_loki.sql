CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`role` varchar(20) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversationStarters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`prompt` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationStarters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gestureSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`suggestion` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`isFavorited` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gestureSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `healthCheckIns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`mood` varchar(50) NOT NULL,
	`feeling` text,
	`connectionScore` int NOT NULL,
	`notes` text,
	`checkedInAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `healthCheckIns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`partnerName` varchar(255) NOT NULL,
	`anniversaryDate` timestamp NOT NULL,
	`loveLanguage` varchar(50) NOT NULL,
	`relationshipGoals` text,
	`profileCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`reminderDate` timestamp NOT NULL,
	`reminderType` varchar(50) NOT NULL,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`recurringPattern` varchar(50),
	`notified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
