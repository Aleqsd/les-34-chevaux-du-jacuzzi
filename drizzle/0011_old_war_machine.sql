CREATE TABLE `crew_progress` (
	`author_key` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`peak_votes` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `idea_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`idea_id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `feature_ideas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_idea_comments` ON `idea_comments` (`idea_id`,`created`);--> statement-breakpoint
CREATE TABLE `presence` (
	`session_id` text PRIMARY KEY NOT NULL,
	`author_key` text NOT NULL,
	`author` text NOT NULL,
	`room` text NOT NULL,
	`action` text NOT NULL,
	`revision` integer NOT NULL,
	`changed` integer NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_presence_seen` ON `presence` (`last_seen`);--> statement-breakpoint
ALTER TABLE `votes` ADD `idea_id` text REFERENCES feature_ideas(id);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_vote_idea_author` ON `votes` (`idea_id`,`author_key`);
--> statement-breakpoint
INSERT INTO crew_progress(author_key,author,peak_votes) SELECT author_key,MAX(author),COUNT(*) FROM votes GROUP BY author_key;
