# WatchPay

Pay-per-30-seconds video watching on Unicity Sphere testnet2. Viewers buy WP points with real UCT, watch videos, and get billed silently in the background. An autonomous agent settles real on-chain payouts to creators twice a day — no wallet popups after the initial buy.

**Track:** Payments & Markets
**Network:** Unicity Sphere testnet2 (network ID 4)
**Live app:** https://watchpay.vercel.app
**Not using AstridOS.**

---

## How it works

**1. Buy WP**
The viewer sends real UCT from their own Sphere wallet to the app's agent wallet (`@watchpay`) via the Sphere Connect `send` intent. Once the transfer is detected on-chain, the backend credits the viewer 1:1 in WP points. WP points live in Supabase (`wp_points`) — they are not a token, just an internal ledger balance backed by real UCT held in `@watchpay`.

**2. Watch & Tick**
While a video plays, a tick fires every 30 seconds. Each tick deducts the video's rate from the viewer's WP balance and adds the same amount to that creator's pending payout total (`pending_settlements`). This is pure database bookkeeping — no blockchain transaction happens per tick, which is what makes silent, popup-free billing possible.

**3. Agent Settles**
Twice daily (00:00 and 12:00 UTC), a QStash-scheduled job calls `/api/agent-settle`. It reads every creator with a pending balance of at least 5 UCT, sends them real UCT directly from `@watchpay` via `sphere.payments.send()`, and logs the transaction (with real `tx_id`) to the `settlements` and `agent_log` tables. This is the fully autonomous part — no user or admin ever triggers it manually.

**4. Sell WP**
A viewer (or a creator holding leftover WP) can convert WP back to real UCT at any time. The backend sends real UCT from `@watchpay` straight to the user's real Sphere wallet.

---

## Agentic confirmation

Yes — this project is agentic. The settlement job (`/api/agent-settle`) runs on a fixed QStash schedule with no human in the loop. It independently decides which creators are owed money, signs and broadcasts real transactions, and writes a public, timestamped audit log of everything it does (visible in-app under the **Agent** tab). Every entry in that log corresponds to a real `tx_id` on Unicity Sphere testnet2, verifiable on-chain.

---

## Wallet architecture disclosure

WatchPay does **not** create a custodial wallet per user. Instead, it uses a single pooled agent wallet (`@watchpay`) that holds all real UCT:

- **Deposit (Buy WP):** user's real Sphere wallet → `@watchpay` (real on-chain transfer, user-signed).
- **Watching:** pure ledger math against the user's WP balance in Supabase — no chain interaction.
- **Withdraw (Sell WP) / Creator payout:** `@watchpay` → user's real Sphere wallet (real on-chain transfer, signed server-side using the agent wallet's mnemonic, stored only in Vercel environment variables).

This is an intentional design decision, not a workaround: real UCT only ever moves twice per user lifecycle (once in, once out), which is both simpler and cheaper than minting or managing a wallet per user, while remaining fully transparent — anyone can verify `@watchpay`'s on-chain balance always covers total outstanding WP liabilities.

---

## Tech stack

- **Frontend:** React + Vite, Tailwind, Framer Motion
- **Backend:** Vercel serverless functions (Node/TypeScript)
- **Database:** Supabase Postgres
- **Blockchain SDK:** `@unicitylabs/sphere-sdk` (wallet-api custody mode, since Vercel's serverless filesystem is ephemeral and cannot persist local wallet state between invocations)
- **Scheduler:** Upstash QStash (cron: `0 0,12 * * *`)
- **Network:** Unicity Sphere testnet2

UCT coin ID (hardcoded, verified):
`f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0`

---

## Running it locally

```bash
npm install
```

Create `.env.local` with:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AGENT_WALLET_MNEMONIC=
AGENT_SECRET=
```

```bash
npm run dev
```

Get testnet UCT from the official faucet: https://faucet.unicity.network/faucet/ — no balances are ever fabricated; every number shown in the app is either a real on-chain value or a real Supabase row written by a real action.

---

## Database schema (Supabase)

- `wp_points` — viewer WP balances, keyed by chain pubkey
- `wp_deposits_seen` — dedup table so a single on-chain transfer is never credited twice
- `videos` — uploaded video metadata (title, url, rate, category, creator)
- `watch_sessions` — one row per watch session, closed on player exit
- `video_earnings` — running per-video earnings total, for the creator's per-video breakdown view
- `pending_settlements` — running total owed per creator, reset to 0 after each successful payout
- `settlements` — permanent record of every real payout (amount, real `tx_id`, timestamp)
- `agent_log` — public audit trail of every agent action

---

## Known limitations

- No balance-check/low-balance-warning agent — only the settlement agent is built.
- Video duration is not fetched from source metadata; the duration badge is hidden rather than faked.
- Thumbnails are placeholder images, not extracted from the actual video source.
- No in-place video editing — creators delete and re-upload to change details.