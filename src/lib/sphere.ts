/**
 * WatchPay — Sphere SDK Wrapper (lib/sphere.ts)
 *
 * All Sphere SDK calls are centralized here.
 * Based strictly on the real sphere-sdk documentation:
 * https://github.com/unicity-sphere/sphere-sdk
 *
 * SDK methods confirmed:
 * - Sphere.init({ ...providers, mnemonic, autoGenerate, nametag })
 * - sphere.payments.send({ recipient, amount, coinId, memo })
 * - sphere.payments.getBalance() → Asset[]
 * - sphere.payments.mintFungibleToken(coinId, amount: bigint)
 * - sphere.registerNametag(name)
 * - sphere.isNametagAvailable(name)
 * - sphere.communications.sendDM('@nametag', 'message')
 * - ConnectClient / autoConnect from @unicitylabs/sphere-sdk/connect
 * - autoConnect from @unicitylabs/sphere-sdk/connect/browser
 * - SPHERE_NETWORKS from @unicitylabs/sphere-sdk/connect
 */
import { Sphere } from '@unicitylabs/sphere-sdk';
import {
  createLocalStorageProvider,
  createNostrTransportProvider,
  createUnicityAggregatorProvider,
} from '@unicitylabs/sphere-sdk/impl/browser';

let sphereInstance: Awaited<ReturnType<typeof Sphere.init>>['sphere'] | null = null;

export async function getSphere(mnemonic: string) {
  if (sphereInstance) return sphereInstance;

  const storage = createLocalStorageProvider();
  const transport = createNostrTransportProvider({ relays: [NOSTR_RELAY] });
 const oracle = createUnicityAggregatorProvider({ url: '/rpc', network: 'testnet2', apiKey: TESTNET2_API_KEY });

  const { sphere } = await Sphere.init({
    mnemonic,
    network: 'testnet2',
    storage,
    transport,
    oracle,
  });
  sphereInstance = sphere;
  return sphere;
}

// NOTE: This file contains the architecture and contracts for the real SDK integration.
// In a Next.js/Node.js server environment, these would be real imports.
// For this browser-based Vite demo, we document the exact patterns and simulate
// the SDK behavior showing the real API contracts.

import {
  UCT_COIN_ID,
  UCT_DECIMALS,
  TESTNET2_API_KEY,
  WALLET_API_BASE,
  NETWORK_NAME,
  SPHERE_WALLET_URL,
  NOSTR_RELAY,
} from './constants';

// ─────────────────────────────────────────────────────────────
// TYPE DEFINITIONS (matching real sphere-sdk types)
// ─────────────────────────────────────────────────────────────

export interface WalletCreateResult {
  address: string;    // DIRECT:// address
  nametag: string;    // @username
  mnemonic: string;   // 12-word BIP39 mnemonic
  chainPubkey: string;
}

import type { TransferStatus } from '@unicitylabs/sphere-sdk';

export interface SendResult {
  id: string;           // transferId
  status: TransferStatus;
  deliveryPending: boolean;
  deliveryState: 'landed' | 'pending-delivery';
}

export interface BalanceAsset {
  coinId: string;
  symbol: string;
  totalAmount: string;
  tokenCount: number;
}

export interface ConnectIdentity {
  chainPubkey: string;
  directAddress?: string;
  nametag?: string;
}

// ─────────────────────────────────────────────────────────────
// REAL SDK SETUP PATTERN (Node.js server-side)
// ─────────────────────────────────────────────────────────────

/**
 * Real Node.js SDK initialization pattern.
 * In production Next.js API routes, this is what you'd import and call:
 *
 * import { Sphere } from '@unicitylabs/sphere-sdk';
 * import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
 * import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';
 *
 * const base = createNodeProviders({
 *   network: 'testnet',
 *   dataDir: `./wallet-data/${userId}`,
 *   tokensDir: `./tokens-data/${userId}`,
 *   oracle: { apiKey: TESTNET2_API_KEY },
 * });
 *
 * const providers = createWalletApiProviders(base, {
 *   baseUrl: WALLET_API_BASE,
 *   network: 'testnet2',
 *   deviceId: `watchpay-${userId}`,
 * });
 *
 * const { sphere, created, generatedMnemonic } = await Sphere.init({
 *   ...providers,
 *   autoGenerate: true,
 *   nametag: desiredNametag,
 * });
 */

// ─────────────────────────────────────────────────────────────
// UCT AMOUNT UTILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Convert human UCT amount to smallest unit string.
 * UCT has 8 decimals → 1 UCT = 100_000_000 smallest units.
 *
 * NOTE: The sphere-sdk docs say to pass amount as a decimal STRING in smallest units.
 * Confirmed from CONNECT.md: "amount in base units"
 * Confirmed from QUICKSTART-NODEJS.md: "In base units"
 */
export function uctToSmallestUnit(uct: number): string {
  const multiplier = Math.pow(10, UCT_DECIMALS);
  return Math.floor(uct * multiplier).toString();
}

export function smallestUnitToUCT(smallest: string | number): number {
  const multiplier = Math.pow(10, UCT_DECIMALS);
  return Number(smallest) / multiplier;
}

