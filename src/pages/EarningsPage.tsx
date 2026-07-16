import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ExternalLink, Award, Clock, Zap, Download } from 'lucide-react';
import { useStore } from '../lib/store';

function formatUCT(n: number) {
  return n.toFixed(8).replace(/\.?0+$/, '');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function EarningsPage() {
  const { user } = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="font-orbitron text-4xl font-bold mb-4" style={{ color: '#2a2a2a' }}>
            AUTH REQUIRED
          </div>
          <div className="text-sm" style={{ color: '#444' }}>
            Connect your Sphere wallet to view your earnings.
          </div>
        </motion.div>
      </div>
    );
  }

  const [settlements, setSettlements] = useState<Array<{ id: string; amount: number; tx_id: string; memo: string; timestamp: string }>>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/settlements?creator_id=${user.id}`)
      .then(r => r.json())
      .then(setSettlements)
      .catch(() => {});
  }, [user]);

  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/pending-for-creator?creator_id=${user.id}`)
      .then(r => r.json())
      .then(d => setPendingAmount(d.amount_owed ?? 0))
      .catch(() => {});
  }, [user]);

  const totalEarned = settlements.reduce((sum, s) => sum + s.amount, 0);
  const avgSettlement = settlements.length > 0 ? totalEarned / settlements.length : 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-orbitron text-4xl font-bold mb-2" style={{ color: '#fff' }}>
          EARNINGS <span style={{ color: '#ff6b00' }}>DASHBOARD</span>
        </h1>
        <p style={{ color: '#555', fontSize: '0.95rem' }}>
          Real on-chain settlements from the autonomous agent · @{user.nametag}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earned', value: `${formatUCT(totalEarned)} UCT`, icon: DollarSign, highlight: true },
          { label: 'Settlements', value: String(settlements.length), icon: Award, highlight: false },
          { label: 'Avg Settlement', value: `${formatUCT(avgSettlement)} UCT`, icon: TrendingUp, highlight: false },
          { label: 'Pending', value: `${formatUCT(pendingAmount)} UCT`, icon: Clock, highlight: false },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="metric-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={13} style={{ color: stat.highlight ? '#ff6b00' : '#555' }} />
              <span className="text-xs font-orbitron" style={{ color: '#444', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                {stat.label.toUpperCase()}
              </span>
            </div>
            <div
              className="font-orbitron text-lg font-bold"
              style={{ color: stat.highlight ? '#ff6b00' : '#fff', textShadow: stat.highlight ? '0 0 20px rgba(255,107,0,0.4)' : 'none' }}
            >
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent info banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 p-4 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.15)' }}
      >
        <Zap size={18} style={{ color: '#ff6b00', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="font-orbitron text-sm font-bold mb-1" style={{ color: '#ff6b00' }}>
            AUTONOMOUS SETTLEMENT AGENT
          </div>
          <div className="text-xs leading-relaxed" style={{ color: '#666' }}>
            Every 5 minutes, the QStash-scheduled agent queries <code style={{ color: '#ff6b0088' }}>pending_settlements</code> and
            calls <code style={{ color: '#ff6b0088' }}>sphere.payments.send()</code> to transfer real UCT from viewer app wallets
            to your real Sphere wallet nametag. Each row below is a real transaction — click the TX ID to verify on-chain.
          </div>
        </div>
      </motion.div>

      {/* Settlements table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="font-orbitron text-sm font-bold" style={{ color: '#fff' }}>
            SETTLEMENT HISTORY
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-orbitron text-xs"
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#555', cursor: 'pointer' }}
          >
            <Download size={11} />
            EXPORT CSV
          </button>
        </div>

        <div className="space-y-3">
          {settlements.map((settlement, i) => (
            <motion.div
              key={settlement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              onClick={() => setSelected(selected === settlement.id ? null : settlement.id)}
              className="cursor-pointer rounded-xl overflow-hidden transition-all"
              style={{
                background: selected === settlement.id ? '#0f0f0f' : '#0a0a0a',
                border: `1px solid ${selected === settlement.id ? 'rgba(255,107,0,0.3)' : '#1a1a1a'}`,
              }}
            >
              {/* Main row */}
              <div className="flex items-center gap-4 p-4">
                {/* Amount */}
                <div className="flex-1 min-w-0">
                  <div className="font-orbitron text-lg font-bold" style={{ color: '#ff6b00' }}>
                    +{formatUCT(settlement.amount)} UCT
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} style={{ color: '#444' }} />
                    <span className="text-xs" style={{ color: '#444' }}>
                      {formatDate(settlement.timestamp)}
                    </span>
                  </div>
                </div>

                {/* TX preview */}
                <div className="hidden md:flex items-center gap-2">
                  <span className="font-orbitron text-xs" style={{ color: '#333', fontSize: '0.6rem' }}>
                    TX: {settlement.tx_id.slice(0, 16)}...
                  </span>
                  <a
                    href={`https://explorer.unicity.network/tx/${settlement.tx_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color: '#ff6b0066' }}
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Status */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff88' }} />
                  <span className="font-orbitron text-xs" style={{ color: '#00ff88', fontSize: '0.6rem', letterSpacing: '0.06em' }}>
                    SETTLED
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {selected === settlement.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-4 pb-4"
                >
                  <div
                    className="p-4 rounded-xl"
                    style={{ background: '#111', border: '1px solid #1a1a1a' }}
                  >
                    <div className="font-orbitron text-xs mb-3" style={{ color: '#555', letterSpacing: '0.1em' }}>
                      TRANSACTION DETAILS
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-3">
                        <span style={{ color: '#555', minWidth: 80 }}>Full TX ID</span>
                        <span className="font-orbitron break-all" style={{ color: '#ff6b0088', fontSize: '0.6rem' }}>
                          {settlement.tx_id}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span style={{ color: '#555', minWidth: 80 }}>Memo</span>
                        <span style={{ color: '#888' }}>{settlement.memo}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span style={{ color: '#555', minWidth: 80 }}>Recipient</span>
                        <span style={{ color: '#ff6b00' }}>@{user.nametag}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span style={{ color: '#555', minWidth: 80 }}>Network</span>
                        <span style={{ color: '#888' }}>Unicity testnet2 (networkId 4)</span>
                      </div>
                      <div className="mt-3">
                        <a
                          href={`https://explorer.unicity.network/tx/${settlement.tx_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-orbitron text-xs px-3 py-1.5 rounded-lg"
                          style={{
                            background: 'rgba(255,107,0,0.1)',
                            border: '1px solid rgba(255,107,0,0.2)',
                            color: '#ff6b00',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={11} />
                          VIEW ON EXPLORER
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {settlements.length === 0 && (
          <div
            className="text-center py-16 rounded-xl"
            style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
          >
            <div className="font-orbitron text-xl mb-2" style={{ color: '#2a2a2a' }}>
              NO SETTLEMENTS YET
            </div>
            <div className="text-xs" style={{ color: '#444' }}>
              Upload a video and wait for viewers — the agent will settle every 5 minutes.
            </div>
          </div>
        )}
      </motion.div>

      {/* Pending settlement preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-5 rounded-xl"
        style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="font-orbitron text-xs font-bold" style={{ color: '#555', letterSpacing: '0.1em' }}>
            PENDING SETTLEMENT (NEXT AGENT RUN)
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#555' }}>
            <Clock size={11} />
            <span>~3 min 22s</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-orbitron text-2xl font-bold" style={{ color: '#ff6b0066' }}>
              {formatUCT(pendingAmount)} UCT
            </div>
            <div className="text-xs mt-1" style={{ color: '#444' }}>
              Awaiting next agent settlement run
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#ff6b00' }}
            />
            <span className="font-orbitron text-xs" style={{ color: '#ff6b00', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
              ACCUMULATING
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
