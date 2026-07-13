import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground, CustomCursor } from './components/AnimatedBackground';
import { Nav } from './components/Nav';
import { WatchPage } from './pages/WatchPage';
import { UploadPage } from './pages/UploadPage';
import { ProfilePage } from './pages/ProfilePage';
import { EarningsPage } from './pages/EarningsPage';
import { AgentActivityPage } from './pages/AgentActivityPage';
import { FloatingNotifications } from './components/FloatingMetrics';
import { useStore } from './lib/store';

type Tab = 'watch' | 'upload' | 'profile' | 'earnings' | 'agent-activity';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

function SplashScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: '#000' }}
    >
      {/* Background effects */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,107,0,0.08) 0%, transparent 70%)' }}
      />

      {/* Animated rings */}
      <div className="relative mb-12">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{
              borderColor: `rgba(255,107,0,${0.4 / i})`,
              width: 120 + i * 40,
              height: 120 + i * 40,
              left: -(i * 20),
              top: -(i * 20),
            }}
            animate={{ scale: [1, 1 + i * 0.05, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="w-28 h-28 rounded-full flex items-center justify-center relative"
          style={{ border: '2px solid rgba(255,107,0,0.3)', borderTopColor: '#ff6b00' }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full"
            style={{ border: '1px solid rgba(255,107,0,0.2)', borderBottomColor: '#ff8c00' }}
          />
        </motion.div>

        {/* Logo center */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 20 }}
          className="absolute inset-0 flex items-center justify-center font-orbitron font-black text-2xl"
          style={{ color: '#ff6b00' }}
        >
          W
        </motion.div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center mb-4"
      >
        <h1 className="font-orbitron text-6xl font-black tracking-wider mb-2">
          <motion.span
            style={{ color: '#ff6b00', textShadow: '0 0 40px rgba(255,107,0,0.8)' }}
            animate={{ textShadow: ['0 0 20px rgba(255,107,0,0.5)', '0 0 60px rgba(255,107,0,0.9)', '0 0 20px rgba(255,107,0,0.5)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            WATCH
          </motion.span>
          <span style={{ color: '#fff' }}>PAY</span>
        </h1>
        <div className="font-orbitron text-sm tracking-widest" style={{ color: '#555', letterSpacing: '0.3em' }}>
          PAY · PER · 30 · SECONDS
        </div>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-sm mb-2 max-w-md px-8"
        style={{ color: '#555', lineHeight: 1.8 }}
      >
        Real UCT micropayments · Autonomous settlement agent · Unicity Sphere testnet2
      </motion.p>

      {/* Tech badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex flex-wrap gap-2 justify-center mb-12 max-w-sm px-4"
      >
        {['Sphere SDK v0.10.2', 'QStash Agent', 'Supabase', 'testnet2 · ID:4', 'UCT Payments'].map(badge => (
          <span
            key={badge}
            className="px-3 py-1 rounded-full font-orbitron"
            style={{
              background: 'rgba(255,107,0,0.07)',
              border: '1px solid rgba(255,107,0,0.15)',
              color: '#ff6b0088',
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
            }}
          >
            {badge}
          </span>
        ))}
      </motion.div>

      {/* Enter button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, type: 'spring' }}
        onClick={onEnter}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative overflow-hidden px-12 py-4 rounded-xl font-orbitron font-bold tracking-widest text-sm"
        style={{
          background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 0 40px rgba(255,107,0,0.4), 0 0 80px rgba(255,107,0,0.1)',
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
        ENTER THE APP
      </motion.button>

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </motion.div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('watch');
  const { user } = useStore();

  useEffect(() => {
    import('./lib/store').then(m => m.trySilentLogin());
  }, []);

  if (showSplash) {
    return (
      <>
        <CustomCursor />
        <SplashScreen onEnter={() => setShowSplash(false)} />
      </>
    );
  }

  return (
    <>
      <CustomCursor />
      <AnimatedBackground />

      {/* Main app */}
      <div className="relative" style={{ zIndex: 1 }}>
        <Nav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isLoggedIn={!!user}
        />

        {/* Main content */}
        <main
          className="max-w-7xl mx-auto px-4 sm:px-6"
          style={{ paddingTop: '96px', paddingBottom: '60px', minHeight: '100vh' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {activeTab === 'watch' && <WatchPage />}
              {activeTab === 'upload' && <UploadPage />}
              {activeTab === 'profile' && <ProfilePage />}
              {activeTab === 'earnings' && <EarningsPage />}
              {activeTab === 'agent-activity' && <AgentActivityPage />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating notifications */}
        <FloatingNotifications />

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="border-t py-6 px-6"
          style={{ borderColor: '#1a1a1a' }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-orbitron font-bold" style={{ color: '#ff6b00' }}>WATCHPAY</span>
              <span style={{ color: '#333' }}>—</span>
              <span style={{ color: '#333' }}>Unicity Sphere Hackathon · Payments & Markets Track</span>
            </div>
            <div className="flex items-center gap-4" style={{ color: '#333' }}>
              <span className="font-orbitron" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                UCT: f581d30f...24dc0
              </span>
              <span>·</span>
              <span className="font-orbitron" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                TESTNET2 · NET ID 4
              </span>
              <span>·</span>
              <span className="font-orbitron" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                NOT USING ASTRID OS
              </span>
            </div>
          </div>
        </motion.footer>
      </div>
    </>
  );
}