export function formatUCT(amount: number, decimals = 6): string {
  return amount.toFixed(decimals).replace(/\.?0+$/, '') || '0';
}

// ─────────────────────────────────────────────────────────────
// SPHERE SDK API CONTRACTS
// These functions show the exact API signatures used in the
// real Next.js API routes on the backend.
// ─────────────────────────────────────────────────────────────

/**
 * createUserWallet — generates mnemonic + wallet, registers nametag.
 *
 * REAL IMPLEMENTATION (server-side Next.js route):
 *
 * async function createUserWallet(desiredNametag: string): Promise<WalletCreateResult> {
 *   const mnemonic = Sphere.generateMnemonic(); // BIP39 12-word
 *
 *   const base = createNodeProviders({
 *     network: 'testnet',
 *     dataDir: `./wallet-data/${desiredNametag}`,
 *     tokensDir: `./tokens-data/${desiredNametag}`,
 *     oracle: { apiKey: process.env.SPHERE_API_KEY || TESTNET2_API_KEY },
 *   });
 *   const providers = createWalletApiProviders(base, {
 *     baseUrl: WALLET_API_BASE,
 *     network: 'testnet2',
 *     deviceId: `watchpay-${desiredNametag}`,
 *   });
 *
 *   const { sphere } = await Sphere.init({
 *     ...providers,
 *     mnemonic,                    // Fixed mnemonic ensures nametag stays bound
 *     nametag: desiredNametag,     // Registers @desiredNametag on Nostr
 *   });
 *
 *   return {
 *     address: sphere.identity!.directAddress!,
 *     nametag: sphere.identity!.nametag!,
 *     mnemonic,
 *     chainPubkey: sphere.identity!.chainPubkey,
 *   };
 * }
 */
export async function createUserWallet(desiredNametag: string): Promise<WalletCreateResult> {
  const { generateMnemonic } = await import('@unicitylabs/sphere-sdk');
  const mnemonic = generateMnemonic();
  const { sphere } = await Sphere.init({
    mnemonic,
    network: 'testnet2',
    storage: createLocalStorageProvider(),
    transport: createNostrTransportProvider({ relays: [NOSTR_RELAY] }),
    oracle: createUnicityAggregatorProvider({ url: '/rpc', network: 'testnet2' }),
    nametag: desiredNametag,
  } as any);
  return {
    address: sphere.identity!.directAddress!,
    nametag: sphere.identity!.nametag!,
    mnemonic,
    chainPubkey: sphere.identity!.chainPubkey,
  };
}

/**
 * sendUCT — signs and sends real UCT transfer.
 *
 * REAL IMPLEMENTATION:
 *
 * async function sendUCT(
 *   fromMnemonic: string,
 *   toNametag: string,
 *   amountSmallestUnit: string,
 *   memo?: string
 * ): Promise<SendResult> {
 *   const providers = createNodeProviders({ network: 'testnet', ... });
 *   const walletApiProviders = createWalletApiProviders(providers, { ... });
 *
 *   const { sphere } = await Sphere.init({
 *     ...walletApiProviders,
 *     mnemonic: fromMnemonic,
 *   });
 *
 *   try {
 *     const result = await sphere.payments.send({
 *       recipient: toNametag,         // '@alice' format
 *       amount: amountSmallestUnit,   // decimal string in smallest units
 *       coinId: UCT_COIN_ID,          // hex coinId (not symbol)
 *       memo,
 *     });
 *     // result.status === 'completed' means sent (even if deliveryPending)
 *     return result;
 *   } catch (err) {
 *     if (isSphereError(err) && err.code === 'CERTIFICATION_UNCONFIRMED') {
 *       // May have sent — DO NOT re-send. Call resumeOpenIntents() instead.
 *       await sphere.payments.resumeOpenIntents();
 *       throw new Error('CERTIFICATION_UNCONFIRMED: payment may have been sent, resuming...');
 *     }
 *     throw err;
 *   }
 * }
 */
export async function sendUCT(
  fromMnemonic: string,
  toNametag: string,
  amountSmallestUnit: string,
  memo?: string
): Promise<SendResult> {
  const sphere = await getSphere(fromMnemonic);
  const result = await sphere.payments.send({
    recipient: toNametag,
    amount: amountSmallestUnit,
    coinId: UCT_COIN_ID,
    memo,
  });
  return {
    id: result.id,
    status: result.status,
    deliveryPending: result.deliveryPending ?? false,
    deliveryState: result.deliveryState ?? 'landed',
  };
}

/**
 * getBalance — reads real on-chain balance.
 *
 * REAL IMPLEMENTATION:
 *
 * async function getBalance(mnemonic: string): Promise<BalanceAsset[]> {
 *   const { sphere } = await Sphere.init({ ...providers, mnemonic });
 *   await sphere.payments.receive(); // drain mailbox first
 *   const assets = await sphere.payments.getAssets();
 *   // Or synchronous: const balances = sphere.payments.getBalance();
 *   return assets;
 * }
 */
