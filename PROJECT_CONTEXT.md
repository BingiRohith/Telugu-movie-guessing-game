# Project context and rulebook

Updated 2026-11-11, Asia/Kolkata. Telugu Dialogue Battle is a Telugu-first solo cinema quiz. The user requested a zero-cost implementation, deferred audio sourcing and plans to provide Music, Songs and Dialogues later. Current official publisher media stays in place during feature development. No multiplayer is active.

## Game rules

Music asks film/composer questions from scores/themes; Dialogue asks for the film from actual publisher scenes/trailers/narration; Song asks for film/singer/composer. The review catalog has 18 questions across 12 films spanning 2000–2026. Five distinct questions are shuffled into a session. There are no active generated/folk/archive sample fallbacks.

Listening is untimed. Starting the answer timer closes the player and allows Normal 20s or Quick 10s to answer. Correct answers in the first/middle/final thirds earn 100/80/60 points. Incorrect and deadline-or-later answers earn zero. Answers lock once submitted. Coin-game timing, answers and reward totals are validated on the server.

## Engagement and coins

Accounts now register/sign in using only username and password. Usernames are case-insensitive; display names and avatars can be edited separately. The profile dashboard shows coins, points, completed games, accuracy, XP level, per-mode completion counts, reward streak and trophies. Existing signed-in players set their new login once on the same profile so their wallet/progress stays intact. No password recovery or email/phone sign-in is implemented.

- Profiles receive 100 welcome coins once. A five-round coin game costs 10 coins on start.
- Daily calendar rewards: 10, 15, 15, 20, 20, 25, 30 coins; one claim per date at midnight IST. Missed days retain calendar position and collected rewards. The displayed consecutive-claim streak starts over after a missed date.
- First completed coin game each day earns 10 coins; a perfect game earns another 5. Completion earns 20 XP plus 10 XP per correct answer. Every 250 XP advances a level.
- Three daily missions award 5 coins for 3 correct answers, 10 for completing 2 games, and 10 for completing 2 modes. Progress commits on game completion; claims are explicit and once per mission per day.
- Free practice remains playable without an account or coins and earns no wallet rewards. Practice scores are informational.
- Four account trophies: First Show (completion), Perfect Guess (5/5), Triple Feature (all three modes) and Cinema Club (1,000 points).
- Completed coin-game rewards save on answer five, even before results opens. They follow the profile across signed-in devices. Legacy browser points are not migrated.
- Interrupted coin games can resume for up to 24 hours without another charge. A started timer continues running. Ending early or expiring keeps the entry charge and earns no completion rewards.

## Scope

Coin refills simulate purchases for local review only: 100/300/750 coins, no real payment. See ECONOMY.md. No real purchasing, leaderboard, friend challenge, cosmetics, weekly challenge or comeback reward is implemented in this stage.

Visible publisher titles/images may reveal answers. The current catalog is a listening review, not a blind competitive game; answers are bundled with the review app and there is no anti-cheat guarantee. Do not extract/rehost publisher media without permitted standalone clips. Points/coins are game credits and are not cash or redeemable prizes.
