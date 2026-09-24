CREATE TABLE `profiles` (
	`author_key` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`avatar` integer NOT NULL,
	`image_url` text DEFAULT '' NOT NULL
);
