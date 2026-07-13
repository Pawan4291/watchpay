import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Copy, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { useStore, depositUCT, withdrawUCT, refreshBalance } from '../lib/store';

export function WalletCard() {
  const { wallet, user } = useStore();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [mode, setMode] = useState<null | 'deposit' | 'withdraw'>(null);
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [txType, setTxType] = useState<'deposit' | 'withdraw' | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!wallet || !user) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      const res = await depositUCT(amount);
      if (res.success && res.txId) {
        setLastTx(res.txId);
        setTxType('deposit');
        setDepositAmount('');
        setMode(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || amount > wallet.balance) return;
    setLoading(true);
    try {
      const res = await withdrawUCT(amount);
      if (res.success && res.txId) {
        setLastTx(res.txId);
        setTxType('withdraw');
        setWithdrawAmount('');
        setMode(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%)',
        border: '1px solid rgba(255,107,0,0.2)',
        boxShadow: '0 0 40px rgba(255,107,0,0.05), inset 0 0 40px rgba(255,107,0,0.02)',
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #ff6b00, transparent)' }}
      />

      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,107,0,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}
            >
              <Wallet size={18} style={{ color: '#ff6b00' }} />
            </div>
            <div>
              <div className="font-orbitron text-sm font-bold" style={{ color: '#ff6b00' }}>
                APP WALLET
              </div>
              <div className="text-xs" style={{ color: '#555' }}>
                @{wallet.nametag}
              </div>
            </div>
          </div>

          <motion.button
            onClick={handleRefresh}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg"
            style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.1)' }}
          >
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw size={14} style={{ color: '#ff6b0088' }} />
            </motion.div>
          </motion.button>
        </div>

        {/* Balance */}
        <div className="mb-6">
          <div className="text-xs font-orbitron tracking-widest mb-2" style={{ color: '#555' }}>
            BALANCE (VERIFIED ON-CHAIN)
          </div>
          <motion.div
            key={wallet.balance}
            initial={{ scale: 1.05, color: '#ff8c00' }}
            animate={{ scale: 1, color: '#ff6b00' }}
            transition={{ duration: 0.3 }}
            className="font-orbitron text-4xl font-bold"
            style={{ textShadow: '0 0 30px rgba(255,107,0,0.5)' }}
          >
            {wallet.balance.toFixed(8)}
            <span className="text-lg ml-2" style={{ color: '#ff6b0066' }}>UCT</span>
          </motion.div>
          <div className="text-xs mt-1" style={{ color: '#333' }}>
            Last updated: {new Date(wallet.lastUpdated).toLocaleTimeString()}
          </div>
        </div>

        {/* Architecture note */}
        <div
          className="mb-5 p-3 rounded-lg text-xs"
          style={{
            background: 'rgba(255,107,0,0.04)',
            border: '1px solid rgba(255,107,0,0.1)',
            color: '#ff6b0088',
            lineHeight: 1.6,
          }}
        >
          <AlertCircle size={12} className="inline mr-1.5" style={{ color: '#ff6b0066' }} />
          <strong>Custodial app wallet</strong> — managed server-side for silent billing. Your real Sphere wallet stays fully user-controlled for deposit/withdraw.
        </div>

        {/* Address */}
        <div className="mb-5">
          <div className="text-xs font-orbitron tracking-widest mb-2" style={{ color: '#555' }}>
            WALLET ADDRESS
          </div>
          <div
            className="p-3 rounded-lg flex items-center justify-between gap-2"
            style={{ background: '#111', border: '1px solid #1a1a1a' }}
          >
            <span className="tx-hash text-xs truncate" style={{ fontSize: '0.6rem' }}>
              {wallet.address}
            </span>
            <motion.button
              onClick={() => handleCopy(wallet.address)}
              whileTap={{ scale: 0.9 }}
              style={{ color: copied ? '#00ff88' : '#ff6b0066', flexShrink: 0 }}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            </motion.button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-4">
          <motion.button
            onClick={() => setMode(mode === 'deposit' ? null : 'deposit')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-orbitron text-xs font-bold tracking-widest"
            style={{
              background: mode === 'deposit' ? 'rgba(255,107,0,0.2)' : 'rgba(255,107,0,0.08)',
              border: `1px solid ${mode === 'deposit' ? '#ff6b00' : 'rgba(255,107,0,0.2)'}`,
              color: '#ff6b00',
            }}
          >
            <TrendingDown size={14} />
            DEPOSIT
          </motion.button>
          <motion.button
            onClick={() => setMode(mode === 'withdraw' ? null : 'withdraw')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-orbitron text-xs font-bold tracking-widest"
            style={{
              background: mode === 'withdraw' ? 'rgba(255,107,0,0.1)' : 'transparent',
              border: `1px solid ${mode === 'withdraw' ? '#ff6b0066' : '#2a2a2a'}`,
              color: mode === 'withdraw' ? '#ff6b00' : '#555',
            }}
          >
            <TrendingUp size={14} />
            WITHDRAW
          </motion.button>
        </div>

        {/* Deposit/Withdraw form */}
        <AnimatePresence>
          {mode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-2">
                <div
                  className="p-4 rounded-lg"
                  style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
                >
                  <div className="text-xs font-orbitron mb-3" style={{ color: '#555', letterSpacing: '0.1em' }}>
                    {mode === 'deposit'
                      ? 'Your real Sphere wallet sends UCT via sphere.intent("send")'
                      : 'Agent sends UCT from app wallet to your real Sphere wallet'}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={mode === 'deposit' ? depositAmount : withdrawAmount}
                      onChange={e => mode === 'deposit' ? setDepositAmount(e.target.value) : setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.001"
                      className="input-dark flex-1"
                      style={{ fontSize: '0.85rem' }}
                    />
                    <motion.button
                      onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
                      disabled={loading}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-5 rounded-lg font-orbitron text-xs font-bold tracking-wider"
                      style={{
                        background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                        color: loading ? '#555' : 'white',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loading ? '...' : mode === 'deposit' ? 'SEND' : 'WITHDRAW'}
                    </motion.button>
                  </div>
                  {mode === 'withdraw' && parseFloat(withdrawAmount) > wallet.balance && (
                    <div className="text-xs mt-2" style={{ color: '#ff4444' }}>
                      Insufficient balance
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last TX */}
        <AnimatePresence>
          {lastTx && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 p-3 rounded-lg"
              style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={12} style={{ color: '#00ff88' }} />
                <span className="text-xs font-orbitron" style={{ color: '#00ff88' }}>
                  {txType === 'deposit' ? 'DEPOSIT CONFIRMED' : 'WITHDRAWAL SENT'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tx-hash truncate text-xs" style={{ fontSize: '0.58rem' }}>
                  TX: {lastTx}
                </span>
                <a
                  href={`https://explorer.unicity.network/tx/${lastTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#ff6b0066', flexShrink: 0 }}
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
