DROP TABLE IF EXISTS `file_sync_metadata`;--> statement-breakpoint
DROP TABLE IF EXISTS `plans`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `features`;--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `progress`;