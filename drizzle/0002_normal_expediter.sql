CREATE TABLE `agentInteractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`interactionType` varchar(50) NOT NULL,
	`question` text NOT NULL,
	`userResponse` text,
	`agentInsight` text,
	`sentiment` varchar(20),
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentInteractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`memoryType` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`confidence` decimal(3,2),
	`lastUsed` timestamp,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentMemory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`actionType` varchar(50),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`openedAt` timestamp,
	`respondedAt` timestamp,
	`response` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`dayOfWeek` varchar(20),
	`timeOfDay` varchar(20) NOT NULL,
	`hour` int,
	`minute` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceToken` varchar(255) NOT NULL,
	`deviceType` varchar(20) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `pushTokens_deviceToken_unique` UNIQUE(`deviceToken`)
);
--> statement-breakpoint
CREATE TABLE `quickReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`replyText` text NOT NULL,
	`replyType` varchar(50) NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quickReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationshipHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`description` text NOT NULL,
	`impact` varchar(20),
	`lesson` text,
	`preventionTip` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relationshipHistory_id` PRIMARY KEY(`id`)
);
