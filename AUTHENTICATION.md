# Player accounts and profile handoff

Updated 2026-11-11, Asia/Kolkata. Replaces the prototype's private sign-in keys with username/password access.

## Player experience

Registration has exactly two inputs: username and password. Usernames contain 3–20 ASCII letters/numbers/underscores and normalize to lowercase. Passwords contain 10–128 characters (at most 512 UTF-8 bytes); case and spaces are preserved. There is no email or phone requirement. The user can toggle password visibility. Login uses the same two inputs and generic incorrect-credential feedback.

The profile overview shows a selected avatar, display name, @username, coins, points, completed games, accuracy, XP/level, per-mode game counts, reward streak and trophies. Edit profile changes only the display name and one of six avatars. Display names support Telugu. The login username stays fixed.

## Existing signed-in profiles

The profile page offers a one-time username/password setup for accounts without a username. The player must enter their own credentials. This updates the same profile UUID, keeps wallet/game/progress records, removes the legacy key hash and revokes other legacy sessions while retaining the current one. It does not issue another welcome bonus. Set this login before signing out. Old key-based HTTP login has been removed; signed-out legacy account recovery is not implemented.

## Implementation

- Profile and wallet records remain in the existing PROFILES Durable Object namespace; no destructive migration occurs.
- Username index objects use username:canonical-name and map each unique username to a stable profile UUID. Registration and claiming a name serialize through that index. A failed new registration can leave an unfunded orphan account if the index write fails; no issued session or wallet is transferred to another player. Migration reserves the index before updating the existing account so retries after restart can retain the correct owner.
- Passwords use Web Crypto PBKDF2-HMAC-SHA256, 600,000 iterations, a fresh 32-byte salt and 256-bit derived digest. Plaintext passwords are never stored or returned. Verification compares digests without an early-exit byte comparison. Unknown usernames perform equivalent KDF work.
- Eight failed attempts per canonical username in a 15-minute window throttle subsequent attempts. This is account-level throttling, not comprehensive protection against public credential attacks.
- Cookies remain HttpOnly, SameSite=Strict, Secure over HTTPS, with 30-day sessions and at most five active sessions. The stored session tokens are SHA-256 digests. Sign-out revokes only that session.
- Profile mutations require JSON and bounded request size; same-origin checks remain active. Profile/wallet responses are not cached. No passwords or generated credentials are placed in logs, screenshots or handoff documents.

## Verification and remaining limits

Nine unit tests, profile integration and economy integration pass. Browser QA uses a separately generated local account, verifying registration, failed and successful login, profile editing, reward preservation and a completed game reflected in profile statistics. A pre-existing legacy QA profile still showed its 120 coins, 500 points and two trophies with the setup form. Actual existing-user password setup is left to the user; no user credential was chosen or changed by the agent.

The tested local workerd runtime supports this password work factor. Before Cloudflare public deployment, verify hosted PBKDF2 iteration/CPU limits; do not silently lower the work factor. Cloudflare's upstream discussion documents a hosted default cap that can differ from local workerd. Password recovery, password changes, username changes, broad registration/IP abuse controls and production payment authentication review remain future work. No real payments or public deployment were added.

References checked during implementation: [Cloudflare Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Cloudflare workerd iteration-cap discussion](https://github.com/cloudflare/workerd/pull/7550).
