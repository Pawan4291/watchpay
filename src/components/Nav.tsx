import { motion } from 'framer-motion';
import { Tv, Upload, User, DollarSign, Activity, Zap } from 'lucide-react';

type Tab = 'watch' | 'upload' | 'profile' | 'earnings' | 'agent-activity';

interface NavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isLoggedIn: boolean;
}

const tabs = [
  { id: 'watch' as Tab, label: 'Watch', icon: Tv, public: true },
  { id: 'upload' as Tab, label: 'Upload', icon: Upload, public: false },
  { id: 'profile' as Tab, label: 'Profile', icon: User, public: false },
  { id: 'earnings' as Tab, label: 'Earnings', icon: DollarSign, public: false },
  { id: 'agent-activity' as Tab, label: 'Agent', icon: Activity, public: true },
];

export function Nav({ activeTab, onTabChange, isLoggedIn }: NavProps) {
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,107,0,0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => onTabChange('watch')}
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 rounded-full border border-orange-500/30"
                style={{ borderTopColor: '#ff6b00' }}
              />
              <Zap
                className="absolute inset-0 m-auto"
                size={14}
                style={{ color: '#ff6b00' }}
              />
            </div>
            <div>
              <span
                className="font-orbitron font-bold text-lg tracking-wider"
                style={{ color: '#ff6b00', textShadow: '0 0 20px rgba(255,107,0,0.5)' }}
              >
                WATCH<span style={{ color: '#fff' }}>PAY</span>
              </span>
              <div className="text-xs font-orbitron tracking-widest" style={{ color: '#ff6b0066', fontSize: '0.55rem' }}>
                UNICITY SPHERE TESTNET2
              </div>
            </div>
          </motion.div>

          {/* Ticker */}
          <div className="hidden md:flex items-center gap-2 flex-1 mx-8 overflow-hidden">
            <div className="ticker-wrap flex-1 text-xs font-orbitron" style={{ color: '#ff6b0044', letterSpacing: '0.08em' }}>
              <div className="ticker-content">
                UCT/USD: $0.0042 &nbsp;•&nbsp; AGENT ACTIVE &nbsp;•&nbsp; TESTNET2 &nbsp;•&nbsp; SETTLEMENTS: 2,847 &nbsp;•&nbsp; SESSIONS: 47 &nbsp;•&nbsp;
                UCT COIN ID: f581d30f...24dc0 &nbsp;•&nbsp; SPHERE SDK v0.10.2 &nbsp;•&nbsp; AGENT ACTIVE &nbsp;•&nbsp;
                UCT/USD: $0.0042 &nbsp;•&nbsp; AGENT ACTIVE &nbsp;•&nbsp; TESTNET2 &nbsp;•&nbsp; SETTLEMENTS: 2,847 &nbsp;•&nbsp; SESSIONS: 47 &nbsp;•&nbsp;
                UCT COIN ID: f581d30f...24dc0 &nbsp;•&nbsp; SPHERE SDK v0.10.2 &nbsp;•&nbsp; AGENT ACTIVE &nbsp;•&nbsp;
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map(tab => {
              const canAccess = tab.public || isLoggedIn;
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => canAccess && onTabChange(tab.id)}
                  className={`nav-tab flex items-center gap-1.5 ${isActive ? 'active' : ''} ${!canAccess ? 'opacity-30 cursor-not-allowed' : ''}`}
                  whileHover={canAccess ? { scale: 1.05 } : {}}
                  whileTap={canAccess ? { scale: 0.95 } : {}}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,107,0,0.4), transparent)' }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.nav>
  );
}
