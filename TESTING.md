# Testing

Updated 2026-11-11.

## Automated checks

- npm test: nine tests covering score bands/deadlines, catalog selection, trophies, IST daily deduplication, missions, game rewards/costs, expiry, XP levels, and salted password hashing/verification.
- npm run typecheck: app/Worker TypeScript.
- npm run build: production static export, including /rewards/.
- npm run test:profile: concurrent username uniqueness, case-insensitive password login, old-key rejection, Telugu display-name/avatar editing, validation, wallet preservation, separate sessions, sign-out and login throttling.
- npm run test:economy: authenticated HTTP/DO integration. Verifies concurrent daily claims, test-refill retries and fixed server amounts, conflicting request IDs, concurrent start charges, answers from two sessions, score/XP/trophy completion once, mission claims, exhausted balance, daily refill and cross-origin rejection. Creates separate test accounts and revokes their sessions.
- npm run check:sources: publisher oEmbed metadata checks. This is separate from wallet tests and does not establish playback or standalone media rights.

Run the complete preview first: npm run build, then npm run dev:preview. Integration tests require localhost access and the local test-checkout flag. They do not charge money.

## Browser acceptance

Use localhost:8787 for separate QA account cookies and 127.0.0.1:8787 for the user's preview.

1. Guest can play free practice. Register a separate QA account with a username/password, without printing or screenshotting the password. Verify sign-out/login, edited display name/avatar, profile statistics and the 100-coin welcome balance. Existing user password setup must be performed by that user.
2. Start a coin game: balance decreases by 10. Pause, reload and resume; no second charge. A started answer timer must not reset.
3. Complete five correct Music answers: 500 points, 70 XP and +15 coins on the first completed perfect game that day. Account trophies unlock. Reload retains the state.
4. End repeated test games to reduce a QA balance below 10. Get more coins shows reward/refill choices. Free practice still starts and does not change the wallet.
5. Claim daily reward; it becomes disabled for today. Claim an eligible mission once; incomplete missions stay disabled.
6. Select a test pack, inspect confirmation, cancel without changing balance, then confirm a test refill and reload to verify exactly one credit. All checkout labels must make clear that no payment occurs.
7. At 390px width, check for horizontal overflow, seven readable calendar days, stacked missions and usable packs. Restore the normal viewport afterward.
8. Save review screenshots without exposing credentials. Detailed execution evidence is in PROJECT_PROGRESS.md.

Real payments, production fraud resistance, provider webhooks, purchase refunds, weekly challenges and private audio ingestion are outside this revision's validation.
