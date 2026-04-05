# LeAgent

AI-powered DeFi trading agents secured by Ledger hardware wallets. Create autonomous agents that trade on Uniswap V3 using strategies you write in plain English — while your private keys never leave your hardware wallet.

---

## How it works

1. Connect your Ledger via RainbowKit and sign in with SIWE (Sign-In With Ethereum)
2. Create an agent — give it a name, a strategy prompt, and a policy (whitelisted tokens, contracts, rate/value limits)
3. The agent gets its own deterministic wallet derived from `keccak256(SECRET_SEED + ens_name)` — no key storage, just math
4. Agent config is stored as an ENS record via [namespace.ninja](https://namespace.ninja)
5. The backend runner feeds live token prices (CoinGecko) + the agent's strategy to Claude Opus, which returns a structured trade decision
6. If the decision is a swap, the backend executes it directly on Uniswap V3 via `exactInputSingle`
7. Policy guardrails (token whitelist, contract whitelist, 24h rate/value limits) are enforced before every trade

---

## Stack

**Frontend**
- Next.js 15 (App Router)
- RainbowKit + Wagmi — wallet connection
- SIWE — Sign-In With Ethereum authentication
- TanStack Query — data fetching
- TailwindCSS — styling

**Backend**
- Python + FastAPI
- web3.py — Ethereum interaction & transaction signing
- Uniswap V3 `exactInputSingle` — swap execution
- Anthropic Claude Opus (`claude-opus-4-6`) — trading brain
- CoinGecko API — live token prices (no key needed)
- namespace.ninja — ENS-based agent storage
- Polymarket — optional black swan event triggers

**Infrastructure**
- IPFS via Pinata — agent profile images

---

## Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=             # Backend URL (e.g. https://your-backend.railway.app)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # From cloud.walletconnect.com
NEXT_PUBLIC_PINATA_API_KEY=      # From app.pinata.cloud
NEXT_PUBLIC_PINATA_API_SECRET=   # From app.pinata.cloud
NEXT_PUBLIC_NGROK_MODE=          # Set to "true" if tunnelling backend via ngrok
NEXT_PUBLIC_ETHERSCAN_API_KEY=   # Optional — from etherscan.io/apis (improves rate limits)
```

### Backend (`backend/.env`)

```env
NAMESPACE_APIKEY=    # From namespace.ninja — used to store agent ENS records
SECRET_SEED=         # Random secret string — used to derive agent wallets deterministically
ANTHROPIC_API_KEY=   # From console.anthropic.com
WEB3_RPC_URL=        # Ethereum RPC (e.g. https://mainnet.infura.io/v3/YOUR_KEY)
```

---

## Running locally

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Backend**
```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

---

## Project structure

```
le_agent/
├── frontend/          # Next.js app
│   ├── app/           # Pages and routing
│   ├── components/    # UI components
│   └── lib/           # API client, auth, types
└── backend/
    ├── runners/       # Agent loop (manager.py)
    └── utils/         # brain.py, uniswap.py, keys.py
```
