# Client review — Telugu Dialogue Battle

Updated 2026-11-11, Asia/Kolkata. This is the current handoff entry point. Earlier progress entries describe superseded prototypes.

## Open locally

- Game: http://127.0.0.1:8787/
- Rewards, missions and test refills: http://127.0.0.1:8787/rewards/
- Review instructions and media catalog: http://127.0.0.1:8787/review/
- Profile creation/sign-in: http://127.0.0.1:8787/profile/

These URLs work on this computer while the preview runs. They are not externally shared hosting links. Node.js 24+ is required: npm ci, then npm run review. The Windows launcher is Start Client Review.cmd. Reuse an existing preview; npm run build updates its assets. npm run dev:preview starts an existing build. Keep its terminal open. The local dev script enables simulated checkout; default production config disables it.

## Five-minute rewards review

1. Register with a username and password. Existing signed-in players can set those credentials once on /profile/ while preserving their current account. Open the wallet for 100 welcome coins on a new account. Never include passwords in screenshots or messages.
2. Claim today's reward. It can be claimed once and the next calendar day is highlighted. Resets use midnight IST.
3. Choose Music, Dialogue or Song and start a 10-coin game. Listen, start the 20s/10s answer timer, and answer five questions. Coins are spent at entry; correct answers earn points, completion earns XP and may earn bonus coins/trophies.
4. Pause and resume a game without another entry charge. A timer that already started keeps running. End game explicitly only when willing to forfeit the entry cost; unfinished games expire after 24 hours.
5. Open /rewards/ to claim earned missions. Inspect your level, wallet activity and seven-day calendar.
6. Select a 100/300/750 test pack, inspect its confirmation and cancel. Then try confirming once and reload. It adds review coins with ₹0 charged, no payment details and no real purchase.
7. When coins are below 10, choose available rewards/refills or use free practice. Practice has no wallet charges or reward earnings.

## Economy rules

See ECONOMY.md for the complete table. First completed coin game of the IST day: +10 coins; perfect game: +5; completion: 20 XP plus 10 per correct answer. Daily missions reward 3 correct answers (+5), two completed games (+10) and two completed modes (+10). Progress commits on completed games. Four trophies derive from account game progress. Coin-game rewards follow the signed-in profile; earlier browser-only scores remain separate.

## Media and remaining scope

The current review contains 18 questions / 12 films / 16 official publisher videos spanning Badri (2000) to Peddi (2026). The user plans to provide audio later. Existing publisher players require internet and can show titles/images that reveal answers. Dialogue uses actual trailers/scenes/narration rather than isolated audio. Source links and text clues support blocked playback. Source metadata checks are not playback guarantees or extraction rights.

No real payment provider, public leaderboard, multiplayer, friend challenge, weekly/comeback reward or cosmetics is included in this stage. The local simulator is not a real purchase system. The review catalog exposes answers in the bundled app and is not designed as a secure competitive quiz.

## Validation evidence

Nine unit tests, TypeScript and the production export pass. Updated profile integration verifies username uniqueness, password login, avatar/name editing, wallet preservation, session sign-out and login throttling. Economy integration still passes with password accounts. Browser QA additionally verified two-field registration, incorrect-password feedback, case-insensitive login, saved avatar/name and populated game statistics. Both profile overview and avatar editing fit a 390px viewport without horizontal overflow. Profile screenshot: docs/review/player-profile.png.

Earlier economy browser QA verified entry/pause/reload/resume without duplicate charging, 500-point perfect completion with +15 coins/+70 XP, insufficient-coin choices, free practice, daily/mission claims, test checkout confirmation/cancellation and persistent refill balance. Rewards screenshot: docs/review/rewards-preview.png. Full dated evidence is in PROJECT_PROGRESS.md.

## Handoff map

PROJECT_CONTEXT.md: rules. ECONOMY.md: reward numbers. ARCHITECTURE.md: code map. DATABASE_SCHEMA.md/API_DOCUMENTATION.md: persistence and contracts. TESTING.md: repeatable checks. PROJECT_PROGRESS.md/CHANGELOG.md: dated work. DEVELOPMENT_ROADMAP.md: remaining features. AUDIO_CATALOG.md/SOURCE_CHECK.json: publisher register. Superseded sample assets remain outside the export in legacy-content.
