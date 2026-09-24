# Preservation of user data

This is a live shared site. Every update must preserve existing user progress and contributions.

- Never reset or replace production D1 data as part of setup, testing or publishing. Fixtures and cleanup must target localhost and exact disposable test identities only.
- Keep cookie building order and IDs, upgrade IDs, achievement IDs, avatar indices, author-key normalization and save keys compatible. Renaming UI labels must not rename stored identities.
- Existing purchased upgrades, permanent achievements, avatars, lifetime totals and prestige must survive balance changes and schema evolution. Do not rebuild an existing player with freshCookiePlayer.
- Keep D1 migrations additive when possible. Applied migrations are immutable. A destructive migration requires a private recoverable backup, a tested migration and restore procedure, and explicit user authorization.
- Before publishing game-persistence changes, save a private logical backup through scripts/backup-progress.mjs, run scripts/verify-cookie.mjs and verify compatibility with the preceding committed game model.
- Never commit backup data, real player saves, credentials, .env or local databases to the public repository. Backup output belongs to ignored .sites-runtime/backups.
- Keep action UUID receipts and retry queues compatible. A retry must not debit or credit a second time. Flush pending clicks on page hide and preserve unresolved actions for retry.
- Publishing updates the application; it must not clear its D1 bindings or recreate its Site project.

- For every publication, increment package.json version. The build stamps lib/site-release.json before compiling; include that exact metadata in the pushed source and artifact. The footer date is the release preparation time, not a live clock.
