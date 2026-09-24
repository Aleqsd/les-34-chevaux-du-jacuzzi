CREATE TABLE `activity_details` (
	`proposal_id` text PRIMARY KEY NOT NULL,
	`cost_cents` integer,
	`address` text DEFAULT '' NOT NULL,
	`travel` text DEFAULT '' NOT NULL,
	`capacity` integer,
	`pricing` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`updated_by` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_comments_proposal` ON `comments` (`proposal_id`,`created`);--> statement-breakpoint
CREATE TABLE `duel_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`first_id` text NOT NULL,
	`second_id` text NOT NULL,
	`chosen_id` text NOT NULL,
	`author` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`first_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`second_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chosen_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_duel_pair` ON `duel_votes` (`first_id`,`second_id`);--> statement-breakpoint
CREATE TABLE `plan_participants` (
	`plan_id` text NOT NULL,
	`author_key` text NOT NULL,
	`author` text NOT NULL,
	`attending` integer NOT NULL,
	PRIMARY KEY(`plan_id`, `author_key`),
	FOREIGN KEY (`plan_id`) REFERENCES `selected_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `selected_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`selected_by` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
