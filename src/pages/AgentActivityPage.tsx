import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Shield, TrendingUp, Clock, RefreshCw, Terminal, Cpu } from 'lucide-react';
import { AgentLogItem, type AgentLog } from '../components/AgentLogItem';
// fetch real logs/stats from Supabase agent_log table instead

function StatCard({ label, value, icon: Icon, color = '#ff6b00' }: { label: string; value: string; icon: React.ElementType; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="metric-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color }} />
        <span className="text-xs font-orbitron" style={{ color: '#444', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
          {label.toUpperCase()}
        </span>
      </div>
      <div className="font-orbitron text-xl font-bold" style={{ color }}>
        {value}
      </div>
    </motion.div>
  );
}



export function AgentActivityPage() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    fetch('/api/agent-logs', { cache: 'no-store' }).then(r => r.json()).then(setLogs).catch(() => {});
    fetch('/api/watch-stats', { cache: 'no-store' }).then(r => r.json()).then(d => setActiveSessions(d.activeSessions ?? 0)).catch(() => {});
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'settlement'>('all');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [nextRunLabel, setNextRunLabel] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const next = new Date(now);
      const hour = now.getUTCHours();
      if (hour < 12) {
        next.setUTCHours(12, 0, 0, 0);
      } else {
        next.setUTCDate(next.getUTCDate() + 1);
        next.setUTCHours(0, 0, 0, 0);
      }
      const diffMs = next.getTime() - now.getTime();
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      setNextRunLabel(`${h}h ${m}m`);
    };
    compute();
    const interval = setInterval(compute, 30000);
    return () => clearInterval(interval);
  }, []);


  // Terminal — shows real recent agent_log entries, formatted as terminal-style lines
  useEffect(() => {
    if (!showTerminal) { setTerminalLines([]); return; }
    const recentLogs = (logs as AgentLog[]).slice(0, 15).reverse();
    const lines = recentLogs.map(l => {
      if (l.action_type === 'settlement') {
        const txId = String(l.details?.tx_id ?? '');
        return `> [AGENT] settlement: ${l.details?.creator_nametag ?? '?'} +${l.details?.amount ?? '?'} UCT tx=${txId.slice(0, 16)}...`;
      }
      return `> [AGENT] ${l.action_type}: ${JSON.stringify(l.details)}`;
    });
    if (lines.length === 0) {
      lines.push('> [AGENT] No log entries yet.');
    }
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        setTerminalLines(prev => [...prev, lines[i]]);
        i++;
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [showTerminal, logs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.action_type === filter);

 

  const settlementCount = logs.filter(l => l.action_type === 'settlement').length;
  const checkCount = logs.filter(l => l.action_type === 'balance_check').length;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-orbitron text-4xl font-bold mb-1" style={{ color: '#fff' }}>
              AGENT <span style={{ color: '#ff6b00' }}>ACTIVITY</span>
            </h1>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88' }}
              />
              <span className="text-xs font-orbitron" style={{ color: '#00ff88', letterSpacing: '0.08em' }}>
                AGENT RUNNING · PUBLIC AUDIT LOG
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-orbitron text-xs"
              style={{ background: '#111', border: '1px solid #2a2a2a', color: '#555', cursor: 'pointer' }}
            >
              <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
                <RefreshCw size={13} />
              </motion.div>
              REFRESH
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Settled" value={`${logs.filter(l => l.action_type === 'settlement').reduce((s, l) => s + Number(l.details?.amount ?? 0), 0).toFixed(4)} UCT`} icon={TrendingUp} />
        <StatCard label="Active Sessions" value={String(activeSessions)} icon={Activity} />
        <StatCard label="Creators Paying" value={String(new Set(logs.filter(l => l.action_type === 'settlement').map(l => l.details?.creator_nametag)).size)} icon={Zap} />
        <StatCard label="Settlements Logged" value={String(settlementCount)} icon={Clock} color="#888" />
      </div>

      {/* Next agent run countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 p-5 rounded-xl flex items-center gap-5"
        style={{
          background: 'linear-gradient(135deg, #0f0f0f, #0a0a0a)',
          border: '1px solid rgba(255,107,0,0.15)',
        }}
      >
        <div className="relative w-20 h-20 flex-shrink-0 rounded-full flex items-center justify-center" style={{ border: '3px solid rgba(255,107,0,0.2)' }}>
          <div className="text-center">
            <div className="font-orbitron text-xs font-bold" style={{ color: '#ff6b00' }}>
              {nextRunLabel}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-orbitron text-sm font-bold mb-1" style={{ color: '#ff6b00' }}>
            NEXT SETTLEMENT CYCLE
          </div>
          <div className="text-xs mb-3" style={{ color: '#555' }}>
           QStash fires <code style={{ color: '#ff6b0066' }}>POST /api/agent-settle</code> twice daily (00:00 and 12:00 UTC).
            The agent queries <code style={{ color: '#ff6b0066' }}>pending_settlements</code> and calls{' '}
            <code style={{ color: '#ff6b0066' }}>sphere.payments.send()</code> for creators at or above the 5 UCT threshold.
          </div>
          <div className="flex gap-4 text-xs" style={{ color: '#555' }}>
            <span>Settlements logged: <strong style={{ color: '#ff6b00' }}>{settlementCount}</strong></span>
            <span>Balance checks: <strong style={{ color: '#888' }}>{checkCount}</strong></span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <Cpu size={32} style={{ color: '#ff6b0022' }} />
        </div>
      </motion.div>

      {/* Terminal */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 200 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 rounded-xl overflow-hidden"
            style={{ background: '#050505', border: '1px solid #1a1a1a' }}
          >
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-900">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              <span className="ml-2 font-orbitron text-xs" style={{ color: '#444' }}>
                agent/settle — watchpay.vercel.app
              </span>
            </div>
            {/* Terminal content */}
            <div
              ref={terminalRef}
              className="p-4 font-mono text-xs overflow-y-auto"
              style={{ height: 160, color: '#888', lineHeight: 1.6 }}
            >
              {terminalLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    color: line.includes('[SDK]') ? '#ff6b00'
                      : line.includes('[DB]') ? '#888'
                      : line.includes('complete') ? '#00ff88'
                      : '#666',
                  }}
                >
                  {line}
                </motion.div>
              ))}
              {terminalLines.length > 0 && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ color: '#ff6b00' }}
                >█</motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 mb-6"
      >
        {(['all', 'settlement'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-lg font-orbitron text-xs font-bold tracking-wider transition-all"
            style={{
              background: filter === f ? 'rgba(255,107,0,0.15)' : 'transparent',
              border: `1px solid ${filter === f ? 'rgba(255,107,0,0.4)' : '#2a2a2a'}`,
              color: filter === f ? '#ff6b00' : '#555',
              cursor: 'pointer',
            }}
          >
            {f === 'all' ? `ALL (${logs.length})` : `SETTLEMENTS (${settlementCount})`}
          </button>
        ))}
      </motion.div>

      {/* Log list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredLogs.map((log, i) => (
            <AgentLogItem key={log.id} log={log} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-20" style={{ color: '#333' }}>
          <div className="font-orbitron text-xl mb-2">NO LOGS</div>
          <div className="text-xs">The agent hasn't run yet.</div>
        </div>
      )}

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-5 rounded-xl"
        style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
      >
        <div className="font-orbitron text-xs mb-4" style={{ color: '#555', letterSpacing: '0.1em' }}>
          AGENT ARCHITECTURE
        </div>
        <div className="text-xs" style={{ color: '#555', lineHeight: 1.7 }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} style={{ color: '#ff6b00' }} />
              <strong style={{ color: '#888' }}>Settlement Agent</strong>
            </div>
            <p>Triggered every 5–10 min by QStash. Queries <code style={{ color: '#ff6b0066' }}>pending_settlements</code>, 
            calls <code style={{ color: '#ff6b0066' }}>sphere.payments.send()</code> for each creator.
            Logs real <code style={{ color: '#ff6b0066' }}>tx_id</code> from the SDK response.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={12} style={{ color: '#888' }} />
              <strong style={{ color: '#888' }}>Balance Check Agent</strong>
            </div>
            <p>Triggered every 5 min by QStash. Queries active sessions, checks viewer balances.
            Sends DM alerts via <code style={{ color: '#ff6b0066' }}>sphere.communications.sendDM()</code> 
            for wallets with &lt;3 ticks remaining.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
