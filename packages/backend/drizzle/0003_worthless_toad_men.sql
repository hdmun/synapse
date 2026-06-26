DROP TABLE `thoughts`;--> statement-breakpoint
DROP TABLE `tool_calls`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`source` text DEFAULT 'gemini' NOT NULL,
	`start_time` integer NOT NULL,
	`last_updated` integer NOT NULL,
	`status` text DEFAULT 'active',
	`model` text,
	`summary` text,
	`total_tokens` text,
	`estimated_cost` real DEFAULT 0,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "project_id", "source", "start_time", "last_updated", "status", "model", "summary", "total_tokens", "estimated_cost") SELECT "id", "project_id", "source", "start_time", "last_updated", "status", "model", "summary", "total_tokens_v2", "estimated_cost" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `input_tokens`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `output_tokens`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `thought_tokens`;