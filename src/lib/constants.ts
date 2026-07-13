// Unicity Sphere Testnet2 Constants
export const UCT_COIN_ID = 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0';
export const UCT_DECIMALS = 8; // From TokenRegistry docs
export const UCT_SYMBOL = 'UCT';

// Testnet2 endpoints
export const TESTNET2_GATEWAY = 'https://gateway.testnet2.unicity.network';
export const TESTNET2_API_KEY = 'sk_ddc3cfcc001e4a28ac3fad7407f99590'; // Public testnet2 key
export const WALLET_API_BASE = 'https://wallet-api.unicity.network';
export const NOSTR_RELAY = 'wss://nostr-relay.testnet.unicity.network';
export const SPHERE_WALLET_URL = 'https://sphere.unicity.network';

// Rate settings
export const DEFAULT_RATE_PER_30S = 0.001; // UCT
export const TICK_INTERVAL_MS = 30000; // 30 seconds
export const AGENT_SETTLE_INTERVAL_MS = 300000; // 5 min
export const AGENT_CHECK_INTERVAL_MS = 300000; // 5 min

// Smallest unit conversion (UCT has 8 decimals)
export const UCT_TO_SMALLEST = 100_000_000; // 1 UCT = 100,000,000 smallest units

export const NETWORK_NAME = 'testnet2';
export const NETWORK_ID = 4; // testnet2 network id from trust base

// Demo video data
export const DEMO_VIDEOS = [
  {
    id: 'v1',
    title: 'Building on Unicity: Sphere SDK Deep Dive',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/sphere1/640/360',
    creator: '@satoshi_dev',
    creator_id: 'c1',
    rate_per_30s: 0.001,
    views: 12847,
    duration: '24:35',
    category: 'Tech',
    description: 'A comprehensive walkthrough of the Unicity Sphere SDK, covering wallet creation, UCT payments, and autonomous agent patterns.',
  },
  {
    id: 'v2',
    title: 'Autonomous Agents & Micropayments: The Future',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/sphere2/640/360',
    creator: '@alice_builder',
    creator_id: 'c2',
    rate_per_30s: 0.002,
    views: 8432,
    duration: '18:22',
    category: 'DeFi',
    description: 'Exploring how autonomous agents can handle micropayment settlements without human intervention, using real on-chain transactions.',
  },
  {
    id: 'v3',
    title: 'WatchPay Architecture: Pay-Per-Second Billing',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/sphere3/640/360',
    creator: '@bob_crypto',
    creator_id: 'c3',
    rate_per_30s: 0.0005,
    views: 23156,
    duration: '31:10',
    category: 'Architecture',
    description: 'Technical deep-dive into the WatchPay billing system. How we implement tick-based micropayments with custodial app wallets on Unicity testnet2.',
  },
  {
    id: 'v4',
    title: 'UCT Tokenomics & The Unicity Ecosystem',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/sphere4/640/360',
    creator: '@carol_defi',
    creator_id: 'c4',
    rate_per_30s: 0.003,
    views: 5621,
    duration: '42:15',
    category: 'Tokenomics',
    description: 'Understanding UCT, the native token of the Unicity network. Market dynamics, staking, and the payment rails powering next-gen dApps.',
  },
  {
    id: 'v5',
    title: 'Sphere Connect Protocol: dApp Integration Guide',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/sphere5/640/360',
    creator: '@dave_engineer',
    creator_id: 'c5',
    rate_per_30s: 0.001,
    views: 9834,
    duration: '15:48',
    category: 'Dev Guide',
    description: 'Step-by-step integration of the Sphere Connect protocol into your dApp. From ConnectClient setup to handling intents and events.',
  },
  {
    id: 'v6',
    title: 'On-Chain Proof & Settlement: Zero Trust Billing',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/sphere6/640/360',
    creator: '@eva_blockchain',
    creator_id: 'c6',
    rate_per_30s: 0.0015,
    views: 4293,
    duration: '28:05',
    category: 'Security',
    description: 'How WatchPay ensures every payment is provably settled on-chain. The settlement agent architecture, QStash scheduling, and audit trails.',
  },
];

