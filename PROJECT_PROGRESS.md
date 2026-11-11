# Project progress

All timestamps use India Standard Time (Asia/Kolkata, UTC+05:30). Append a record at the end of every work session with the actual date and time, milestone, files, verification, open issues, and next task. Update [the roadmap](DEVELOPMENT_ROADMAP.md) when a milestone changes state.

## 2026-11-10 21:42:56 +05:30 — Foundation and solo prototype verified

**Work started:** 2026-11-10 21:34:32 +05:30. The workspace was empty and had no Git repository. Bootstrapped Next.js, strict TypeScript, Tailwind CSS, and a static build. The local game now supports Music, Dialogue, and Song, both timer settings, answer locking, review, and five-round results.

**Files added:** app/ for the route and styling, components/battle.tsx for the practice flow, lib/ for rules, fixtures, and audio, tests/rules.test.ts for verification, and the package, TypeScript, Next.js, and Tailwind configuration. The README indexes the handoff documents.

**Checks:** npm test passed both tests, npm run typecheck passed, and npm run build generated the static export. The scoring tests found a floating-point edge case at the first speed boundary. The implementation now compares elapsed milliseconds directly against each cutoff. Browser checks covered a full five-round Music session, correct and incorrect answers, answer locking, replay, Normal and Quick durations, Dialogue timeout and Telugu text fallback, Song demo playback controls, and the narrow home layout with no horizontal overflow. The browser did not have a Telugu speech voice, so synthesized Telugu playback still needs a device with that voice.

**Open work:** The 15 practice questions use fictional credits. Music and Song use synthesized tones, and Song still needs a cleared vocal recording. Real multiplayer, verified content, user accounts, wallet, leaderboard, and deployment are pending. No paid services were used.

**Next:** Research at least one clip with permission and verified credits for each game. In parallel, design a private-room WebSocket spike and a two-client test for timing, reconnects, and duplicate answers.

## 2026-11-10 22:00:03 +05:30 — Private-room playtest verified and Telugu sources shortlisted

**Work started:** 2026-11-10 21:48:15 +05:30. Added a local Cloudflare Worker and SQLite-backed Durable Object for private two-player rooms. Both players select Ready. The server controls the countdown, rejects invalid submissions, and reveals results once both players answer or the deadline passes. The host advances from each review. Temporary seat tokens restore an existing player on reconnect.

**Files added or updated:** app/room/page.tsx, components/private-room.tsx, components/battle.tsx, app/globals.css, lib/room-protocol.ts, lib/audio.ts, worker/index.ts, worker/room-state.ts, worker/demo-catalog.ts, wrangler.jsonc, tests/private-room.integration.mjs, package.json, package-lock.json, .gitignore, and the handoff documents. See [Audio catalog research](AUDIO_CATALOG.md) for the Telugu shortlist.

**Checks:** npm test passed both unit tests. The five-round Worker integration test passed twice, including shared deadlines, timeout, early/late and duplicate rejection, third-seat rejection, both players reconnecting with preserved state, and a matching 500–0 result. Two in-app browser tabs also created and joined a Quick room and saw the same question, 10-second timer, and answer reveal. Production export and its TypeScript check passed with Webpack. Turbopack's CSS subprocess failed on later Windows rebuilds, so the standard build script now uses the verified Webpack path.

**Open work:** Local rooms are for playtesting and use fictional clips and temporary seats. The Telugu sources are research leads, with zero approved clips. Accounts, room creation rate limits, wallet, public deployment, and matchmaking remain pending. No payments or creator messages were sent.

**Next:** Review the specific Telugu excerpts and rights evidence in the catalog register. Add a small verified catalog and accounts before opening the friends-only beta.

## 2026-11-10 22:03:56 +05:30 — Restored local preview

The preview server had stopped and port 8787 had no listener. Restarted Wrangler in a background process bound to 127.0.0.1 and verified HTTP 200 for the home and private-room pages. Use port 8787 for both pages. Runtime logs are under the ignored .wrangler directory.

## 2026-11-10 22:16:58 +05:30 — Player profiles verified and Telugu credits reviewed

**Work started:** 2026-11-10 22:12:07 +05:30. Added local player profiles with generated private sign-in keys, 30-day sessions, and server-verified display names in rooms. Guest rooms remain available. Wrangler storage migration v2 creates the profile namespace without changing the room namespace.

