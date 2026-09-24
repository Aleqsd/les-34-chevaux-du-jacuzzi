CREATE TABLE `cookie_actions` (
	`author_key` text NOT NULL,
	`id` text NOT NULL,
	`payload` text NOT NULL,
	`result` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`author_key`, `id`)
);
--> statement-breakpoint
CREATE INDEX `idx_cookie_actions_created` ON `cookie_actions` (`created`);--> statement-breakpoint
CREATE TABLE `cookie_players` (
	`author_key` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL,
	`last_action` text DEFAULT '' NOT NULL
);
