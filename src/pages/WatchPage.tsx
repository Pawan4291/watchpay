import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, Clock, Zap, Star, TrendingUp, Search, Filter } from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { useStore } from '../lib/store';
import { DEMO_VIDEOS } from '../lib/constants';

export type { Video } from '../lib/types';
import type { Video } from '../lib/types';

const CATEGORIES = ['All', 'Tech', 'DeFi', 'Architecture', 'Tokenomics', 'Dev Guide', 'Security'];

function formatViews(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function VideoCard({ video, onPlay }: { video: Video; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4 }}
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPlay}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#0a0a0a',
          border: `1px solid ${hovered ? 'rgba(255,107,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: hovered ? '0 0 40px rgba(255,107,0,0.1)' : 'none',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Thumbnail */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            style={{
              filter: hovered ? 'brightness(0.7)' : 'brightness(0.6)',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.4s ease',
            }}
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
          />

          {/* Orange tint on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                style={{ background: 'rgba(255,107,0,0.08)' }}
              />
            )}
          </AnimatePresence>

          {/* Play button */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{ scale: hovered ? 1 : 0.8 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,107,0,0.9)',
                boxShadow: '0 0 30px rgba(255,107,0,0.5)',
              }}
            >
              <Play size={24} style={{ color: 'white', marginLeft: 3 }} />
            </motion.div>
          </motion.div>

          {/* Duration badge */}
          <div
            className="absolute bottom-2 right-2 px-2 py-0.5 rounded font-orbitron text-xs"
            style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.65rem' }}
          >
            {video.duration}
          </div>

          {/* Category badge */}
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded font-orbitron text-xs"
            style={{
              background: 'rgba(255,107,0,0.15)',
              border: '1px solid rgba(255,107,0,0.3)',
              color: '#ff6b00',
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
            }}
          >
            {video.category}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3
            className="font-semibold mb-2 leading-snug"
            style={{ color: hovered ? '#fff' : '#ccc', transition: 'color 0.2s', fontSize: '0.9rem' }}
          >
            {video.title}
          </h3>

          <div className="text-xs mb-3" style={{ color: '#ff6b00' }}>
            {video.creator}
          </div>

          <p className="text-xs mb-4 leading-relaxed line-clamp-2" style={{ color: '#555' }}>
            {video.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs" style={{ color: '#555' }}>
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {formatViews(video.views)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {video.duration}
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: hovered ? 'rgba(255,107,0,0.15)' : 'rgba(255,107,0,0.07)',
                border: `1px solid ${hovered ? 'rgba(255,107,0,0.4)' : 'rgba(255,107,0,0.15)'}`,
                transition: 'all 0.3s ease',
              }}
            >
              <Zap size={10} style={{ color: '#ff6b00' }} />
              <span className="font-orbitron font-bold" style={{ color: '#ff6b00', fontSize: '0.65rem' }}>
                {video.rate_per_30s} UCT/30s
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function WatchPage() {
  const [totalSettledFromDB, setTotalSettledFromDB] = useState('0 UCT');
  useEffect(() => {
    fetch('/api/settlements/total').then(r => r.json()).then(d => setTotalSettledFromDB(`${d.total} UCT`));
  }, []);
  const { user } = useStore();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'cheapest'>('popular');
  const [liveCount, setLiveCount] = useState(47);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(n => n + (Math.random() > 0.5 ? 1 : -1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = DEMO_VIDEOS.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.creator.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || v.category === category;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === 'popular') return b.views - a.views;
    if (sortBy === 'cheapest') return a.rate_per_30s - b.rate_per_30s;
    return 0;
  });

  return (
    <div className="relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Live indicator */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: '#ff6b00' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="font-orbitron text-xs" style={{ color: '#ff6b00', letterSpacing: '0.1em' }}>
              {liveCount} WATCHING NOW
            </span>
          </div>
          <div className="text-xs" style={{ color: '#444' }}>
            Agent settling every 5 min · Real UCT on testnet2
          </div>
        </div>

        <h1 className="font-orbitron text-4xl font-bold mb-2" style={{ color: '#fff' }}>
          DISCOVER &
          <span style={{ color: '#ff6b00' }}> EARN</span>
        </h1>
        <p style={{ color: '#555', maxWidth: '600px', fontSize: '0.95rem' }}>
          Every 30 seconds you watch, real UCT is deducted and queued for settlement.
          The autonomous agent pays creators automatically — no wallet popups.
        </p>
      </motion.div>

      {/* Featured stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        {[
          { label: 'Total Settled', value: totalSettledFromDB, icon: TrendingUp },
          { label: 'Active Sessions', value: String(liveCount), icon: Play },
          { label: 'Creators Earning', value: '6', icon: Star },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="metric-card"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={14} style={{ color: '#ff6b00' }} />
              <span className="text-xs font-orbitron" style={{ color: '#555', letterSpacing: '0.08em' }}>
                {stat.label.toUpperCase()}
              </span>
            </div>
            <div className="font-orbitron text-xl font-bold" style={{ color: '#ff6b00' }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Search + Filter bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos, creators..."
            className="input-dark pl-9"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: '#555' }} />
          {(['popular', 'newest', 'cheapest'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="px-3 py-2 rounded-lg font-orbitron text-xs font-bold tracking-wider transition-all"
              style={{
                background: sortBy === s ? 'rgba(255,107,0,0.15)' : 'transparent',
                border: `1px solid ${sortBy === s ? 'rgba(255,107,0,0.4)' : '#2a2a2a'}`,
                color: sortBy === s ? '#ff6b00' : '#555',
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Category pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex gap-2 mb-8 flex-wrap"
      >
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="px-4 py-1.5 rounded-full font-orbitron text-xs tracking-wider transition-all"
            style={{
              background: category === cat ? '#ff6b00' : 'transparent',
              border: `1px solid ${category === cat ? '#ff6b00' : '#2a2a2a'}`,
              color: category === cat ? '#000' : '#666',
              fontWeight: category === cat ? 700 : 400,
            }}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Guest notice */}
      {!user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)' }}
        >
          <Zap size={18} style={{ color: '#ff6b00' }} />
          <div>
            <div className="font-orbitron text-sm font-bold" style={{ color: '#ff6b00' }}>
              Connect your Sphere wallet to watch
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#666' }}>
              Watching requires a funded app wallet. Connect via Profile → Connect Sphere Wallet.
            </div>
          </div>
        </motion.div>
      )}

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((video, i) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <VideoCard
              video={video}
              onPlay={() => setSelectedVideo(video)}
            />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="font-orbitron text-2xl mb-2" style={{ color: '#2a2a2a' }}>NO VIDEOS FOUND</div>
          <div className="text-sm" style={{ color: '#444' }}>Try a different search or category</div>
        </motion.div>
      )}

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <VideoPlayer
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