**Files:** app/profile/page.tsx, components/profile-page.tsx, lib/profile.ts, worker/profiles.ts, the room transport and UI, Wrangler configuration, package scripts, tests/profile.integration.mjs, and the handoff documents.

**Checks:** The profile integration test passed against the running local Worker. It verified Telugu names, sign-in from a second session, invalid-key rejection, the room display name, and revocation of only the active session. The existing five-round room test and unit tests passed. TypeScript and the production export passed. The profile screen was verified in the browser.

**Audio:** Identified a specific Rajman Telugu release to ask about. Confirmed the archive's film writers for Malapilla and found the original Palletooru song booklet, which shows multiple singers. No clips cleared the rights check, so the game still uses demos. No payment or outreach occurred.

**Next:** Clear the Telugu excerpts or obtain no-fee permission for replacements. Add room and signup limits, decide on account recovery, and prepare the friends-only beta for deployment.

## 2026-11-10 22:54:56 +05:30 — Switched the preview to solo guessing and trophies

**Work started:** 2026-11-10 22:50:37 +05:30. Removed the private-room page, UI, routes, room logic, and room test script. The old Durable Object migration class stays registered as an empty placeholder. The optional profile still works. Solo players now earn cumulative points and unlock First Show, Perfect Guess, Triple Feature, and Cinema Club. Opening results after round five records the game once. Browser storage persists progress for that address and browser.

**Files:** components/battle.tsx, components/trophy-case.tsx, components/profile-page.tsx, app/globals.css, lib/solo-rewards.ts, lib/progress-store.ts, worker/index.ts, package.json, test scripts, and the handoff documents.

**Checks:** Three unit tests, profile integration, TypeScript, and production build passed. Cleared generated Next.js development types that still referenced the deleted room. The browser test earned 500 points and two trophies, confirmed they survived reload, and confirmed exiting a partial game left the total at 500. The separate test address kept the user's normal preview progress untouched. Both old room URLs returned 404. The main preview loaded on port 8787.

**Next:** Continue Telugu clip clearance and expand the solo question catalog. Current games still use demo audio.

## 2026-11-10 23:02:08 +05:30 — Added Telugu starter audio to all three solo modes

**Work started:** 2026-11-10 22:56:14 +05:30. Replaced browser demo tones and system-voice playback with 15 bundled MP3s. Music has one licensed Carnatic performance and four original instrumentals. Song has five CC0 Telugu folk recordings. Dialogue has five original Telugu scenes rendered offline. Current questions ask for tune or folk-song titles and original scene titles. Tollywood clips still need clearance.

**Files:** lib/questions.ts, lib/audio.ts, components/battle.tsx, app/globals.css, public/audio, scripts/generate-starter-audio.mjs, tests/rules.test.ts, and handoff docs. Source credits, clip timings, and licenses are in [the audio register](AUDIO_CATALOG.md).

**Checks:** Three automated tests and the production build passed. FFmpeg decoded all clips and the export contains all 15 MP3s. Browser checks exercised playback for Music, Song, and Dialogue, confirmed the timer continued during playback, and verified the Telugu transcript and recording credits. The updated home page is available on port 8787. No paid tools or services were used.

## 2026-11-11 18:04 +05:30 — Replaced samples with a modern cinema client review

**Reason:** The user rejected temporary recordings and very old films, requesting famous Telugu film music, songs and dialogues from 2000–2026. The earlier starter/archive direction did not satisfy that brief.

**Delivered:** 18 questions across 12 films spanning Badri (2000) through Peddi (2026), with 16 unique official label/studio videos. Music uses film scores/themes, Dialogue uses actual trailers, a released scene and narration, and Song asks film/singer/composer questions. Five distinct questions are shuffled into a session. Superseded public/audio and local-cinema assets and generation/staging scripts moved to legacy-content; the production export contains no old audio directory and build:preview no longer stages archive clips.

**Review setup:** Added /review/ with instructions, catalog, source links and on-demand media previews; CLIENT_REVIEW.md; a Windows launcher; npm run review; and an oEmbed channel-validation script/report. Updated the current rulebook, README, architecture, source register, roadmap and testing guide. Preserved historical entries. Screenshot: docs/review/client-review-home.png.

**Playback/rules:** Uses visible official YouTube embeds without extracting or rehosting recordings. Listening is untimed, then the player explicitly starts the 20s/10s answer clock and the iframe unmounts. Source titles/images can reveal answers; this limitation is disclosed in the game and review guide. Correct answers, rather than watching videos, earn points. A blind audio-only public game still needs permitted standalone excerpts. No paid service, public deployment or external communication occurred.

