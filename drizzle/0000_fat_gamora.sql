CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`movie` text,
	`start` text,
	`end` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`author` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_slots_proposal` ON `slots` (`proposal_id`);--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text,
	`slot_id` text,
	`author` text NOT NULL,
	`value` integer NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_votes_proposal` ON `votes` (`proposal_id`);--> statement-breakpoint
CREATE INDEX `idx_votes_slot` ON `votes` (`slot_id`);