# WatchPay — Pay-Per-30-Seconds Video App on Unicity Sphere

**Track:** Payments & Markets  
**Network:** Unicity Sphere testnet2 (networkId 4)  
**Agentic:** YES — settlement + balance-check run autonomously via QStash (no human trigger)  
**AstridOS:** NOT USED

---

## What is WatchPay?

WatchPay is a pay-per-30-seconds video watching app built on the Unicity Sphere testnet2.
Every 30 seconds a viewer watches a video, real UCT is deducted from their in-app wallet and
queued for settlement. An autonomous agent (scheduled via Upstash QStash) batches and settles
real on-chain payments to creators every ~5 minutes — no wallet popup per tick.

**UCT Coin ID:** `f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0`

---

## Tech Stack

| Layer        | Technology                          | Cost     |
|-------------|-------------------------------------|----------|
| Frontend    | React + Vite + TailwindCSS v4       | Free     |
| Backend     | Next.js 14 App Router (Vercel)      | Free tier|
| Database    | Supabase Postgres                   | Free tier|
| Agent       | Upstash QStash                      | Free tier|
| Payments    | `@unicitylabs/sphere-sdk@0.10.2`    | Free     |
| UI Motion   | Framer Motion                       | Free     |

---

## Agentic Architecture

The autonomous agent consists of two QStash-scheduled jobs:

### 1. Settlement Agent (`POST /api/agent/settle`) — every 5–10 min
```
QStash → /api/agent/settle
  ↓
Query pending_settlements WHERE amount_owed > 0
  ↓
For each creator:
  sphere.payments.send({ recipient: creator.nametag, amount, coinId: UCT_COIN_ID })
  ↓
  result.status === 'completed' → success
  ↓
  Reset pending_settlements.amount_owed = 0
  Insert into settlements (amount, tx_id=result.id, memo)
  Insert into agent_log (action_type='settlement', details)
```

### 2. Balance Check Agent (`POST /api/agent/balance-check`) — every 5 min
```
QStash → /api/agent/balance-check
  ↓
Query active watch_sessions (ended_at IS NULL)
  JOIN app_wallets.balance
  JOIN videos.rate_per_30s
  ↓
If balance < rate * 3:  → sphere.communications.sendDM('@viewer', 'Top up to continue watching')
  ↓
Insert into agent_log (action_type='balance_check', details)
```

---

## Wallet Architecture (Honest Disclosure)

WatchPay uses a **custodial app wallet** per user for silent, uninterrupted billing:

- **App wallet:** Server-side custodial wallet (mnemonic encrypted with AES-256-GCM, stored in Supabase). The agent can sign and send UCT without any user interaction — this enables the "no popup per tick" experience.
- **Real Sphere wallet:** Stays fully user-controlled. Used ONLY for:
  - **Login:** Via `autoConnect` / `ConnectClient` (Sphere Connect protocol v2.0)
  - **Deposit:** User approves a `sphere.intent('send', ...)` from their real wallet to the app wallet
  - **Withdraw:** Agent sends UCT back to the user's real wallet nametag

This is the honest tradeoff: custodial billing for seamless UX, with the real wallet intact for all value-bearing operations.

---

## SDK Methods Used (Confirmed Against Real Repo)

All method names verified against https://github.com/unicity-sphere/sphere-sdk:

| Method | Usage |
|--------|-------|
| `Sphere.init({ mnemonic, nametag, ...providers })` | Create/load wallet per user |
| `sphere.payments.send({ recipient, amount, coinId, memo })` | Settlement payments |
| `sphere.payments.getAssets()` | Balance verification (on-chain) |
| `sphere.payments.mintFungibleToken(coinId, amount)` | Testnet self-mint (faucet alternative) |
| `sphere.registerNametag(name)` | Register app wallet nametag |
| `sphere.communications.sendDM('@user', msg)` | Low-balance DM alerts |
| `autoConnect({ dapp, walletUrl, network: SPHERE_NETWORKS.testnet2 })` | Browser login |
| `client.intent('send', { to, amount, coinId })` | Deposit intent |
| `client.query('sphere_getBalance')` | Read real wallet balance |

---

## Provider Setup (Node.js server-side)

```typescript
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';

const base = createNodeProviders({
  network: 'testnet',                                    // = testnet2 (networkId 4)
  dataDir: `./wallet-data/${userId}`,
  tokensDir: `./tokens-data/${userId}`,
  oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' }, // public testnet2 key
});

const providers = createWalletApiProviders(base, {
  baseUrl: 'https://wallet-api.unicity.network',
  network: 'testnet2',
  deviceId: `watchpay-${userId}`,
});

const { sphere } = await Sphere.init({ ...providers, mnemonic, autoGenerate: true });
```

---

## Environment Variables

```env
NEXT_PUBLIC_SPHERE_NETWORK=testnet2
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
WALLET_ENCRYPTION_SECRET=          # 32-byte hex for AES-256-GCM
```

---

## Run Locally (Against Testnet2)

```bash
# Install
npm install

# Start dev server (Vite frontend demo)
npm run dev

# For the full Next.js backend:
# 1. Copy .env.local.example → .env.local, fill values
# 2. Set up Supabase: run db/schema.sql in the SQL editor
# 3. Set up QStash: run lib/qstash.ts to register schedules
# 4. Start: next dev
# 5. Get test UCT: sphere.payments.mintFungibleToken(UCT_COIN_ID, 1000n)
#    Or: sphere topup 10 UCT (CLI)
```

---

## Test Tokens

On testnet2 there is no external faucet needed. Self-mint via the v2 token engine:
```typescript
const result = await sphere.payments.mintFungibleToken(UCT_COIN_ID, 1000n);
// Or via CLI: sphere topup 10 UCT
```

External faucet (for reference): https://faucet.unicity.network/faucet/

---

## Submission Checklist

- [x] Public repo with readable code
- [x] Live at public HTTPS URL (Vercel deployment)
- [x] Track: **Payments and Markets**
- [x] Agentic: YES — QStash-scheduled settlement + balance-check agents
- [x] AstridOS: NOT USED
- [x] Real UCT (not mocked) — all balances from on-chain via `sphere.payments.getAssets()`
- [x] Wallet architecture disclosed (custodial app wallet + user-controlled real wallet)
- [x] All SDK methods verified against https://github.com/unicity-sphere/sphere-sdk
- [x] UCT Coin ID hardcoded: `f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0`

---

## License

MIT