**Checks:** All three unit tests, TypeScript and the final Webpack production export passed. All 16 unique sources returned oEmbed metadata from their expected publishers (SOURCE_CHECK.json); this does not establish playback everywhere. Browser QA confirmed advancing Kalki and Peddi playback, dialogue scene player loading, five correct Music rounds for 500 points, reward persistence after reload, no duplicate reward on return, zero-point locked Quick timeout, incorrect-answer feedback, and no saved rewards for partial games. At a 390px viewport the home page had no horizontal overflow and the game iframe measured approximately 279 × 200px. Mode/pace controls now stay disabled until hydration/storage initialization completes to prevent lost early selections.

**Handoff:** The running local review is http://127.0.0.1:8787/; the source catalog and guide are at /review/. These are local-machine URLs. Before an external client session, recheck source playback in that browser/region. Next decisions are client feedback on visible-video review, permitted isolated dialogue/audio excerpts, catalog expansion, and public hosting.

## 2026-11-11 19:58 +05:30 — Built account coins, daily rewards, missions and test refills

**Work started:** 2026-11-11 19:30 +05:30. The user deferred audio sourcing and authorized building the proposed first engagement stage: account wallet, daily calendar, missions, low-balance choices and simulated purchases. Current publisher media remains in place until user-supplied recordings arrive.

**Delivered:** Account-linked wallet with 100 welcome coins once; 10-coin game entries; seven calendar rewards (10/15/15/20/20/25/30); consecutive daily claim streak; three daily missions; first-game/perfect-game bonuses; XP and levels; profile-saved points and four trophies; wallet activity; 24-hour coin-game pause/resume; safe answer-save retry; free practice without wallet costs or earnings. Added /rewards/, home wallet summary, low-balance recovery choices and a confirmation/cancellation flow for 100/300/750-coin test refills. The direct free-practice link opens a listening round automatically.

**Server behavior:** Extended the existing ProfileAccount Durable Object without changing migrations or profile keys. Wallet state, claims, server-selected question order, answer timestamps, scoring, completion rewards and mission progress commit transactionally. Start/refill UUID receipts, per-round answer records and IST-date claim records prevent duplicates. Monotonic wallet revisions stop older client responses from overwriting newer balances. Completed/abandoned game detail is bounded to 12 entries; ledger to 40. Entry/refill receipts persist independently. Coin-game rewards commit on answer five, while earlier browser-only progress stays separate.

**Checkout scope:** Simulator only, explicitly labelled ₹0/no payment. No real provider, payment details, charge, cash-out or real purchase exists. Default wrangler.jsonc flag is false. The local preview script passes TEST_CHECKOUT_ENABLED:true and the existing development environment has an ignored .dev.vars override. The API additionally requires a loopback hostname. Added .dev.vars* to .gitignore. No public deployment or external communication occurred.

**Checks:** Eight unit tests passed, including IST midnight/missed-day calendar behavior, once-only completion and claims, costs, expiry, deadlines, XP level advancement and disabled checkout. TypeScript and final production export passed for /, /profile/, /review/, /rewards/. Profile integration passed. Economy HTTP integration passed concurrent daily claims, refill retries/fixed pack amounts, duplicate starts, cross-session game answers, once-only rewards/missions, zero balance, daily refill, and cross-origin rejection. A second pass after wallet revision handling also passed.

**Browser evidence:** A separate localhost QA profile received 100 coins. Starting a game charged 10; pause/reload/resume kept the balance at 90. Five correct answers yielded 500 points, +15 coins, +70 XP and First Show/Perfect Guess trophies. Ten explicitly ended QA games reduced that account to 5 coins, exposing the refill screen; free practice still worked without a charge. Daily +10 and a completed mission +5 restored 20; one confirmed test refill added 100 to reach 120. Reload retained 120, and cancelling a 300-coin test refill did not change it. At 390px width, the rewards page measured 375px content width with seven calendar cards and no horizontal overflow. Reset the viewport afterward. Saved docs/review/rewards-preview.png without exposing private keys.

**Preview setup:** Restarted only this project's older Wrangler process after its earlier launch settings kept test checkout disabled. Stored profiles remained intact. The updated hidden preview parent process is 17676, with logs in .wrangler/rewards-preview.stdout.log and .stderr.log. Static export watching reported an EPERM warning; manual reload after rebuild works and was used for browser verification.

