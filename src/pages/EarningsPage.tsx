import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Zap } from 'lucide-react';
import { useStore } from '../lib/store';

function formatNum(n: number) {
  return n.toFixed(4).replace(/\.?0+$/, '') || '0';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

const SETTLEMENT_THRESHOLD = 5;

export function EarningsPage() {
  const { user } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<Array<{ id: string; amount: number; tx_id: string; memo: string; timestamp: string }>>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [videoEarnings, setVideoEarnings] = useState<Array<{ video_id: string; title: string; total_earned: number }>>([]);

 const refetchAll = () => {
    if (!user) return;
    fetch(`/api/settlements?creator_id=${user.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(setSettlements)
      .catch(() => {});
    fetch(`/api/pending-for-creator?creator_id=${user.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setPendingAmount(d.amount_owed ?? 0))
      .catch(() => {});
    fetch(`/api/video-earnings?creator_id=${user.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(setVideoEarnings)
      .catch(() => {});
  };

  useEffect(() => {
    refetchAll();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="font-orbitron text-4xl font-bold mb-4" style={{ color: '#2a2a2a' }}>AUTH REQUIRED</div>
          <div className="text-sm" style={{ color: '#444' }}>Connect your Sphere wallet to view your earnings.</div>
        </motion.div>
      </div>
    );
  }

  const totalEarned = settlements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-orbitron text-4xl font-bold mb-2" style={{ color: '#fff' }}>
          EARNINGS <span style={{ color: '#ff6b00' }}>DASHBOARD</span>
        </h1>
        <div className="flex items-center justify-between">
          <p style={{ color: '#555', fontSize: '0.95rem' }}>
            Real on-chain settlements from the autonomous agent · @{user.nametag}
          </p>
          <button
            onClick={refetchAll}
            className="px-3 py-1.5 rounded-lg font-orbitron text-xs"
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#888', cursor: 'pointer' }}
          >
            ↻ REFRESH
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-6 rounded-xl"
        style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
      >
        <div className="font-orbitron text-xs mb-4" style={{ color: '#555', letterSpacing: '0.1em' }}>
          PENDING (FROM VIEWER TICKS)
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="font-orbitron text-3xl font-bold" style={{ color: '#ff6b00' }}>{formatNum(pendingAmount)}</div>
            <div className="text-xs mt-1" style={{ color: '#555' }}>WP EARNED</div>
          </div>
          <div className="font-orbitron text-2xl" style={{ color: '#555' }}>=</div>
          <div className="text-center">
            <div className="font-orbitron text-3xl font-bold" style={{ color: '#00ff88' }}>{formatNum(pendingAmount)}</div>
            <div className="text-xs mt-1" style={{ color: '#555' }}>UCT YOU'LL RECEIVE</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-center" style={{ color: '#444' }}>
          {pendingAmount >= SETTLEMENT_THRESHOLD
            ? `Above the ${SETTLEMENT_THRESHOLD} UCT threshold — will be paid on the next agent run (00:00 or 12:00 UTC).`
            : `Needs to reach ${SETTLEMENT_THRESHOLD} UCT before the agent pays out (runs twice daily).`}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 rounded-xl"
        style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
      >
        <div className="font-orbitron text-xs mb-4" style={{ color: '#555', letterSpacing: '0.1em' }}>
          EARNINGS BY VIDEO
        </div>
        {videoEarnings.length > 0 ? (
          <div className="space-y-2">
            {videoEarnings.map(v => (
              <div key={v.video_id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <span className="text-sm" style={{ color: '#fff' }}>{v.title}</span>
                <span className="font-orbitron text-sm font-bold" style={{ color: '#ff6b00' }}>{formatNum(v.total_earned)} WP</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-sm" style={{ color: '#555' }}>No earnings yet.</div>
            <div className="text-xs mt-1" style={{ color: '#444' }}>Once someone watches your videos, per-video WP earnings will show here.</div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 p-4 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.15)' }}
      >
        <Zap size={18} style={{ color: '#ff6b00', flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs leading-relaxed" style={{ color: '#666' }}>
          Twice daily (00:00 and 12:00 UTC), the agent pays out any creator whose pending balance is at least{' '}
          <strong style={{ color: '#ff6b00' }}>{SETTLEMENT_THRESHOLD} UCT</strong>, sending real UCT directly to your Sphere wallet.
          Total earned so far: <strong style={{ color: '#00ff88' }}>{formatNum(totalEarned)} UCT</strong> across{' '}
          <strong style={{ color: '#fff' }}>{settlements.length}</strong> payouts.
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="font-orbitron text-sm font-bold mb-4" style={{ color: '#fff' }}>PAYOUT HISTORY</div>

        <div className="space-y-3">
          {settlements.map((settlement, i) => (
            <motion.div
              key={settlement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => setSelected(selected === settlement.id ? null : settlement.id)}
              className="cursor-pointer rounded-xl overflow-hidden transition-all p-4"
              style={{
                background: selected === settlement.id ? '#0f0f0f' : '#0a0a0a',
                border: `1px solid ${selected === settlement.id ? 'rgba(255,107,0,0.3)' : '#1a1a1a'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm" style={{ color: '#fff' }}>
                  Agent sent <strong style={{ color: '#ff6b00' }}>{formatNum(settlement.amount)} WP</strong> ={' '}
                  <strong style={{ color: '#00ff88' }}>{formatNum(settlement.amount)} UCT</strong> to @{user.nametag}
                </div>
                <span className="text-xs" style={{ color: '#444' }}>{formatDate(settlement.timestamp)}</span>
              </div>
              {selected === settlement.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <div className="text-xs break-all mb-2" style={{ color: '#ff6b0088' }}>TX: {settlement.tx_id}</div>
                  <a
                    href={`https://explorer.unicity.network/tx/${settlement.tx_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 font-orbitron text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', color: '#ff6b00', textDecoration: 'none' }}
                  >
                    <ExternalLink size={11} /> VIEW ON EXPLORER
                  </a>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {settlements.length === 0 && (
          <div className="text-center py-16 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
            <div className="font-orbitron text-xl mb-2" style={{ color: '#2a2a2a' }}>NO PAYOUTS YET</div>
            <div className="text-xs" style={{ color: '#444' }}>
              Once your pending balance hits {SETTLEMENT_THRESHOLD} UCT, the daily agent run will pay you.
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}