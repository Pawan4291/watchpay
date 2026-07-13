import { motion } from 'framer-motion';
import { Zap, Shield, ExternalLink, Clock, Users, CheckCircle } from 'lucide-react';

export interface AgentLog {
  id: string;
  action_type: 'settlement' | 'balance_check';
  details: Record<string, unknown>;
  timestamp: string;
}

interface AgentLogItemProps {
  log: AgentLog;
  index: number;
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function AgentLogItem({ log, index }: AgentLogItemProps) {
  const isSettlement = log.action_type === 'settlement';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="relative overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a, #0f0f0f)',
        border: `1px solid ${isSettlement ? 'rgba(255,107,0,0.2)' : 'rgba(100,100,100,0.2)'}`,
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{
          background: isSettlement
            ? 'linear-gradient(to bottom, #ff6b00, #ff8c00)'
            : 'linear-gradient(to bottom, #444, #333)',
        }}
      />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Icon + type */}
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: isSettlement ? 'rgba(255,107,0,0.1)' : 'rgba(100,100,100,0.1)',
                border: `1px solid ${isSettlement ? 'rgba(255,107,0,0.3)' : 'rgba(100,100,100,0.2)'}`,
              }}
            >
              {isSettlement
                ? <Zap size={14} style={{ color: '#ff6b00' }} />
                : <Shield size={14} style={{ color: '#888' }} />
              }
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-orbitron text-xs font-bold tracking-wider"
                  style={{ color: isSettlement ? '#ff6b00' : '#888' }}
                >
                  {isSettlement ? 'SETTLEMENT' : 'BALANCE CHECK'}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-orbitron"
                  style={{
                    background: 'rgba(0,255,136,0.08)',
                    border: '1px solid rgba(0,255,136,0.2)',
                    color: '#00ff88',
                    fontSize: '0.55rem',
                    letterSpacing: '0.08em',
                  }}
                >
                  <CheckCircle size={8} />
                  CONFIRMED
                </span>
              </div>

              {/* Settlement details */}
              {isSettlement && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs" style={{ color: '#666' }}>To:</span>
                    <span className="text-xs font-bold" style={{ color: '#ff6b00' }}>
                      {String(log.details['creator_nametag'] ?? '')}
                    </span>
                    <span className="text-xs" style={{ color: '#666' }}>Amount:</span>
                    <span className="text-xs font-orbitron font-bold" style={{ color: '#fff' }}>
                      {String(log.details['amount'] ?? '0')} UCT
                    </span>
                    {log.details['viewers_count'] !== undefined && (
                      <>
                        <span className="text-xs" style={{ color: '#666' }}>from</span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#888' }}>
                          <Users size={10} />
                          {String(log.details['viewers_count'])} viewers
                        </span>
                      </>
                    )}
                  </div>
                  {!!log.details['tx_id'] && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#555' }}>TX:</span>
                      <span
                        className="font-orbitron text-xs truncate max-w-[200px]"
                        style={{ color: '#ff6b0088', fontSize: '0.6rem' }}
                        title={String(log.details['tx_id'])}
                      >
                        {String(log.details['tx_id'])}
                      </span>
                      <a
                        href={`https://explorer.unicity.network/tx/${String(log.details['tx_id'])}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        style={{ color: '#ff6b0066' }}
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                  {!!log.details['memo'] && (
                    <div className="text-xs italic" style={{ color: '#444' }}>
                      &quot;{String(log.details['memo'])}&quot;
                    </div>
                  )}
                </div>
              )}

              {/* Balance check details */}
              {!isSettlement && (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-xs" style={{ color: '#666' }}>
                    <span style={{ color: '#888' }}>Sessions: </span>
                    <span style={{ color: '#fff' }}>{String(log.details['active_sessions'] ?? 0)}</span>
                  </div>
                  <div className="text-xs" style={{ color: '#666' }}>
                    <span style={{ color: '#888' }}>Checked: </span>
                    <span style={{ color: '#fff' }}>{String(log.details['wallets_checked'] ?? 0)}</span>
                  </div>
                  <div className="text-xs" style={{ color: '#666' }}>
                    <span style={{ color: '#888' }}>Low balance alerts: </span>
                    <span style={{ color: Number(log.details['low_balance_alerts']) > 0 ? '#ff6b00' : '#00ff88' }}>
                      {String(log.details['low_balance_alerts'] ?? 0)}
                    </span>
                  </div>
                  {Array.isArray(log.details['alert_recipients']) && (log.details['alert_recipients'] as string[]).length > 0 && (
                    <div className="text-xs w-full" style={{ color: '#555' }}>
                      Alerted: {(log.details['alert_recipients'] as string[]).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 flex-shrink-0 text-xs" style={{ color: '#444' }}>
            <Clock size={10} />
            <span className="font-orbitron" style={{ fontSize: '0.6rem' }}>
              {formatTimeAgo(log.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle shine on settlement */}
      {isSettlement && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, delay: index * 0.1 + 0.5 }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,107,0,0.03), transparent)',
          }}
        />
      )}
    </motion.div>
  );
}
