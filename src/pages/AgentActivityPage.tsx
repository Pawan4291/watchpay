import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Shield, TrendingUp, Clock, RefreshCw, Terminal, Cpu } from 'lucide-react';
import { AgentLogItem, type AgentLog } from '../components/AgentLogItem';
import { DEMO_AGENT_LOGS, DEMO_STATS } from '../lib/constants';

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

const TERMINAL_LINES = [
  '> [AGENT] Starting settlement cycle...',
  '> [DB] Querying pending_settlements WHERE amount_owed > 0',
  '> [DB] Found 3 creators with pending amounts',
  '> [SDK] sphere.payments.send({ recipient: "@satoshi_dev", amount: "4320000", coinId: "f581d30f..." })',
  '> [SDK] TransferResult: { status: "completed", deliveryPending: false }',
  '> [DB] Reset pending_settlements.amount_owed = 0 for creator c1',
  '> [DB] Inserted into settlements: tx_id=a3f8c2d1...',
  '> [AGENT] Settlement cycle complete. 3 settled, 0 failed.',
];

export function AgentActivityPage() {
  const [logs, setLogs] = useState<AgentLog[]>(DEMO_AGENT_LOGS as AgentLog[]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'settlement' | 'balance_check'>('all');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [nextRunSeconds, setNextRunSeconds] = useState(220);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNextRunSeconds(n => {
        if (n <= 1) return 300; // reset to 5 min
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate new log entries
  useEffect(() => {
    const interval = setInterval(() => {
      const isSett = Math.random() > 0.5;
      const newLog: AgentLog = isSett ? {
        id: `log_${Date.now()}`,
        action_type: 'settlement',
        details: {
          creator_nametag: `@creator_${Math.floor(Math.random() * 10)}`,
          amount: (Math.random() * 0.05 + 0.001).toFixed(8),
          tx_id: Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          creator_id: `c${Math.floor(Math.random() * 6) + 1}`,
          viewers_count: Math.floor(Math.random() * 20) + 1,
          memo: `Watch payment settlement — ${(Math.random() * 0.05).toFixed(8)} UCT`,
        },
        timestamp: new Date().toISOString(),
      } : {
        id: `log_${Date.now()}`,
        action_type: 'balance_check',
        details: {
          active_sessions: Math.floor(Math.random() * 60) + 10,
          wallets_checked: Math.floor(Math.random() * 60) + 10,
          low_balance_alerts: Math.floor(Math.random() * 5),
          alert_recipients: [],
        },
        timestamp: new Date().toISOString(),
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, 15000); // new log every 15s for demo

    return () => clearInterval(interval);
  }, []);

  // Terminal animation
  useEffect(() => {
    if (!showTerminal) { setTerminalLines([]); return; }
    let i = 0;
    const interval = setInterval(() => {
      if (i < TERMINAL_LINES.length) {
        setTerminalLines(prev => [...prev, TERMINAL_LINES[i]]);
        i++;
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [showTerminal]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.action_type === filter);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
              onClick={() => setShowTerminal(t => !t)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-orbitron text-xs"
              style={{
                background: showTerminal ? 'rgba(255,107,0,0.15)' : '#111',
                border: `1px solid ${showTerminal ? 'rgba(255,107,0,0.4)' : '#2a2a2a'}`,
                color: showTerminal ? '#ff6b00' : '#555',
                cursor: 'pointer',
              }}
            >
              <Terminal size={13} />
              TERMINAL
            </motion.button>
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
        <StatCard label="Total Settled" value={DEMO_STATS.totalSettled} icon={TrendingUp} />
        <StatCard label="Active Sessions" value={String(DEMO_STATS.activeSessions)} icon={Activity} />
        <StatCard label="Creators Paying" value={String(DEMO_STATS.totalCreators)} icon={Zap} />
        <StatCard label="Agent Uptime" value={DEMO_STATS.agentUptime} icon={Shield} color="#00ff88" />
        <StatCard label="Avg Settle Time" value={DEMO_STATS.avgSettlementTime} icon={Clock} color="#888" />
        <StatCard label="TXs Last 24h" value={String(DEMO_STATS.txsLast24h)} icon={Activity} />
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
        <div
          className="relative w-20 h-20 flex-shrink-0"
        >
          <svg className="w-20 h-20 countdown-ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#1a1a1a" strokeWidth="4" />
            <motion.circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#ff6b00"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - nextRunSeconds / 300) }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-orbitron text-sm font-bold" style={{ color: '#ff6b00' }}>
                {formatCountdown(nextRunSeconds)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-orbitron text-sm font-bold mb-1" style={{ color: '#ff6b00' }}>
            NEXT SETTLEMENT CYCLE
          </div>
          <div className="text-xs mb-3" style={{ color: '#555' }}>
            QStash fires <code style={{ color: '#ff6b0066' }}>POST /api/agent/settle</code> every 5 minutes.
            The agent queries <code style={{ color: '#ff6b0066' }}>pending_settlements</code> and calls{' '}
            <code style={{ color: '#ff6b0066' }}>sphere.payments.send()</code> for each creator.
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
              {terminalLines.length > 0 && terminalLines.length < TERMINAL_LINES.length && (
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
        {(['all', 'settlement', 'balance_check'] as const).map(f => (
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
            {f === 'all' ? `ALL (${logs.length})`
              : f === 'settlement' ? `SETTLEMENTS (${settlementCount})`
              : `CHECKS (${checkCount})`}
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
        <div className="grid md:grid-cols-2 gap-4 text-xs" style={{ color: '#555', lineHeight: 1.7 }}>
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
