// Simple reactive store for demo state
import { useState, useEffect } from 'react';
import { sendUCT } from './sphere';

export interface User {
  id: string;
  nametag: string;
  realNametag?: string;
  directAddress?: string;
  isCreator: boolean;
}

export interface AppWallet {
  address: string;
  nametag: string;
  mnemonic: string;
  realNametag: string;
  balance: number; // UCT balance
  lastUpdated: string;
}

export interface WatchSession {
  id: string;
  videoId: string;
  startedAt: string;
  totalTicks: number;
  totalSpent: number;
  active: boolean;
}

interface StoreState {
  user: User | null;
  wallet: AppWallet | null;
  currentSession: WatchSession | null;
  isConnecting: boolean;
  isWalletCreating: boolean;
  sphereClient: any | null;
}

// In-memory store (would be backed by Supabase in production)
let storeState: StoreState = {
  user: null,
  wallet: null,
  currentSession: null,
  isConnecting: false,
  isWalletCreating: false,
  sphereClient: null,
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(l => l());
}

export function getStore() {
  return storeState;
}

export function setStore(partial: Partial<StoreState>) {
  storeState = { ...storeState, ...partial };
  notifyListeners();
}

export function useStore() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const listener = () => rerender(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return storeState;
}

export async function trySilentLogin(): Promise<void> {
  const { trySilentConnect, createUserWallet, getBalance } = await import('./sphere');
  const result = await trySilentConnect();
  if (!result) return; // no popup, just stay logged out until user clicks Connect
  await finishLogin(result.identity);
}

export async function loginWithSphere(): Promise<void> {
  setStore({ isConnecting: true });
  try {
    const { connectRealWallet } = await import('./sphere');
    const { identity, client } = await connectRealWallet();
    setStore({ sphereClient: client });
    await finishLogin(identity);
  } catch (err) {
    console.error('[WatchPay] loginWithSphere failed:', err);
    setStore({ isConnecting: false });
  }
}

async function finishLogin(identity: { chainPubkey: string; nametag?: string; directAddress?: string }): Promise<void> {

  const { createUserWallet, getBalance } = await import('./sphere');
  const existing = await fetch(`/api/wallet-get?chainPubkey=${encodeURIComponent(identity.chainPubkey)}`).then(r => r.json());
  let wallet;
  if (existing.wallet) {
    wallet = {
      address: existing.wallet.address,
      nametag: existing.wallet.nametag,
      mnemonic: existing.wallet.mnemonic_encrypted,
      chainPubkey: identity.chainPubkey,
    };
  } else {
    const desiredNametag = `wp_${(identity.nametag ?? 'user').replace(/^@/, '')}_${identity.chainPubkey.slice(0, 6)}`;
    wallet = await createUserWallet(desiredNametag);
    const nametagForDb = wallet.nametag && wallet.nametag.length > 0 ? wallet.nametag : `addr_${wallet.address.replace(/[^a-zA-Z0-9]/g, '').slice(-20)}`;
    await fetch('/api/wallet-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chainPubkey: identity.chainPubkey, address: wallet.address, nametag: nametagForDb, mnemonic: wallet.mnemonic }),
    });
  }
  const balances = await getBalance(wallet.mnemonic);
  const uctBalance = balances.find(b => b.symbol === 'UCT');

  const realUser: User = {
    id: identity.chainPubkey,
    nametag: identity.nametag ?? wallet.nametag,
    realNametag: identity.nametag,
    directAddress: identity.directAddress,
    isCreator: false,
  };

  const appWallet: AppWallet = {
    address: wallet.address,
    nametag: wallet.nametag,
    mnemonic: wallet.mnemonic,
    realNametag: identity.nametag ?? '',
    balance: uctBalance ? Number(uctBalance.totalAmount) : 0,
    lastUpdated: new Date().toISOString(),
  };

  setStore({ user: realUser, wallet: appWallet, isConnecting: false });
}

export async function disconnectWallet(): Promise<void> {
  setStore({ user: null, wallet: null, currentSession: null });
}

export async function refreshBalance(): Promise<void> {
  if (!storeState.wallet) return;
  const { getBalance } = await import('./sphere');
  const balances = await getBalance(storeState.wallet.mnemonic);
  const uctBalance = balances.find(b => b.symbol === 'UCT');
  setStore({
    wallet: {
      ...storeState.wallet,
      balance: uctBalance ? Number(uctBalance.totalAmount) / 1e18 : storeState.wallet.balance,
      lastUpdated: new Date().toISOString(),
    },
  });
}

export function startWatchSession(videoId: string): WatchSession {
  const session: WatchSession = {
    id: `session-${Date.now()}`,
    videoId,
    startedAt: new Date().toISOString(),
    totalTicks: 0,
    totalSpent: 0,
    active: true,
  };
  setStore({ currentSession: session });
  return session;
}

export function recordTick(rate: number): boolean {
  const { wallet, currentSession } = storeState;
  if (!wallet || !currentSession) return false;

  if (wallet.balance < rate) {
    return false; // insufficient balance
  }

  const newBalance = wallet.balance - rate;
  const newSession: WatchSession = {
    ...currentSession,
    totalTicks: currentSession.totalTicks + 1,
    totalSpent: currentSession.totalSpent + rate,
  };

  setStore({
    wallet: { ...wallet, balance: newBalance, lastUpdated: new Date().toISOString() },
    currentSession: newSession,
  });

  return true;
}

export function endWatchSession(): void {
  if (!storeState.currentSession) return;
  setStore({
    currentSession: { ...storeState.currentSession, active: false },
  });
  // Don't clear session so we can show stats
}

export async function depositUCT(amount: number): Promise<{ success: boolean; txId?: string }> {
  if (!storeState.wallet) return { success: false };
  const recipientTarget = storeState.wallet.nametag || storeState.wallet.address;
  if (!recipientTarget) {
    console.error('[WatchPay] depositUCT: no nametag or address on wallet', storeState.wallet);
    return { success: false };
  }
  let client = storeState.sphereClient;
  if (!client) {
    const { connectRealWallet } = await import('./sphere');
    const conn = await connectRealWallet();
    client = conn.client;
    setStore({ sphereClient: client });
  }
  const { requestDeposit, uctToSmallestUnit } = await import('./sphere');
 const result = await requestDeposit(client, recipientTarget, uctToSmallestUnit(amount));
  const txId = result.txId ?? '';
  const newBalance = storeState.wallet.balance + amount;
  setStore({
    wallet: {
      ...storeState.wallet,
      balance: newBalance,
      lastUpdated: new Date().toISOString(),
    },
  });
  return { success: true, txId };
}

export async function withdrawUCT(amount: number): Promise<{ success: boolean; txId?: string }> {
  if (!storeState.wallet || storeState.wallet.balance < amount) {
    return { success: false };
  }
  const result = await sendUCT(storeState.wallet.mnemonic, storeState.wallet.realNametag, String(amount), 'Withdraw');
  const txId = result.id;
  const newBalance = storeState.wallet.balance - amount;
  setStore({
    wallet: {
      ...storeState.wallet,
      balance: newBalance,
      lastUpdated: new Date().toISOString(),
    },
  });
  return { success: true, txId };
}
