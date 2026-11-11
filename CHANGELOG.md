# Changelog

## 0.1.0 — 2026-11-10

- Started the Telugu-first site with game selection, Normal and Quick pace settings, and a five-round practice session.
- Added sample playback, original Telugu dialogue text, answer locking, feedback, score, and per-round results.
- Added scoring and fixture tests, static export, and handoff documents.
- Multiplayer, catalog clearance, accounts, wallet, leaderboard, and public deployment remain planned.

## Private-room playtest — 2026-11-10

- Added the private room page and a Cloudflare Worker with persistent two-seat rooms, server-owned timing, scoring, and reconnects.
- Added a two-client integration test and a separate fictional room catalog.
- Logged Telugu audio candidates and their remaining verification checks. Public deployment and production audio are pending.

## Player profiles — 2026-11-10

- Added local player profiles with private-key sign-in, revocable sessions, and display names in rooms.
- Added archival evidence for the Telugu audio shortlist. Demo audio remains in use while rights checks are open.

## Solo guessing and trophies — 2026-11-10

- Made solo guessing the main game and removed the private-room test and endpoints.
- Added a persistent points total, trophy case, and results notifications for new trophies.

## Telugu starter audio — 2026-11-10

- Replaced demo playback with 15 local MP3 clips across the three solo modes.
- Added text clues, Telugu dialogue transcripts, and clip credits after each answer.

## Modern cinema client review — 2026-11-11

- Replaced the active starter/archive catalog with 18 questions across 12 Telugu films spanning 2000–2026 and 16 official publisher video sources.
- Removed old sample assets from the export and disabled archive staging. Historical files remain outside public/.
- Added untimed listening before timed 20s/10s answers, source feedback and shuffled questions.
- Added a client guide/catalog with individual previews, Windows launcher, source metadata/channel checks and dated handoff instructions.
- Documented visible-video spoilers, publisher availability, and the remaining need for permitted standalone audio before a blind public game launch.

## Coins and daily engagement — 2026-11-11

- Added profile-linked coin wallets, a welcome bonus, seven-day daily rewards and claim streaks.
- Added three daily missions, XP levels, account-saved points/trophies and wallet activity.
- Added server-validated 10-coin games, once-only rewards and 24-hour pause/resume without another entry charge.
- Kept free practice available with zero cost and no wallet reward earnings.
- Added low-balance choices and clearly labelled test checkout for 100/300/750 review coins, with no real payment.
- Added concurrency integration checks, daily/XP rules tests, mobile review evidence and updated handoff documents.

## Animated hero disc — 2026-11-11

- Added smooth continuous rotation to the hero disc with a subtle moving sheen.
- Added eight softly blinking peach/lavender lights around the disc, with staggered timing.
- Kept the caption and shadow stationary and respected reduced-motion preferences.

## Username/password accounts and improved profiles — 2026-11-11

- Replaced private sign-in key registration/login with case-insensitive usernames and salted password authentication.
- Added a one-time login setup for existing signed-in profiles that preserves their account and wallet records.
- Added avatar/display-name customization and a profile dashboard with coins, points, accuracy, completed games, XP, per-mode counts and trophies.
- Added login throttling and updated account/economy integration checks, password tests and mobile QA evidence.
- Documented the migration, absent recovery flow and hosted-runtime hashing limits in AUTHENTICATION.md.
