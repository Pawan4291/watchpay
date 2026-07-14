import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Zap, AlertTriangle, CheckCircle, X, Clock, Coins } from 'lucide-react';
import { useStore, startWatchSession, recordTick, endWatchSession } from '../lib/store';
import { TICK_INTERVAL_MS } from '../lib/constants';
import type { Video } from '../lib/types';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const { wallet, currentSession, user } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds since last tick
  const [totalWatched, setTotalWatched] = useState(0); // seconds total
  const [tickMessage, setTickMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [tickCount, setTickCount] = useState(0);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [waveValues, setWaveValues] = useState<number[]>(Array.from({ length: 20 }, () => Math.random()));

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waveRef = useRef<NodeJS.Timeout | null>(null);

  const handleTick = useCallback(() => {
    if (!user) return;
    const success = recordTick(video.rate_per_30s);
    if (success) {
      setTickCount(n => n + 1);
      setTickMessage({
        type: 'success',
        text: `−${video.rate_per_30s.toFixed(6)} UCT → @${video.creator}`,
      });
      setTimeout(() => setTickMessage(null), 3000);
    } else {
      setInsufficientBalance(true);
      setIsPlaying(false);
      setTickMessage({
        type: 'error',
        text: 'Insufficient balance — please deposit UCT',
      });
    }
  }, [user, video.rate_per_30s, video.creator]);

  useEffect(() => {
    if (isPlaying) {
      // Second counter
      intervalRef.current = setInterval(() => {
        setElapsed(n => {
          const next = n + 1;
          setTotalWatched(t => t + 1);
          return next;
        });
      }, 1000);

      // Tick every TICK_INTERVAL_MS
      tickIntervalRef.current = setInterval(() => {
        handleTick();
        setElapsed(0);
      }, TICK_INTERVAL_MS);

      // Waveform animation
      waveRef.current = setInterval(() => {
        setWaveValues(Array.from({ length: 20 }, () => Math.random()));
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, [isPlaying, handleTick]);

  const handlePlay = () => {
    if (!user) {
      setTickMessage({ type: 'error', text: 'Connect your wallet to watch' });
      return;
    }
    if (!wallet || wallet.balance < video.rate_per_30s) {
      setInsufficientBalance(true);
      setTickMessage({ type: 'error', text: 'Insufficient UCT balance — deposit to watch' });
      return;
    }

    if (!currentSession || currentSession.videoId !== video.id) {
      startWatchSession(video.id);
    }

    setIsPlaying(true);
    setInsufficientBalance(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleClose = () => {
    setIsPlaying(false);
    endWatchSession();
    onClose();
  };

  const progress = (elapsed / (TICK_INTERVAL_MS / 1000)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-orbitron font-bold text-white text-lg">{video.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm" style={{ color: '#ff6b00' }}>{video.creator}</span>
              <span className="badge-warning">{video.rate_per_30s} UCT / 30s</span>
            </div>
          </div>
          <motion.button
            onClick={handleClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg"
            style={{ background: '#1a1a1a', color: '#888' }}
          >
            <X size={20} />
          </motion.button>
        </div>

        {/* Video area */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            aspectRatio: '16/9',
            background: '#0a0a0a',
            border: '1px solid rgba(255,107,0,0.2)',
            boxShadow: isPlaying ? '0 0 60px rgba(255,107,0,0.15)' : 'none',
          }}
        >
          {/* Placeholder video visual */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)`,
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Center play area */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!isPlaying ? (
              <motion.button
                onClick={handlePlay}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,107,0,0.15)',
                    border: '2px solid rgba(255,107,0,0.5)',
                  }}
                >
                  <Play size={32} style={{ color: '#ff6b00', marginLeft: 4 }} />
                </motion.div>
                {/* Ripple rings */}
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border"
                    style={{ borderColor: `rgba(255,107,0,${0.3 / i})` }}
                    animate={{ scale: [1, 1 + i * 0.3], opacity: [0.8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  />
                ))}
              </motion.button>
            ) : (
              <div className="text-center">
                {/* Waveform visualization */}
                <div className="flex items-end gap-1 justify-center h-16 mb-4">
                  {waveValues.map((v, i) => (
                    <motion.div
                      key={i}
                      className="waveform-bar"
                      animate={{ scaleY: v * 0.8 + 0.2 }}
                      transition={{ duration: 0.2 }}
                      style={{ height: '60px' }}
                    />
                  ))}
                </div>
                <div className="font-orbitron text-sm" style={{ color: '#ff6b0066' }}>
                  PLAYING
                </div>
              </div>
            )}
          </div>

          {/* Top right: session stats */}
          {isPlaying && currentSession && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 right-4 p-3 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,107,0,0.2)', backdropFilter: 'blur(10px)' }}
            >
              <div className="text-xs font-orbitron mb-1" style={{ color: '#ff6b0088', letterSpacing: '0.1em' }}>SESSION</div>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#888' }}>
                <Clock size={10} style={{ color: '#ff6b0066' }} />
                <span>{Math.floor(totalWatched / 60)}m {totalWatched % 60}s</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: '#888' }}>
                <Coins size={10} style={{ color: '#ff6b0066' }} />
                <span style={{ color: '#ff6b00' }}>−{currentSession.totalSpent.toFixed(6)} UCT</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: '#888' }}>
                <Zap size={10} style={{ color: '#ff6b0066' }} />
                <span>{currentSession.totalTicks} ticks</span>
              </div>
            </motion.div>
          )}

          {/* Bottom: progress + controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* 30s countdown bar */}
            {isPlaying && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs font-orbitron mb-1" style={{ color: '#ff6b0066', letterSpacing: '0.08em' }}>
                  <span>NEXT TICK IN {(TICK_INTERVAL_MS / 1000) - elapsed}s</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: '3px', background: '#1a1a1a' }}>
                  <motion.div
                    className="progress-bar h-full rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={isPlaying ? handlePause : handlePlay}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg"
                style={{ background: isPlaying ? 'rgba(255,107,0,0.2)' : 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}
              >
                {isPlaying
                  ? <Pause size={18} style={{ color: '#ff6b00' }} />
                  : <Play size={18} style={{ color: '#ff6b00' }} />
                }
              </motion.button>

              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                whileHover={{ scale: 1.05 }}
                className="p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a' }}
              >
                {isMuted
                  ? <VolumeX size={16} style={{ color: '#555' }} />
                  : <Volume2 size={16} style={{ color: '#888' }} />
                }
              </motion.button>

              <div className="flex-1" />

              {/* Rate indicator */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.15)' }}
              >
                <Zap size={12} style={{ color: '#ff6b00' }} />
                <span className="font-orbitron text-xs" style={{ color: '#ff6b00' }}>
                  {video.rate_per_30s} UCT/30s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tick notification */}
        <AnimatePresence>
          {tickMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mt-3 flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: tickMessage.type === 'success'
                  ? 'rgba(0,255,136,0.05)'
                  : tickMessage.type === 'error'
                  ? 'rgba(255,68,68,0.05)'
                  : 'rgba(255,107,0,0.05)',
                border: `1px solid ${
                  tickMessage.type === 'success' ? 'rgba(0,255,136,0.2)'
                  : tickMessage.type === 'error' ? 'rgba(255,68,68,0.2)'
                  : 'rgba(255,107,0,0.2)'
                }`,
              }}
            >
              {tickMessage.type === 'success'
                ? <CheckCircle size={16} style={{ color: '#00ff88' }} />
                : tickMessage.type === 'error'
                ? <AlertTriangle size={16} style={{ color: '#ff4444' }} />
                : <Zap size={16} style={{ color: '#ff6b00' }} />
              }
              <span className="text-xs font-orbitron" style={{
                color: tickMessage.type === 'success' ? '#00ff88'
                  : tickMessage.type === 'error' ? '#ff4444'
                  : '#ff6b00',
                letterSpacing: '0.06em',
              }}>
                {tickMessage.text}
              </span>
              {tickMessage.type === 'success' && (
                <span className="ml-auto text-xs font-orbitron" style={{ color: '#ff6b0066' }}>
                  TICK #{tickCount} • LEDGER UPDATED
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insufficient balance warning */}
        {insufficientBalance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-4 rounded-lg"
            style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} style={{ color: '#ff4444' }} />
              <span className="font-orbitron text-sm font-bold" style={{ color: '#ff4444' }}>
                INSUFFICIENT BALANCE
              </span>
            </div>
            <p className="text-xs" style={{ color: '#888' }}>
              Your app wallet needs at least <strong style={{ color: '#ff6b00' }}>{video.rate_per_30s} UCT</strong> to watch this video.
              Go to <strong>Profile → Deposit</strong> to top up with UCT from your real Sphere wallet.
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
