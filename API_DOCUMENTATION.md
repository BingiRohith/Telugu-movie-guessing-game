# API documentation

Updated 2026-11-11. Static routes: /, /profile/, /review/, /rewards/. Account APIs require the same-origin Wrangler preview (http://127.0.0.1:8787). Responses containing account data use Cache-Control: no-store. A mismatched Origin is rejected with 403.

## Profiles

| Route | Contract |
|---|---|
| GET /api/profile | Signed-in profile or null |
| POST /api/profile | JSON { username, password }; creates a unique username account and sets a session cookie; no sign-in key is returned |
| POST /api/profile/session | JSON { username, password }; signs into the existing account |
| POST /api/profile/credentials | Signed-in legacy profile only: sets username/password on the same UUID, keeping wallet/progress and revoking other old sessions |
| PATCH /api/profile | Signed-in JSON { name, avatar }; edits display name/avatar without changing login username or wallet |
| DELETE /api/profile/session | Revokes the current session and clears its cookie |

Usernames use 3–20 ASCII letters/numbers/underscores and normalize to lowercase. Passwords use 10–128 characters (maximum 512 UTF-8 bytes), preserve case/spaces and are stored as salted PBKDF2-SHA256 records with 600,000 iterations; plaintext passwords never persist or appear in responses. The local workerd runtime passed integration tests at this work factor. Confirm hosted-runtime iteration/CPU limits before public deployment; do not silently weaken the work factor. Unknown users perform equivalent KDF work, and eight failed attempts per username in a 15-minute window result in HTTP 429. Old key-based HTTP login is rejected. There is no email/password-recovery flow in this revision.

Sessions last 30 days, with up to five active sessions per profile. Session secrets use SHA-256 digests. Cookies use HttpOnly, SameSite=Strict and Secure over HTTPS. Profile routes require JSON for mutations and reject bodies over 2,048 characters. No storage namespace or migration was replaced.

## Economy

GET /api/economy returns { profile, wallet, serverNow }. It requires a valid profile session and lazily initializes that account's welcome wallet once.

POST /api/economy accepts JSON (maximum 2,048 characters) with one action:

| type | Fields | Behavior |
|---|---|---|
| daily | None | Claims the current calendar reward once for today's IST date |
| mission | mission: correct-three / two-games / two-modes | Claims an eligible completed mission once per day |
| start | mode: music/dialogue/song, pace: normal/quick, requestId: UUIDv4 | Charges 10 coins and selects five questions atomically; retries reuse the same UUID |
| ready | gameId, round: 0–4 | Starts the server answer clock once; repeats return the same timestamp |
| answer | gameId, round, choice: 0–3 or null | Validates and locks the answer; scores using server time; answer five commits completion rewards |
| abandon | gameId | Ends an unfinished game with no entry refund or completion reward |
| purchase | pack: small/medium/large, requestId: UUIDv4 | Local simulator only: adds 100/300/750 coins once; no payment or provider call |

Mutation responses contain { profile, wallet, game?, serverNow }. Wallet includes revision, coins, XP/level, aggregate statistics, account trophy progress, current daily reward/next reset, mission eligibility, recent ledger, activeGame and testCheckout availability. Game answers and selected question IDs support reload/resume.

HTTP errors: 400 invalid action/choice/round/pack; 401 missing or expired session; 402 insufficient coins; 403 wrong origin or disabled checkout; 404 missing retained game; 409 unfinished-game conflict, out-of-order round, reused request ID or ineligible mission; 413 oversized body; 415 unsupported content type. No client-supplied point/coin/XP total affects rewards.

Test checkout requires TEST_CHECKOUT_ENABLED=true and a loopback request hostname. Production config sets false. The local dev script explicitly enables it. No endpoint accepts a client claim of a real successful payment. Real purchasing is unimplemented.
