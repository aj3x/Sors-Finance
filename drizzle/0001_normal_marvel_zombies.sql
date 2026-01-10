CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_uuid_unique` ON `users` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
DROP INDEX `settings_key_unique`;--> statement-breakpoint
ALTER TABLE `settings` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `settings_user_idx` ON `settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `settings_user_key_idx` ON `settings` (`user_id`,`key`);--> statement-breakpoint
ALTER TABLE `budgets` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `budgets_user_idx` ON `budgets` (`user_id`);--> statement-breakpoint
ALTER TABLE `categories` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `categories_user_idx` ON `categories` (`user_id`);--> statement-breakpoint
ALTER TABLE `imports` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `imports_user_idx` ON `imports` (`user_id`);--> statement-breakpoint
ALTER TABLE `portfolio_accounts` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `portfolio_accounts_user_idx` ON `portfolio_accounts` (`user_id`);--> statement-breakpoint
ALTER TABLE `portfolio_items` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `portfolio_items_user_idx` ON `portfolio_items` (`user_id`);--> statement-breakpoint
ALTER TABLE `portfolio_snapshots` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `portfolio_snapshots_user_idx` ON `portfolio_snapshots` (`user_id`);--> statement-breakpoint
ALTER TABLE `transactions` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `transactions_user_idx` ON `transactions` (`user_id`);