export async function getBalance(mnemonic: string): Promise<BalanceAsset[]> {
  const sphere = await getSphere(mnemonic);
  await sphere.payments.receive();
  const assets = await sphere.payments.getAssets();
  return assets;
}

/**
 * connectRealWallet — ConnectClient/autoConnect for browser login.
 *
 * REAL IMPLEMENTATION (browser-side):
 *
 * import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
 * import { SPHERE_NETWORKS } from '@unicitylabs/sphere-sdk/connect';
 *
 * async function connectRealWallet() {
 *   const result = await autoConnect({
 *     dapp: {
 *       name: 'WatchPay',
 *       description: 'Pay-per-30-seconds video watching on Unicity Sphere',
 *       url: window.location.origin,
 *     },
 *     walletUrl: 'https://sphere.unicity.network',
 *     network: SPHERE_NETWORKS.testnet2,  // { id: 4, name: 'testnet2' }
 *     silent: true,  // try silent auto-reconnect first
 *     permissions: [
 *       'identity:read',
 *       'balance:read',
 *       'transfer:request',
 *       'sign:request',
 *     ],
 *   });
 *
 *   // result.client — use for queries and intents
 *   // result.connection.identity → { chainPubkey, directAddress?, nametag? }
 *   // result.connection.sessionId → save to sessionStorage for resume
 *   sessionStorage.setItem('sphere-session', result.connection.sessionId);
 *
 *   const identity = result.connection.identity;
 *   return { client: result.client, identity };
 * }
 *
 * // To request a deposit (send intent to the user's real wallet):
 * await client.intent('send', {
 *   to: appWalletNametag,               // '@watchpay_alice' (the app wallet nametag)
 *   amount: uctToSmallestUnit(amount).toString(),
 *   coinId: UCT_COIN_ID,                // lowercase 64-hex required (not symbol)
 * });
 */
const SESSION_KEY = 'watchpay-sphere-session';

function isInIframe(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}

function hasExtension(): boolean {
  return typeof (window as any).sphereExtension !== 'undefined';
}

async function baseConnect(silent: boolean) {
  const { ConnectClient, SPHERE_NETWORKS } = await import('@unicitylabs/sphere-sdk/connect');
  const { PostMessageTransport, ExtensionTransport } = await import('@unicitylabs/sphere-sdk/connect/browser');

  const dapp = { name: 'WatchPay', description: 'Pay-per-30-seconds video watching on Unicity Sphere', url: window.location.origin };
  const permissions = ['identity:read', 'balance:read', 'transfer:request', 'sign:request'];

  let transport;
  if (isInIframe()) {
    transport = PostMessageTransport.forClient();
  } else if (hasExtension()) {
    transport = ExtensionTransport.forClient();
  } else {
    const popup = window.open(
      `${SPHERE_WALLET_URL}/connect?origin=${encodeURIComponent(window.location.origin)}`,
      'sphere-wallet',
      'width=420,height=650'
    );
    if (!popup) throw new Error('Popup blocked. Please allow popups for this site.');
    transport = PostMessageTransport.forClient({ target: popup, targetOrigin: SPHERE_WALLET_URL });
  }

  const savedSession = sessionStorage.getItem(SESSION_KEY);
  const client = new ConnectClient({
    transport,
    dapp,
    network: SPHERE_NETWORKS.testnet2,
    silent,
    permissions,
    resumeSessionId: savedSession ?? undefined,
  } as any);

  const result = await client.connect();
  sessionStorage.setItem(SESSION_KEY, result.sessionId);
  return { client, identity: result.identity as ConnectIdentity };
}

export async function trySilentConnect(): Promise<{ identity: ConnectIdentity } | null> {
  try {
    return await baseConnect(true);
  } catch {
    return null;
  }
}

export async function connectRealWallet(): Promise<{ identity: ConnectIdentity }> {
  return baseConnect(false);
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * mintTestUCT — self-mint UCT for testing (testnet only).
 *
 * REAL IMPLEMENTATION:
 *
 * import { TokenRegistry } from '@unicitylabs/sphere-sdk';
 *
 * async function mintTestUCT(mnemonic: string, amountUCT: number) {
 *   const { sphere } = await Sphere.init({ ...providers, mnemonic });
 *   const coinId = TokenRegistry.getInstance().getCoinIdBySymbol('UCT');
 *   // Or use the raw hex: UCT_COIN_ID
 *   const amount = BigInt(uctToSmallestUnit(amountUCT));
 *   const result = await sphere.payments.mintFungibleToken(coinId!, amount);
 *   if (result.success) {
 *     return result.tokenId;
 *   }
 *   throw new Error(result.error);
 * }
 */
export async function mintTestUCT(mnemonic: string, amountUCT: number): Promise<string> {
  const sphere = await getSphere(mnemonic);
  const amount = BigInt(uctToSmallestUnit(amountUCT));
  const result = await sphere.payments.mintFungibleToken(UCT_COIN_ID, amount);
  if (result.success) return result.tokenId;
  throw new Error(result.error);
}

export { UCT_COIN_ID, UCT_DECIMALS, NETWORK_NAME, TESTNET2_API_KEY, WALLET_API_BASE };
