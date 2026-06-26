CREATE TABLE `file_sync_metadata` (
	`path` text PRIMARY KEY NOT NULL,
	`last_modified_at` integer NOT NULL,
	`file_size` integer NOT NULL
);
