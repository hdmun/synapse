DROP TABLE IF EXISTS `file_sync_metadata`;--> statement-breakpoint
ALTER TABLE `messages` ADD COLUMN `tokens` text;--> statement-breakpoint
ALTER TABLE `messages` ADD COLUMN `features` text;--> statement-breakpoint
ALTER TABLE `messages` ADD COLUMN `tool_calls` text;--> statement-breakpoint
ALTER TABLE `messages` ADD COLUMN `enrichers` text;