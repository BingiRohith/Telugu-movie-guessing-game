# Architecture

Updated 2026-11-11. Next.js App Router statically exports the game, rewards page, review guide/catalog and profile. Wrangler serves assets plus same-origin profile/economy APIs. Webpack remains the production build path on this Windows workspace.

| Location | Responsibility |
|---|---|
| components/battle.tsx | Practice and coin game flow: setup → listening → timed question → review → results; pause/resume and low-balance choices |
| lib/economy.ts | Economy types and rules, IST dates, daily calendar, missions, game validation/scoring, XP, progress and wallet views |
| worker/profiles.ts | Profile sessions and per-account transactional economy storage/RPC; permanent request receipts for entry/refill deduplication |
| worker/index.ts | Origin checks, routes, local-only test checkout gate; old empty BattleRoom migration class |
| lib/use-wallet.ts | Account wallet client, API requests, revision-aware response merging, focus refresh |
| components/wallet-panel.tsx, components/rewards-page.tsx, app/rewards/page.tsx | Balance/level summary, rewards, missions, checkout confirmation, ledger and free practice |
| lib/questions.ts, lib/rules.ts | Media catalog, random question selection and score bands |
| lib/solo-rewards.ts, components/trophy-case.tsx | Trophy rules and display; server account progress for coin games |
| lib/progress-store.ts | Legacy IndexedDB progress, displayed separately; no new practice wallet earnings |
| lib/password.ts, lib/profile.ts | Salted password hashing/verification, username/display-name validation and avatar definitions |
| components/profile-page.tsx | Username/password registration/login, legacy-session setup, profile overview and display-name/avatar editing |
| app/review/page.tsx, components/source-preview.tsx | Review instructions and publisher previews |

Each profile UUID owns a SQLite-backed Durable Object. Profile credentials and sessions stay under the existing account key; economy data uses wallet:v1. Existing profiles initialize the welcome wallet lazily and atomically. GET/POST wallet operations run in storage transactions. Start/refill UUID receipts prevent retry duplication; duplicate answers/ready calls use game ID and round. The server selects question order, owns readyAt timestamps, calculates scores and commits rewards on answer five. It accepts no client-provided coin, score or XP totals. Missions use completed games only.

Wallet revisions increase on successful transactions, and the client rejects older responses for the same account. The game locks while saving; a failed answer can be retried with its original round. Reload exposes the unfinished game without a new entry charge. Completed and abandoned game details are bounded to 12 records, and the visible ledger to 40 entries. Receipts remain separate so pruning game history never permits an old start request to charge again.

The same PROFILES namespace also stores username index objects under username:canonical-name. Each index serializes registration/login for that name, points to the stable profile UUID and stores login throttling state. New accounts use only username/password credentials. Existing signed-in prototype profiles can claim a username and set a password without changing UUID or wallet keys; conversion removes the old key digest and revokes other legacy sessions. Old key-based HTTP login is disabled. See AUTHENTICATION.md for storage, recovery limits and deployment considerations.

The visible media iframe exists only during listening and unmounts for answering. Coin rewards are independent of watching videos. Practice is entirely free and has no economy writes. There are no paid APIs or extracted film recordings. A clean audio catalog and public launch are separate remaining tasks.

Test checkout is disabled by default and requires both an explicit local dev flag and a loopback request hostname. It is a simulator, with no provider, payment credentials or real charges. Preserve this default when preparing a public environment. Real purchases would require provider-verified payment events and a separate order ledger; never turn the simulator into a real credit endpoint.
