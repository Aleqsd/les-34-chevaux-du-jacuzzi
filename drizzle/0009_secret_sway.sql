CREATE TABLE `feature_ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
