-- Keep every original row for rollback; this archive is never exposed by the API.
CREATE TABLE `vote_cleanup_backup` AS SELECT rowid AS source_rowid, * FROM votes;--> statement-breakpoint
ALTER TABLE `votes` ADD `author_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Existing production names were audited: ASCII, matching the runtime NFKC key.
UPDATE votes SET author_key = lower(trim(author));--> statement-breakpoint
DELETE FROM votes WHERE rowid IN (
  SELECT source_rowid FROM (
    SELECT rowid AS source_rowid,
      ROW_NUMBER() OVER (
        PARTITION BY proposal_id, slot_id, author_key
        ORDER BY created DESC, rowid DESC
      ) AS duplicate_rank
    FROM votes
  ) WHERE duplicate_rank > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_vote_proposal_author` ON `votes` (`proposal_id`,`author_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_vote_slot_author` ON `votes` (`slot_id`,`author_key`);
