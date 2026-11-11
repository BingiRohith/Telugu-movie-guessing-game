# Telugu Dialogue Battle

A Telugu-first solo quiz with Music, Dialogue and Song games. Each game has five rounds and a 20-second Normal or 10-second Quick answer timer. The current media review catalog uses 18 questions across 12 films spanning 2000–2026. Audio sourcing is pending user-supplied recordings; the current official publisher players remain available meanwhile.

Source repository: [BingiRohith/Telugu-movie-guessing-game](https://github.com/BingiRohith/Telugu-movie-guessing-game). Local credentials, account databases, generated builds and superseded media recordings are excluded from Git. A fresh checkout starts with no player accounts; register a username and password locally to review account features.

## Run the local client review

Requires Node.js 24+, npm and internet access for the existing YouTube players.

```powershell
npm ci
npm run review
```

Open http://127.0.0.1:8787/ and http://127.0.0.1:8787/rewards/. Keep the terminal open. If the preview is already running, reuse it; npm run build updates its assets. npm run dev:preview starts an existing build. Start Client Review.cmd is a Windows launcher. Next-only development (npm run dev) supports practice, but account APIs need Wrangler.

## Player flow

- Create an account at /profile/ with a username and password, then open the wallet for 100 welcome coins. Existing signed-in players can set their login once while keeping their current wallet and progress.
- Coin games cost 10 coins on start and earn account-linked points, trophies and XP. Free practice costs zero and earns no wallet rewards.
- Listen first, then start the answer timer. The visible video closes while answering. Coin-game answers and rewards are validated by the server; completion commits on answer five.
- Visit /rewards/ for the seven-day daily reward calendar, daily missions, wallet activity, XP level and test coin refills.
- Pause and resume an interrupted coin game for up to 24 hours without another charge. A started answer timer keeps running. Ending a game or letting it expire does not refund entry coins.

Coin-game rewards follow the profile across signed-in devices. Earlier browser-only progress remains separate and is not converted to coins or copied into the account.

The profile page includes editable display name/avatar, coin balance, points, accuracy, completed games, XP level, game-type breakdown and trophies. Usernames are case-insensitive and separate from the display name. Passwords require 10–128 characters; there is no email/phone requirement or password-recovery flow yet. Existing signed-in prototype players should set their username/password before signing out.

## Review purchases and limits

Refills are explicitly simulated: 100/300/750 review coins, ₹0 charged, no payment details. Production configuration disables test checkout. The local dev script enables it via --var TEST_CHECKOUT_ENABLED:true; the existing local server also uses ignored .dev.vars. Both the flag and a loopback hostname are required. No payment provider or real purchase flow is enabled.

Publisher video titles/images can reveal answers; media still requires internet and may be restricted by its publisher. A future blind audio-only quiz needs permitted standalone files. Source links and clues are available. This is a local client review, not a public deployment.

## Checks and handoff

```powershell
npm test
npm run typecheck
npm run build
npm run test:profile
npm run test:economy
```

Integration checks require the local Wrangler server and create separate test accounts. npm run check:sources checks publisher metadata separately.

Start with [client review instructions](CLIENT_REVIEW.md), [economy rules](ECONOMY.md), [project context](PROJECT_CONTEXT.md) and [dated progress](PROJECT_PROGRESS.md). Technical handoff: [architecture](ARCHITECTURE.md), [storage](DATABASE_SCHEMA.md), [API](API_DOCUMENTATION.md), [testing](TESTING.md), [roadmap](DEVELOPMENT_ROADMAP.md), [changelog](CHANGELOG.md), and [source register](AUDIO_CATALOG.md). Superseded media under legacy-content is excluded from exported assets.
