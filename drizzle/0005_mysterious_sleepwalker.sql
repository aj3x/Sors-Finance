CREATE TABLE IF NOT EXISTS `custom_import_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text NOT NULL,
	`name` text NOT NULL,
	`mapping` text NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `custom_import_templates_uuid_unique` ON `custom_import_templates` (`uuid`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `custom_import_templates_user_idx` ON `custom_import_templates` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `custom_import_templates_name_idx` ON `custom_import_templates` (`name`);
