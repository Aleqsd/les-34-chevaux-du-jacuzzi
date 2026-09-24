-- Reject writes from the retired API during a rolling deployment.
CREATE TRIGGER votes_require_author_key BEFORE INSERT ON votes
WHEN NEW.author_key = ''
BEGIN SELECT RAISE(ABORT, 'A normalized voter name is required'); END;--> statement-breakpoint
CREATE TRIGGER votes_keep_author_key BEFORE UPDATE OF author_key ON votes
WHEN NEW.author_key = ''
BEGIN SELECT RAISE(ABORT, 'A normalized voter name is required'); END;--> statement-breakpoint
-- Archive and reconcile any legacy writes between migrations 0005 and 0006.
INSERT INTO vote_cleanup_backup (source_rowid,id,proposal_id,slot_id,author,value,created)
SELECT rowid,id,proposal_id,slot_id,author,value,created FROM votes
WHERE author_key = '' AND id NOT IN (SELECT id FROM vote_cleanup_backup);--> statement-breakpoint
DELETE FROM votes WHERE rowid IN (
  SELECT source_rowid FROM (
    SELECT rowid AS source_rowid,
      ROW_NUMBER() OVER (
        PARTITION BY proposal_id, slot_id,
          CASE WHEN author_key = '' THEN lower(trim(author)) ELSE author_key END
        ORDER BY created DESC, rowid DESC
      ) AS duplicate_rank
    FROM votes
  ) WHERE duplicate_rank > 1
);--> statement-breakpoint
UPDATE votes SET author_key = lower(trim(author)) WHERE author_key = '';
