import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownUp, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useStore, refreshBalance, depositUCT, withdrawUCT } from '../lib/store';
import { WATCHPAY_AGENT_NAMETAG } from '../lib/constants';

type Mode = null | 'buy' | 'sell';

export function WalletCard() {
  const { wallet, user } = useStore();
  const [mode, setMode] = useState<Mode>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'buy' | 'sell'; txId: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!wallet || !user) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleBuy = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setLoading(true);
    try {
      const res = await depositUCT(amt);
      if (res.success) {
        setStatus({ type: 'buy', txId: res.txId || 'Credited' });
        setAmount('');
        setMode(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || amt > wallet.balance) return;
    setLoading(true);
    try {
      const res = await withdrawUCT(amt);
      if (res.success) {
        setStatus({ type: 'sell', txId: res.txId || 'pending confirmation' });
        setAmount('');
        setMode(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl"
      style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%)', border: '1px solid rgba(255,107,0,0.2)', boxShadow: '0 0 40px rgba(255,107,0,0.05)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #ff6b00, transparent)' }} />

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}>
              <Wallet size={18} style={{ color: '#ff6b00' }} />
            </div>
            <div>
              <div className="font-orbitron text-sm font-bold" style={{ color: '#ff6b00' }}>WP POINTS</div>
              <div className="text-xs" style={{ color: '#555' }}>backed by real UCT in {WATCHPAY_AGENT_NAMETAG}</div>
            </div>
          </div>
          <motion.button onClick={handleRefresh} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg" style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.1)' }}>
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw size={14} style={{ color: '#ff6b0088' }} />
            </motion.div>
          </motion.button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-orbitron tracking-widest mb-2" style={{ color: '#555' }}>WP POINT BALANCE</div>
          <motion.div key={wallet.balance} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="font-orbitron text-4xl font-bold" style={{ color: '#ff6b00', textShadow: '0 0 30px rgba(255,107,0,0.5)' }}>
            {wallet.balance.toFixed(4)}<span className="text-lg ml-2" style={{ color: '#ff6b0066' }}>WP</span>
          </motion.div>
        </div>

        <div className="mb-5 p-3 rounded-lg text-xs" style={{ background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.1)', color: '#ff6b0088', lineHeight: 1.6 }}>
          <AlertCircle size={12} className="inline mr-1.5" />
          1 WP = 1 UCT. Buy sends real UCT to {WATCHPAY_AGENT_NAMETAG}; Sell sends real UCT back to your Sphere wallet.
        </div>

        <div className="flex gap-3 mb-4">
          <motion.button onClick={() => { setMode(mode === 'buy' ? null : 'buy'); setAmount(''); }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-lg font-orbitron text-xs font-bold tracking-widest"
            style={{ background: mode === 'buy' ? 'rgba(255,107,0,0.2)' : 'rgba(255,107,0,0.08)', border: `1px solid ${mode === 'buy' ? '#ff6b00' : 'rgba(255,107,0,0.2)'}`, color: '#ff6b00' }}>
            BUY WP
          </motion.button>
          <motion.button onClick={() => { setMode(mode === 'sell' ? null : 'sell'); setAmount(''); }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-lg font-orbitron text-xs font-bold tracking-widest"
            style={{ background: mode === 'sell' ? 'rgba(255,107,0,0.1)' : 'transparent', border: `1px solid ${mode === 'sell' ? '#ff6b0066' : '#2a2a2a'}`, color: mode === 'sell' ? '#ff6b00' : '#555' }}>
            SELL WP
          </motion.button>
        </div>

        <AnimatePresence>
          {mode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="p-4 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                {/* top box */}
                <div className="p-3 rounded-lg mb-1" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                  <div className="text-[10px] font-orbitron mb-1" style={{ color: '#555' }}>{mode === 'buy' ? 'YOU PAY' : 'YOU SELL'}</div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.001" className="input-dark flex-1" style={{ fontSize: '1rem', background: 'transparent', border: 'none' }} />
                    <span className="font-orbitron text-xs font-bold" style={{ color: '#ff6b00' }}>{mode === 'buy' ? 'UCT' : 'WP'}</span>
                  </div>
                </div>

                <div className="flex justify-center -my-2 relative z-10">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1a1a1a', border: '2px solid #0a0a0a' }}>
                    <ArrowDownUp size={12} style={{ color: '#ff6b00' }} />
                  </div>
                </div>

                {/* bottom box */}
                <div className="p-3 rounded-lg mt-1 mb-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                  <div className="text-[10px] font-orbitron mb-1" style={{ color: '#555' }}>{mode === 'buy' ? 'YOU RECEIVE' : 'YOU RECEIVE'}</div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm" style={{ color: '#888' }}>{amount || '0.00'}</span>
                    <span className="font-orbitron text-xs font-bold" style={{ color: '#ff6b00' }}>{mode === 'buy' ? 'WP' : 'UCT'}</span>
                  </div>
                </div>

                {mode === 'sell' && parseFloat(amount) > wallet.balance && (
                  <div className="text-xs mb-2" style={{ color: '#ff4444' }}>Insufficient WP balance</div>
                )}

                <motion.button
                  onClick={mode === 'buy' ? handleBuy : handleSell}
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-lg font-orbitron text-xs font-bold tracking-widest flex items-center justify-center gap-2"
                  style={{ background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #ff6b00, #ff8c00)', color: loading ? '#555' : 'white', border: 'none' }}
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" />PROCESSING</> : mode === 'buy' ? 'CONFIRM BUY' : 'CONFIRM SELL'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {status && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={12} style={{ color: '#00ff88' }} />
                <span className="text-xs font-orbitron" style={{ color: '#00ff88' }}>{status.type === 'buy' ? 'BUY CONFIRMED' : 'SELL CONFIRMED'}</span>
              </div>
              <div className="text-xs mt-1 truncate" style={{ color: '#00ff8888' }}>{status.txId}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}