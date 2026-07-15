import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Zap, Shield, LogOut, LogIn, Loader2, Copy, CheckCircle, ExternalLink, Globe, Lock } from 'lucide-react';
import { WalletCard } from '../components/WalletCard';
import { useStore, loginWithSphere, disconnectWallet } from '../lib/store';
import { SPHERE_WALLET_URL, NETWORK_ID } from '../lib/constants';

function MyVideosSection({ user }: { user: { id: string } }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/my-videos?chainPubkey=${encodeURIComponent(user.id)}`)
      .then(r => r.json())
      .then(d => setVideos(d.videos ?? []))
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleDelete = async (videoId: string) => {
    if (!confirm('Delete this video?')) return;
    await fetch('/api/video-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, chainPubkey: user.id }),
    });
    setVideos(v => v.filter(x => x.id !== videoId));
  };

  if (loading) return null;
  if (videos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="p-6 rounded-xl"
      style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
    >
      <div className="font-orbitron text-xs mb-4" style={{ color: '#ff6b00', letterSpacing: '0.1em' }}>
        MY VIDEOS
      </div>
      <div className="space-y-3">
        {videos.map(v => (
          <div key={v.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
            <div>
              <div className="text-sm" style={{ color: '#fff' }}>{v.title}</div>
              <div className="text-xs mt-0.5" style={{ color: '#555' }}>{v.rate_per_30s} UCT / 30s</div>
            </div>
            <button
              onClick={() => handleDelete(v.id)}
              className="px-3 py-1.5 rounded text-xs font-orbitron"
              style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', cursor: 'pointer' }}
            >
              DELETE
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ProfilePage() {
  const { user, wallet, isConnecting } = useStore();
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    /**
     * Real Connect flow (browser):
     *
     * import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
     * import { SPHERE_NETWORKS } from '@unicitylabs/sphere-sdk/connect';
     *
     * const result = await autoConnect({
     *   dapp: { name: 'WatchPay', description: 'Pay-per-watch on Unicity Sphere', url: window.location.origin },
     *   walletUrl: SPHERE_WALLET_URL,
     *   network: SPHERE_NETWORKS.testnet2,  // { id: 4, name: 'testnet2' }
     *   silent: true,
     *   permissions: ['identity:read', 'balance:read', 'transfer:request', 'sign:request'],
     * });
     * const identity = result.connection.identity;
     * sessionStorage.setItem('sphere-session', result.connection.sessionId);
     * → upsert into users table
     * → create app wallet if first login
     */
    await loginWithSphere();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="font-orbitron text-4xl font-bold mb-2" style={{ color: '#fff' }}>
            YOUR <span style={{ color: '#ff6b00' }}>PROFILE</span>
          </h1>
          <p className="mb-12" style={{ color: '#555', fontSize: '0.95rem' }}>
            Connect your Sphere wallet to access your profile and start watching.
          </p>
        </motion.div>

        {/* Connect Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0f0f0f, #0a0a0a)',
            border: '1px solid rgba(255,107,0,0.2)',
            boxShadow: '0 0 60px rgba(255,107,0,0.05)',
          }}
        >
          {/* Top gradient bar */}
          <div
            className="h-1"
            style={{ background: 'linear-gradient(90deg, #ff6b00, #ff8c00)' }}
          />

          <div className="p-8">
            {/* Sphere logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="w-24 h-24 rounded-full"
                  style={{ border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#ff6b00' }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-3 rounded-full"
                  style={{ border: '1px solid rgba(255,107,0,0.15)', borderBottomColor: '#ff8c00' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={28} style={{ color: '#ff6b00' }} />
                </div>
              </div>
            </div>

            <div className="font-orbitron text-xl font-bold text-center mb-2" style={{ color: '#fff' }}>
              SPHERE CONNECT
            </div>
            <div className="text-sm text-center mb-8" style={{ color: '#555' }}>
              Protocol v2.0 · Network ID {NETWORK_ID} · testnet2
            </div>

            {/* Feature list */}
            <div className="space-y-3 mb-8">
              {[
                { icon: Shield, text: 'Non-custodial auth — your keys never leave your wallet' },
                { icon: Zap, text: 'Auto app wallet created on first connect' },
                { icon: Lock, text: 'Mnemonic encrypted server-side at rest' },
                { icon: Globe, text: 'Real UCT payments on Unicity testnet2' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,107,0,0.1)' }}
                  >
                    <item.icon size={12} style={{ color: '#ff6b00' }} />
                  </div>
                  <span className="text-xs" style={{ color: '#777' }}>{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Connect button */}
            <motion.button
              onClick={handleConnect}
              disabled={isConnecting}
              whileHover={isConnecting ? {} : { scale: 1.02 }}
              whileTap={isConnecting ? {} : { scale: 0.98 }}
              className="w-full py-4 rounded-xl font-orbitron font-bold tracking-widest flex items-center justify-center gap-3"
              style={{
                background: isConnecting ? '#1a1a1a' : 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                color: isConnecting ? '#555' : 'white',
                border: 'none',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                boxShadow: isConnecting ? 'none' : '0 0 40px rgba(255,107,0,0.3)',
              }}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  CONNECTING...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  CONNECT SPHERE WALLET
                </>
              )}
            </motion.button>

            <div className="text-center mt-4">
              <a
                href={SPHERE_WALLET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: '#ff6b0066' }}
              >
                <ExternalLink size={10} />
                Get Sphere Wallet
              </a>
            </div>
          </div>
        </motion.div>

        {/* Architecture note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-xl text-xs"
          style={{
            background: 'rgba(255,107,0,0.03)',
            border: '1px solid rgba(255,107,0,0.08)',
            color: '#555',
            lineHeight: 1.7,
          }}
        >
          <div className="font-orbitron text-xs mb-2" style={{ color: '#ff6b0066', letterSpacing: '0.08em' }}>
            WALLET ARCHITECTURE DISCLOSURE
          </div>
          WatchPay uses a <strong style={{ color: '#888' }}>custodial app wallet</strong> per user for silent, uninterrupted billing — 
          no wallet popups every 30 seconds. Your real Sphere wallet stays fully user-controlled and is only 
          used for deposit/withdraw via the <strong style={{ color: '#888' }}>sphere.intent("send")</strong> Connect protocol.
          App wallet mnemonics are encrypted server-side with AES-256-GCM before storage in Supabase.
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-orbitron text-4xl font-bold mb-1" style={{ color: '#fff' }}>
              PROFILE
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
              <span className="text-xs font-orbitron" style={{ color: '#00ff88', letterSpacing: '0.08em' }}>CONNECTED</span>
            </div>
          </div>
          <motion.button
            onClick={disconnectWallet}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-orbitron font-bold tracking-wider"
            style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#666', cursor: 'pointer' }}
          >
            <LogOut size={13} />
            DISCONNECT
          </motion.button>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl"
          style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(255,107,0,0.2)', '0 0 40px rgba(255,107,0,0.4)', '0 0 20px rgba(255,107,0,0.2)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.1)', border: '2px solid rgba(255,107,0,0.3)' }}
            >
              <User size={28} style={{ color: '#ff6b00' }} />
            </motion.div>
            <div>
              <div className="font-orbitron text-xl font-bold" style={{ color: '#fff' }}>
                @{user.nametag}
              </div>
              {user.realNametag && (
                <div className="text-sm mt-0.5" style={{ color: '#ff6b00' }}>
                  Real wallet: {user.realNametag}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded font-orbitron text-xs"
                  style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', color: '#ff6b00', fontSize: '0.6rem', letterSpacing: '0.08em' }}
                >
                  {user.isCreator ? 'CREATOR' : 'VIEWER'}
                </span>
                <span
                  className="px-2 py-0.5 rounded font-orbitron text-xs"
                  style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88', fontSize: '0.6rem', letterSpacing: '0.08em' }}
                >
                  TESTNET2
                </span>
              </div>
            </div>
          </div>

          {/* Real wallet address */}
          {user.directAddress && (
            <div>
              <div className="text-xs font-orbitron mb-2" style={{ color: '#555', letterSpacing: '0.1em' }}>
                REAL SPHERE WALLET ADDRESS
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: '#111', border: '1px solid #1a1a1a' }}
              >
                <span className="font-orbitron text-xs truncate flex-1" style={{ color: '#555', fontSize: '0.6rem' }}>
                  {user.directAddress}
                </span>
                <motion.button
                  onClick={() => handleCopy(user.directAddress!)}
                  whileTap={{ scale: 0.9 }}
                  style={{ color: copied ? '#00ff88' : '#444', flexShrink: 0 }}
                >
                  {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Wallet card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {wallet && <WalletCard />}
        </motion.div>

        {/* My Videos */}
        <MyVideosSection user={user} />

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl"
          style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
        >
          <div className="font-orbitron text-xs mb-5" style={{ color: '#ff6b00', letterSpacing: '0.1em' }}>
            HOW WATCHPAY WORKS
          </div>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Deposit UCT', desc: 'Send UCT from your real Sphere wallet to your app wallet via the Sphere Connect "send" intent. On-chain confirmation required.' },
              { step: '02', title: 'Watch & Tick', desc: 'Every 30s a tick fires. Your app wallet balance decreases by the video rate. No wallet popup — the agent handles it.' },
              { step: '03', title: 'Agent Settles', desc: 'Every ~5 min, the autonomous agent batches pending amounts and calls sphere.payments.send() to pay creators. Real TX on testnet2.' },
              { step: '04', title: 'Withdraw Anytime', desc: 'The agent calls sendUCT() to move your remaining balance back to your real Sphere wallet nametag.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.07 }}
                className="flex gap-4"
              >
                <div
                  className="font-orbitron text-xs font-bold flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,107,0,0.1)', color: '#ff6b00', border: '1px solid rgba(255,107,0,0.2)', fontSize: '0.65rem' }}
                >
                  {item.step}
                </div>
                <div>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: '#fff' }}>{item.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#555' }}>{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