// Demo agent log entries
export const DEMO_AGENT_LOGS = [
  {
    id: 'log1',
    action_type: 'settlement',
    details: {
      creator_nametag: '@satoshi_dev',
      amount: '0.04320000',
      tx_id: 'a3f8c2d1e9b45602f7a8c3d2e1f95b47a8c3d2e1f9b4560',
      creator_id: 'c1',
      viewers_count: 12,
      memo: 'Watch payment settlement — 0.04320000 UCT',
    },
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'log2',
    action_type: 'balance_check',
    details: {
      active_sessions: 23,
      wallets_checked: 23,
      low_balance_alerts: 2,
      alert_recipients: ['@viewer_7', '@viewer_15'],
    },
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'log3',
    action_type: 'settlement',
    details: {
      creator_nametag: '@alice_builder',
      amount: '0.02160000',
      tx_id: 'b4e9d3c2f8a57013e9b4d5c3f2a8c4d5e3f2b9a5740',
      creator_id: 'c2',
      viewers_count: 6,
      memo: 'Watch payment settlement — 0.02160000 UCT',
    },
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'log4',
    action_type: 'settlement',
    details: {
      creator_nametag: '@bob_crypto',
      amount: '0.01800000',
      tx_id: 'c5f0e4d3a9b68124f0c5e6d4a3b9c5d6e4f3c0b6851',
      creator_id: 'c3',
      viewers_count: 18,
      memo: 'Watch payment settlement — 0.01800000 UCT',
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'log5',
    action_type: 'balance_check',
    details: {
      active_sessions: 31,
      wallets_checked: 31,
      low_balance_alerts: 5,
      alert_recipients: ['@viewer_2', '@viewer_8', '@viewer_19', '@viewer_24', '@viewer_30'],
    },
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'log6',
    action_type: 'settlement',
    details: {
      creator_nametag: '@carol_defi',
      amount: '0.09000000',
      tx_id: 'd6a1f5e4b0c79235a1d6f7e5b4c0d7e5f4a1d7b7962',
      creator_id: 'c4',
      viewers_count: 15,
      memo: 'Watch payment settlement — 0.09000000 UCT',
    },
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'log7',
    action_type: 'settlement',
    details: {
      creator_nametag: '@dave_engineer',
      amount: '0.03600000',
      tx_id: 'e7b2a6f5c1d80346b2e7a8f6c5d1e8f6a5b2e8c8073',
      creator_id: 'c5',
      viewers_count: 18,
      memo: 'Watch payment settlement — 0.03600000 UCT',
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'log8',
    action_type: 'balance_check',
    details: {
      active_sessions: 18,
      wallets_checked: 18,
      low_balance_alerts: 1,
      alert_recipients: ['@viewer_11'],
    },
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
];

// Demo settlements
export const DEMO_SETTLEMENTS = [
  { id: 's1', creator_id: 'c1', amount: 0.0432, tx_id: 'a3f8c2d1e9b45602f7a8c3d2e1f95b47a8c3d2e1f9b4560', memo: 'Watch payment settlement — 0.04320000 UCT', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: 's2', creator_id: 'c1', amount: 0.0360, tx_id: 'f8c3d4e5b2a79013d9c5f7e8b4a3c5d8e7f4b3a5091', memo: 'Watch payment settlement — 0.03600000 UCT', timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString() },
  { id: 's3', creator_id: 'c1', amount: 0.0288, tx_id: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2', memo: 'Watch payment settlement — 0.02880000 UCT', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
];

// Demo stats
export const DEMO_STATS = {
  totalSettled: '1,247.832 UCT',
  activeSessions: 47,
  totalCreators: 6,
  agentUptime: '99.7%',
  avgSettlementTime: '4m 52s',
  txsLast24h: 2847,
};
