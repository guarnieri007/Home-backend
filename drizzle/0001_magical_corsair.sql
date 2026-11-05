CREATE TABLE `reset_password_tokens` (
	`cd_reset_password_token` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cd_user` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`cd_user`) REFERENCES `users`(`cd_user`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reset_password_tokens_token_hash_unique` ON `reset_password_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `reset_password_tokens_user_id_idx` ON `reset_password_tokens` (`cd_user`);