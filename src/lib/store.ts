// Simple reactive store for demo state
import { useState, useEffect } from 'react';

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
}

// In-memory store (would be backed by Supabase in production)
let storeState: StoreState = {
  user: null,
  wallet: null,
  currentSession: null,
  isConnecting: false,
  isWalletCreating: false,
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

// Demo login flow
export async function loginWithSphere(): Promise<void> {
  setStore({ isConnecting: true });
  await new Promise(r => setTimeout(r, 1800));

  const demoUser: User = {
    id: 'demo-user-001',
    nametag: 'watchpay_demo',
    realNametag: '@demo_sphere_user',
    directAddress: 'DIRECT://02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    isCreator: true,
  };

  const demoWallet: AppWallet = {
    address: 'DIRECT://02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
    nametag: 'watchpay_demo',
    balance: 2.45000000,
    lastUpdated: new Date().toISOString(),
  };

  setStore({ user: demoUser, wallet: demoWallet, isConnecting: false });
}

export async function disconnectWallet(): Promise<void> {
  setStore({ user: null, wallet: null, currentSession: null });
}

export async function refreshBalance(): Promise<void> {
  if (!storeState.wallet) return;
  await new Promise(r => setTimeout(r, 600));
  setStore({
    wallet: {
      ...storeState.wallet,
      balance: storeState.wallet.balance + (Math.random() * 0.001 - 0.0005),
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
  await new Promise(r => setTimeout(r, 2500));
  const txId = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
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
  await new Promise(r => setTimeout(r, 2500));
  const txId = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
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
