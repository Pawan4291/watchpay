import { motion } from 'framer-motion';
import { Tv, Upload, User, DollarSign, Activity, Zap, Wallet } from 'lucide-react';
import { useStore, loginWithSphere, disconnectWallet } from '../lib/store';

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
  const { user, isConnecting } = useStore();

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

          {/* Tabs — centered */}
          <div className="flex items-center gap-1 flex-1 justify-center">
            {tabs.map(tab => {
              const canAccess = tab.public || isLoggedIn;
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => canAccess && onTabChange(tab.id)}
                  className={`nav-tab flex items-center gap-1.5 ${isActive ? 'active' : ''} ${!canAccess ? 'opacity-60 cursor-not-allowed' : ''}`}
                  whileHover={canAccess ? { scale: 1.05 } : {}}
                  whileTap={canAccess ? { scale: 0.95 } : {}}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>

          <motion.button
            onClick={() => (isLoggedIn ? disconnectWallet() : loginWithSphere())}
              disabled={isConnecting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-orbitron text-xs ml-2"
              style={{
                background: isLoggedIn ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,0,0.15)',
                border: `1px solid ${isLoggedIn ? 'rgba(0,255,136,0.3)' : 'rgba(255,107,0,0.4)'}`,
                color: isLoggedIn ? '#00ff88' : '#ff6b00',
                cursor: 'pointer',
              }}
            >
              <Wallet size={13} />
              {isConnecting ? 'Connecting...' : isLoggedIn ? (user?.nametag ? `@${user.nametag}` : `${user?.directAddress?.slice(0, 10)}...`) : 'Connect Wallet'}
          </motion.button>
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
