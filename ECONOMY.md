# Coins, XP and daily engagement

Implemented 2026-11-11, Asia/Kolkata. All numbers are review defaults, not real-money pricing.

| Action | Coins | XP / progress |
|---|---:|---|
| First wallet initialization for a profile | +100 once | None |
| Start a five-round coin game | −10 | Rewards require completion |
| First completed coin game each IST date | +10 | Completion counted once |
| Perfect completed coin game | +5 | Perfect Guess trophy eligibility |
| Complete a coin game | As above | 20 XP + 10 per correct answer; server-scored points |
| Daily calendar claims 1–7 | +10 / 15 / 15 / 20 / 20 / 25 / 30 | Consecutive-claim streak |
| Sharp ears daily mission | +5 | 3 correct answers in completed coin games |
| Double feature daily mission | +10 | 2 completed coin games |
| Explore Telugu cinema daily mission | +10 | Completed coin games in 2 modes |
| Free practice | 0 | Informational score only; no wallet/XP/trophy earnings |
| Test refill small / medium / large | +100 / 300 / 750 | ₹0 charged; simulated purchase only |

Every 250 XP advances a level. Points, XP and coins are separate: points measure quiz performance, XP measures progression, and coins fund entries. Coins are not cash and cannot be redeemed or transferred. No prize, cash-out or real-money transaction exists.

## Daily behavior

The server uses midnight IST (UTC+05:30), never browser dates, to gate daily claims and reset missions. A daily claim advances one position in the calendar, cycling after seven claims. Missing days keeps collected coins and the next calendar position, but starts a new consecutive-day claim streak. The first-game bonus applies to the date the game completes. Mission progress updates atomically when a game completes, then the player explicitly claims eligible rewards once.

## Entry, interruption and retries

A start request spends coins once with a UUIDv4 request ID. Only one unfinished coin game is allowed. Resume restores the same question order, answers and original timer without another charge. A started timer continues while the page is closed; expired answers score zero. The whole unfinished game expires after 24 hours. Ending early or expiry does not refund entry coins and awards no completion bonuses or mission progress.

The profile Durable Object owns the authoritative balance, server timestamps, correct-answer checks, score, XP and trophy progress. Storage transactions and receipts guard duplicate starts/refills; game ID/round guards duplicate answers; dates/mission claim IDs guard reward claims. Coin-game rewards save on the fifth answer, before the results screen. A server revision prevents stale wallet responses from replacing newer client state. Failed answer saving exposes a safe retry control.

At a balance below 10, the UI offers rewards/refills and free practice. It never requires a purchase to continue practicing. Welcome coins are once per profile, not per sign-in, browser or reload. Earlier browser points are separate and never converted into wallet credits.

## Checkout boundary

The review simulates buying a pack, showing a confirmation with the coin amount and ₹0 charge. Cancel grants nothing. Confirm grants the server-defined pack once, using a retry-safe request ID. No payment details, provider requests or real charges occur. TEST_CHECKOUT_ENABLED defaults to false in wrangler.jsonc. Local dev explicitly enables it and the API additionally requires a loopback hostname. The ignored .dev.vars supports the existing local server only.

Before real purchases, implement a provider-backed order ledger and verified server payment notifications, distinguish test and paid balances, and handle pending/failed/refunded orders. Do not credit a real purchase from browser assertions or enable this simulator on a public host. Catalog answers are exposed in this review app; server reward validation is not an anti-cheat guarantee. Public account creation limits/recovery and operational receipt retention also remain future work.
