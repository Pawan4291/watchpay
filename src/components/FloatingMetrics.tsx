import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Activity } from 'lucide-react';

interface Notification {
  id: number;
  type: 'tick' | 'settlement' | 'session';
  text: string;
  amount?: string;
}

const TICK_MESSAGES = [
  { type: 'tick' as const, text: '@viewer_3 → @satoshi_dev', amount: '0.001000 UCT' },
  { type: 'tick' as const, text: '@viewer_7 → @alice_builder', amount: '0.002000 UCT' },
  { type: 'settlement' as const, text: 'Agent settled @bob_crypto', amount: '0.018000 UCT' },
  { type: 'tick' as const, text: '@viewer_12 → @satoshi_dev', amount: '0.001000 UCT' },
  { type: 'session' as const, text: '@viewer_21 started watching', amount: undefined },
  { type: 'tick' as const, text: '@viewer_5 → @carol_defi', amount: '0.003000 UCT' },
  { type: 'settlement' as const, text: 'Agent settled @eva_blockchain', amount: '0.04500 UCT' },
  { type: 'tick' as const, text: '@viewer_9 → @dave_engineer', amount: '0.001000 UCT' },
];

export function FloatingNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const template = TICK_MESSAGES[Math.floor(Math.random() * TICK_MESSAGES.length)];
      const notif: Notification = {
        id: Date.now(),
        ...template,
      };
      setNotifications(prev => [...prev.slice(-3), notif]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col gap-2 z-40"
      style={{ maxWidth: 300 }}
    >
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(10,10,10,0.95)',
              border: `1px solid ${notif.type === 'settlement' ? 'rgba(0,255,136,0.2)' : 'rgba(255,107,0,0.2)'}`,
              backdropFilter: 'blur(20px)',
              boxShadow: notif.type === 'settlement'
                ? '0 0 20px rgba(0,255,136,0.1)'
                : '0 0 20px rgba(255,107,0,0.08)',
            }}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: notif.type === 'settlement' ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,0,0.1)',
              }}
            >
              {notif.type === 'settlement'
                ? <TrendingUp size={11} style={{ color: '#00ff88' }} />
                : notif.type === 'session'
                ? <Activity size={11} style={{ color: '#ff6b00' }} />
                : <Zap size={11} style={{ color: '#ff6b00' }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate" style={{ color: '#888' }}>
                {notif.text}
              </div>
              {notif.amount && (
                <div
                  className="font-orbitron font-bold"
                  style={{
                    color: notif.type === 'settlement' ? '#00ff88' : '#ff6b00',
                    fontSize: '0.65rem',
                  }}
                >
                  {notif.type === 'settlement' ? '+' : '−'}{notif.amount}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
