CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`timestamp` integer NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`thought_tokens` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`project_id` text,
	`content` text NOT NULL,
	`total_tasks` integer DEFAULT 0,
	`completed_tasks` integer DEFAULT 0,
	`last_updated` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`name` text NOT NULL,
	`total_tokens` integer DEFAULT 0,
	`progress` real DEFAULT 0,
	`last_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`start_time` integer NOT NULL,
	`last_updated` integer NOT NULL,
	`status` text DEFAULT 'active',
	`model` text,
	`summary` text,
	`total_tokens` integer DEFAULT 0,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `thoughts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` text,
	`subject` text,
	`description` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tool_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text,
	`name` text NOT NULL,
	`args` text,
	`result` text,
	`status` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
