CREATE TABLE `credentials` (
	`cd_user` integer PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`last_modified` integer NOT NULL,
	FOREIGN KEY (`cd_user`) REFERENCES `users`(`cd_user`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`cd_favorite` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cd_profile` integer NOT NULL,
	`url` text NOT NULL,
	`descricao` text NOT NULL,
	`icone` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`last_modified` integer NOT NULL,
	FOREIGN KEY (`cd_profile`) REFERENCES `profiles`(`cd_profile`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favorites_profile_id_idx` ON `favorites` (`cd_profile`,`sort_order`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`cd_profile` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cd_user` integer NOT NULL,
	`nm_profile` text(100) NOT NULL,
	`created_at` integer NOT NULL,
	`last_modified` integer NOT NULL,
	FOREIGN KEY (`cd_user`) REFERENCES `users`(`cd_user`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "nm_profile_max_length" CHECK(length("profiles"."nm_profile") <= 100)
);
--> statement-breakpoint
CREATE INDEX `profiles_user_id_idx` ON `profiles` (`cd_user`);--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`cd_refresh_token` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cd_user` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`cd_user`) REFERENCES `users`(`cd_user`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_hash_unique` ON `refresh_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_id_idx` ON `refresh_tokens` (`cd_user`);--> statement-breakpoint
CREATE TABLE `users` (
	`cd_user` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nm_user` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_modified` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);