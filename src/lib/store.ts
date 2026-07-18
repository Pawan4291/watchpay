// Simple reactive store for demo state
import { useState, useEffect } from 'react';
import { WATCHPAY_AGENT_NAMETAG } from './constants';

export interface User {
  id: string;
  nametag: string;
  realNametag?: string;
  directAddress?: string;
  isCreator: boolean;
}

export interface WPWallet {
  balance: number;
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
  wallet: WPWallet | null;
  currentSession: WatchSession | null;
  isConnecting: boolean;
  sphereClient: any | null;
}

let storeState: StoreState = {
  user: null,
  wallet: null,
  currentSession: null,
  isConnecting: false,
  sphereClient: null,
};

const listeners = new Set<() => void>();
function notifyListeners() { listeners.forEach(l => l()); }

export function getStore() { return storeState; }
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
  const { trySilentConnect } = await import('./sphere');
  const result = await trySilentConnect();
  if (!result) return;
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
  const res = await fetch(`/api/points-get?chainPubkey=${encodeURIComponent(identity.chainPubkey)}`).then(r => r.json());

  const realUser: User = {
    id: identity.chainPubkey,
    nametag: identity.nametag ?? identity.chainPubkey.slice(0, 8),
    realNametag: identity.nametag,
    directAddress: identity.directAddress,
    isCreator: false,
  };

  setStore({
    user: realUser,
    wallet: { balance: res.balance ?? 0, lastUpdated: new Date().toISOString() },
    isConnecting: false,
  });
}

export async function disconnectWallet(): Promise<void> {
  setStore({ user: null, wallet: null, currentSession: null });
}

export async function refreshBalance(): Promise<void> {
  if (!storeState.user) return;
  const res = await fetch(`/api/points-get?chainPubkey=${encodeURIComponent(storeState.user.id)}`).then(r => r.json());
  setStore({
    wallet: { balance: res.balance ?? 0, lastUpdated: new Date().toISOString() },
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

  fetch('/api/session-start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainPubkey: storeState.user?.id, videoId }),
  }).catch(err => console.error('[WatchPay] session-start failed:', err));

  return session;
}

export function recordTick(rate: number): boolean {
  const { wallet, currentSession } = storeState;
  if (!wallet || !currentSession) return false;
  if (wallet.balance < rate) return false;

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

  fetch('/api/points-tick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainPubkey: storeState.user?.id, videoId: currentSession.videoId, amount: rate }),
  }).catch(err => console.error('[WatchPay] tick sync failed:', err));

  return true;
}

export function endWatchSession(): void {
  if (!storeState.currentSession) return;
  const session = storeState.currentSession;
  setStore({ currentSession: { ...session, active: false } });

  fetch('/api/session-end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainPubkey: storeState.user?.id, videoId: session.videoId }),
  }).catch(err => console.error('[WatchPay] session-end failed:', err));
}

export async function depositUCT(amount: number): Promise<{ success: boolean; txId?: string }> {
  if (!storeState.user) return { success: false };
  try {
    let client = storeState.sphereClient;
    if (!client) {
      const { connectRealWallet } = await import('./sphere');
      const conn = await connectRealWallet();
      client = conn.client;
      setStore({ sphereClient: client });
    }
    const { requestDeposit, uctToSmallestUnit } = await import('./sphere');
    const result = await requestDeposit(client, WATCHPAY_AGENT_NAMETAG, uctToSmallestUnit(amount));
    console.log('[WatchPay] deposit intent result:', result);

    const check = await fetch(`/api/points-deposit-check?chainPubkey=${encodeURIComponent(storeState.user.id)}&senderNametag=${encodeURIComponent(storeState.user.realNametag ?? '')}`).then(r => r.json());
    console.log('[WatchPay] deposit-check response:', check);

    if (check.credited > 0 && storeState.wallet) {
      setStore({
        wallet: { ...storeState.wallet, balance: storeState.wallet.balance + check.credited, lastUpdated: new Date().toISOString() },
      });
      return { success: true, txId: `${check.credited} WP credited` };
    }

    return { success: false };
  } catch (err) {
    console.error('[WatchPay] depositUCT failed:', err);
    return { success: false };
  }
}

export async function withdrawUCT(amount: number): Promise<{ success: boolean; txId?: string }> {
  if (!storeState.user || !storeState.wallet || storeState.wallet.balance < amount) {
    return { success: false };
  }
  try {
    const res = await fetch('/api/points-withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chainPubkey: storeState.user.id, realNametag: storeState.user.realNametag, amount }),
    }).then(r => r.json());

    if (res.error) {
      console.error('[WatchPay] withdraw failed:', res.error);
      return { success: false };
    }

    setStore({
      wallet: { ...storeState.wallet, balance: storeState.wallet.balance - amount, lastUpdated: new Date().toISOString() },
    });
    return { success: true, txId: res.txId };
  } catch (err) {
    console.error('[WatchPay] withdrawUCT failed:', err);
    return { success: false };
  }
}