**Documentation:** Added ECONOMY.md and updated README, current context, architecture, storage/API contracts, testing, roadmap, client instructions, in-app review guide and changelog. Historical entries remain intact. Remaining work: user audio ingestion, difficulty/era filters, shared daily challenge, friend/weekly/cosmetic features, and provider-backed real payments if requested later.

## 2026-11-11 20:09 +05:30 — Animated the hero disc and decorative lights

**Started:** 20:06 +05:30. Added an 18-second continuous CSS rotation, a subtle reflective sheen and eight staggered peach/lavender lights around the disc. The caption and drop shadow stay stationary. Reduced-motion preferences disable rotation and blinking. Decorative elements stay hidden from screen readers.

**Files:** components/battle.tsx, app/globals.css, a clarifying Wrangler config comment, and dated documentation. Production build and TypeScript passed. Browser inspection confirmed the disc-spin animation and varying transforms/light opacity. Refreshing the Wrangler configuration rebuilt its asset manifest after the Windows output watcher missed new hashed files; the preview then loaded its styles correctly. No gameplay or wallet rules changed.

## 2026-11-11 20:29 +05:30 — Replaced key login and expanded player profiles

**Started:** 20:13 +05:30. The user requested username/password login instead of private sign-in keys and a better player profile.

**Delivered:** Registration and login use exactly username/password, with no email/phone requirement. Usernames normalize to lowercase and are unique across the existing profile namespace. Added salted PBKDF2 password records, generic failed-login feedback, show/hide password controls, per-username failed-login throttling and bounded JSON inputs. Removed old-key HTTP login and new-key generation. Sessions retain the existing cookie scheme and current profile UUIDs.

**Profile experience:** Added avatar/identity header, editable display name and six avatars, coins/points/completed-game/accuracy cards, XP/level meter, per-mode game breakdown, reward streak, trophy case and links to games/rewards. Registration remains two fields; customization happens afterward. Both overview and edit screens work at 390px without horizontal overflow.

**Existing users:** A signed-in prototype profile gets a one-time username/password setup form. Its credential update uses the same profile UUID and leaves wallet/progress untouched. It removes the legacy key hash and retains only the current legacy session. The user must choose their own password; no actual user credential was entered or changed by the agent. Browser QA confirmed a pre-existing localhost test profile still displayed 120 coins, 500 points and two trophies with this setup form. Signed-out legacy recovery and password reset/change are not implemented.

**Checks:** Nine unit tests passed, including salt uniqueness, password case/space handling and password verification. Updated profile HTTP integration passed concurrent username uniqueness, case-insensitive login, old-key rejection, Telugu display-name/avatar changes, wallet preservation across sessions, sign-out and throttling after eight failures. Economy HTTP integration passed using new password accounts. TypeScript and final static export passed. Browser QA registered a separate generated account, edited its name/avatar, verified incorrect-password feedback and successful uppercase-username login, then completed a game. The profile showed 105 coins, 500 points, 70 XP, one game, 100% accuracy and two trophies with the saved avatar/name. Screenshot: docs/review/player-profile.png. No passwords were printed or included in screenshots.

**Runtime and preview:** The local runtime passed PBKDF2-SHA256 at 600,000 iterations with a fresh 32-byte salt. Hosted Cloudflare iteration/CPU limits require verification before deployment; no automatic downgrade was added. Refreshed the local Wrangler asset manifest after builds to work around the known Windows output-watcher warning. Existing namespace/migrations and wallet data were preserved. No paid service, public deployment or external message was introduced.

**Documentation:** Added AUTHENTICATION.md with the credential/migration design, primary references, known recovery/hosting limits and tests. Updated README, current context, architecture, storage/API contracts, testing, roadmap, in-app review instructions, client review and changelog.

## 2026-11-11 20:34 +05:30 — Prepared GitHub source handoff

Initialized this workspace's Git repository on main and configured origin as https://github.com/BingiRohith/Telugu-movie-guessing-game.git after confirming the destination had no existing branches or tags. Prepared the complete app, tests, setup instructions, dated documentation and review screenshots for the first source commit. Added line-ending rules for cross-platform checkouts.

Confirmed local development overrides, profile/account databases, node_modules, generated builds, runtime logs and superseded binary audio are excluded. Legacy text/scripts remain only as clearly marked historical context; the omitted recordings are not needed to build or run the project. No player passwords, private sign-in credentials or account database records are included. Nine unit tests and a fresh production build passed before preparing the source handoff. This is a source-code publication; no website or payment service is deployed by this step.
