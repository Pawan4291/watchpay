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
  const [isPlaying, setIsPlaying] = useState(false); // controls UI/session, video frame stays mounted
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false); // gates real ticking — only true when YT confirms playback
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalWatched, setTotalWatched] = useState(0);
  const [tickMessage, setTickMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [tickCount, setTickCount] = useState(0);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isEmbed = video.url.includes('youtube.com') || video.url.includes('vimeo.com');
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytMountRef = useRef<HTMLDivElement | null>(null);

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
    if (isActuallyPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsed(n => {
          const next = n + 1;
          setTotalWatched(t => t + 1);
          return next;
        });
      }, 1000);

      tickIntervalRef.current = setInterval(() => {
        handleTick();
        setElapsed(0);
      }, TICK_INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isActuallyPlaying, handleTick]);

  // Load the real YouTube IFrame API and create a proper player instance
  useEffect(() => {
    if (!isPlaying || !isEmbed || !ytContainerRef.current) return;

    const ytIdMatch = video.url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    const videoId = ytIdMatch?.[1];
    if (!videoId) return;

    // Create a mount point YT owns exclusively — React never touches this node again
    const mountEl = document.createElement('div');
    ytContainerRef.current.appendChild(mountEl);
    ytMountRef.current = mountEl;

    const createPlayer = () => {
      if (!ytMountRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(ytMountRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, mute: 1, enablejsapi: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === 1) setIsActuallyPlaying(true);
            if (e.data === 2) setIsActuallyPlaying(false);
            if (e.data === 0) handleClose();
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {
        // player already gone, ignore
      }
      ytPlayerRef.current = null;
      // Manually remove our own mount node, not letting React or YT fight over it
      if (ytMountRef.current && ytMountRef.current.parentNode) {
        ytMountRef.current.parentNode.removeChild(ytMountRef.current);
      }
      ytMountRef.current = null;
    };
  }, [isPlaying, isEmbed, video.url]);

  const handlePlay = () => {
    if (!user) {
      setTickMessage({ type: 'error', text: 'Connect your wallet to watch' });
      return;
    }
    if (!wallet || wallet.balance < video.rate_per_30s) {
      setInsufficientBalance(true);
      setTickMessage({ type: 'error', text: 'Insufficient WP balance — buy WP in Profile to watch' });
      return;
    }

    if (!currentSession || currentSession.videoId !== video.id) {
      startWatchSession(video.id);
    }

    setIsPlaying(true);
    setInsufficientBalance(false);
    // Ticking only starts once isActuallyPlaying becomes true via the real YT state event above
  };

 const handlePause = () => {
    ytPlayerRef.current?.pauseVideo?.();
  };

  const handleClose = () => {
    setIsPlaying(false);
    setIsActuallyPlaying(false);
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
        <div className="flex items-center justify-between mb-4 sticky top-0 z-10" style={{ background: 'rgba(0,0,0,0.95)', paddingTop: '4px' }}>
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
          {!isPlaying && (
            <>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)' }} />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
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
                    style={{ background: 'rgba(255,107,0,0.15)', border: '2px solid rgba(255,107,0,0.5)' }}
                  >
                    <Play size={32} style={{ color: '#ff6b00', marginLeft: 4 }} />
                  </motion.div>
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
              </div>
            </>
          )}

          {isPlaying && isEmbed && (
            <div ref={ytContainerRef} className="absolute inset-0 w-full h-full yt-player-fill" style={{ overflow: 'hidden' }} />
          )}
          {isPlaying && !isEmbed && (
            <video
              src={video.url}
              autoPlay
              muted={isMuted}
              controls
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {isPlaying && currentSession && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 right-4 p-3 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,107,0,0.2)', backdropFilter: 'blur(10px)', zIndex: 5 }}
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

          </div>

        {/* Controls — now outside the video frame, no overlap */}
        <div className="mt-3 p-4 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
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

            <div className="flex items-center gap-3">
              {isPlaying && (
                <motion.button
                  onClick={() => {
                    if (isActuallyPlaying) {
                      handlePause();
                    } else {
                      ytPlayerRef.current?.playVideo?.();
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg"
                  style={{ background: 'rgba(255,107,0,0.2)', border: '1px solid rgba(255,107,0,0.3)' }}
                >
                  {isActuallyPlaying ? <Pause size={18} style={{ color: '#ff6b00' }} /> : <Play size={18} style={{ color: '#ff6b00' }} />}
                </motion.button>
              )}

              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                whileHover={{ scale: 1.05 }}
                className="p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a' }}
              >
                {isMuted ? <VolumeX size={16} style={{ color: '#555' }} /> : <Volume2 size={16} style={{ color: '#888' }} />}
              </motion.button>

              <div className="flex-1" />

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

        <AnimatePresence>
          {tickMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mt-3 flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: tickMessage.type === 'success' ? 'rgba(0,255,136,0.05)' : tickMessage.type === 'error' ? 'rgba(255,68,68,0.05)' : 'rgba(255,107,0,0.05)',
                border: `1px solid ${tickMessage.type === 'success' ? 'rgba(0,255,136,0.2)' : tickMessage.type === 'error' ? 'rgba(255,68,68,0.2)' : 'rgba(255,107,0,0.2)'}`,
              }}
            >
              {tickMessage.type === 'success' ? <CheckCircle size={16} style={{ color: '#00ff88' }} /> : tickMessage.type === 'error' ? <AlertTriangle size={16} style={{ color: '#ff4444' }} /> : <Zap size={16} style={{ color: '#ff6b00' }} />}
              <span className="text-xs font-orbitron" style={{ color: tickMessage.type === 'success' ? '#00ff88' : tickMessage.type === 'error' ? '#ff4444' : '#ff6b00', letterSpacing: '0.06em' }}>
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

        {insufficientBalance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-4 rounded-lg"
            style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} style={{ color: '#ff4444' }} />
              <span className="font-orbitron text-sm font-bold" style={{ color: '#ff4444' }}>INSUFFICIENT BALANCE</span>
            </div>
            <p className="text-xs" style={{ color: '#888' }}>
              You need at least <strong style={{ color: '#ff6b00' }}>{video.rate_per_30s} WP</strong> to watch this video.
              Go to <strong>Profile → Buy WP</strong> to convert real UCT into WP.
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}