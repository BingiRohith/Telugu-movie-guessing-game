# Storage

Updated 2026-11-11.

## ProfileAccount Durable Object

The existing v2 Wrangler migration binds PROFILES to the SQLite-backed ProfileAccount class. Each profile UUID has isolated storage. No new namespace or destructive migration was introduced.

| Key | Contents |
|---|---|
| account | Profile UUID, canonical username, display name, avatar, creation time when known, salted PBKDF2 password record, up to five SHA-256 session digests with expiry |
| username-owner (in username:canonical-name object) | Profile UUID associated with one globally unique, case-insensitive username |
| login-failures (in username object) | Failed-attempt count/window; eight failures in 15 minutes throttle further attempts |
| wallet:v1 | Schema version, monotonic revision, balance, XP, points, account trophy progress, completed-game/correct counts, daily calendar claims/streak, current IST-day missions, recent games and ledger |
| wallet-receipt:UUID | Serialized start or test-refill action, retained to deduplicate retries and reject reusing the ID for a different action |

Wallet initialization grants 100 welcome coins once inside a storage transaction. The wallet retains at most 12 detailed games and 40 visible coin entries; aggregate points, XP, trophies and completion counts are retained. Receipts persist independently of detailed game retention. Before a public launch, define an operational receipt-retention/archival policy that preserves retry safety.

Username/password setup keeps the existing profile UUID and wallet:v1 record. It changes only account credentials/profile fields and the separate username index. Legacy keyHash is removed on conversion, the current session is retained and other legacy sessions are revoked. No existing profile or wallet storage is deleted. Creating another account is separate from converting the signed-in legacy profile.

A game stores mode, pace, selected question IDs, accepted answers/points, original start time, current server readyAt timestamp, completed/abandoned flags and earned XP/coins. At most one unfinished game is allowed. It expires after 24 hours. Completion, coin bonuses, XP, points, trophy progress and daily mission progress commit atomically on answer five.

IST dates are derived from the server clock using UTC+05:30. Daily claims and mission claims are guarded by stored dates/claim IDs, independent of the browser clock. Concurrent claim/start/refill/answer tests verify once-only mutations. No raw payment data or card information is stored; purchases are simulated only.

## Legacy browser progress

IndexedDB database telugu-solo, store progress, key solo retains earlier local points, per-mode completion counts and perfect-game flag. It is separate from the account and is displayed for guests as earlier progress. New practice games do not earn wallet rewards and do not migrate these records. Browser storage failure does not prevent free practice.

The empty BattleRoom class preserves the historical v1 migration. No room routes or room data are exposed.
