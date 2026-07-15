import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link, Film, DollarSign, CheckCircle, AlertCircle, Zap, Info } from 'lucide-react';
import { useStore } from '../lib/store';
import { UCT_COIN_ID } from '../lib/constants';

interface VideoForm {
  title: string;
  url: string;
  rate_per_30s: string;
  description: string;
  category: string;
}

const CATEGORIES = ['Tech', 'DeFi', 'Architecture', 'Tokenomics', 'Dev Guide', 'Security', 'Tutorial', 'News'];

export function UploadPage() {
  const { user } = useStore();
  const [form, setForm] = useState<VideoForm>({
    title: '',
    url: '',
    rate_per_30s: '0.001',
    description: '',
    category: 'Tech',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [videoId] = useState(() => `vid_${Math.random().toString(36).slice(2, 10)}`);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="font-orbitron text-4xl font-bold mb-4" style={{ color: '#2a2a2a' }}>
            CONNECT FIRST
          </div>
          <div className="text-sm" style={{ color: '#444' }}>
            Connect your Sphere wallet in the Profile tab to upload videos.
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url || !form.rate_per_30s) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!form.url.includes('youtube') && !form.url.includes('vimeo') && !form.url.startsWith('http')) {
      setError('Please enter a valid YouTube, Vimeo, or direct video URL.');
      return;
    }
    const rate = parseFloat(form.rate_per_30s);
    if (isNaN(rate) || rate <= 0) {
      setError('Rate must be a positive number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/video-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainPubkey: user.id,
          nametag: user.nametag,
          title: form.title,
          url: form.url,
          rate_per_30s: rate,
        }),
      }).then(r => r.json());

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setError('Upload failed — please try again.');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof VideoForm, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(0,255,136,0.1)', border: '2px solid rgba(0,255,136,0.3)' }}
          >
            <CheckCircle size={36} style={{ color: '#00ff88' }} />
          </motion.div>

          <div className="font-orbitron text-3xl font-bold mb-3" style={{ color: '#00ff88' }}>
            VIDEO UPLOADED
          </div>
          <div className="text-sm mb-8" style={{ color: '#666' }}>
            Your video is now live. The autonomous agent will settle payments every 5 minutes.
          </div>

          {/* Receipt */}
          <div
            className="p-6 rounded-xl text-left"
            style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
          >
            <div className="font-orbitron text-xs mb-4" style={{ color: '#ff6b00', letterSpacing: '0.1em' }}>
              UPLOAD RECEIPT
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#555' }}>Video ID</span>
                <span className="font-orbitron text-xs" style={{ color: '#ff6b0088' }}>{videoId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#555' }}>Title</span>
                <span style={{ color: '#fff' }}>{form.title}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#555' }}>Rate</span>
                <span style={{ color: '#ff6b00' }}>{form.rate_per_30s} UCT / 30s</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#555' }}>Coin ID</span>
                <span className="font-orbitron text-xs truncate max-w-48" style={{ color: '#ff6b0066', fontSize: '0.58rem' }}>
                  {UCT_COIN_ID}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#555' }}>Creator</span>
                <span style={{ color: '#ff6b00' }}>@{user.nametag}</span>
              </div>
            </div>
          </div>

          <motion.button
            onClick={() => { setSuccess(false); setForm({ title: '', url: '', rate_per_30s: '0.001', description: '', category: 'Tech' }); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 btn-orange"
          >
            UPLOAD ANOTHER
          </motion.button>
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
        <h1 className="font-orbitron text-4xl font-bold mb-2" style={{ color: '#fff' }}>
          UPLOAD <span style={{ color: '#ff6b00' }}>VIDEO</span>
        </h1>
        <p style={{ color: '#555', fontSize: '0.95rem' }}>
          Set your rate per 30 seconds. The agent settles payments to @{user.nametag} automatically.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-xs font-orbitron mb-2" style={{ color: '#888', letterSpacing: '0.1em' }}>
              <Film size={12} />
              VIDEO TITLE *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Enter an engaging title..."
              className="input-dark"
              maxLength={100}
            />
            <div className="text-xs mt-1 text-right" style={{ color: '#444' }}>
              {form.title.length}/100
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="flex items-center gap-2 text-xs font-orbitron mb-2" style={{ color: '#888', letterSpacing: '0.1em' }}>
              <Link size={12} />
              VIDEO URL * (YouTube embed, Vimeo, or direct MP4)
            </label>
            <input
              type="url"
              value={form.url}
              onChange={e => handleChange('url', e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className="input-dark"
            />
            <div className="text-xs mt-1 flex items-center gap-1" style={{ color: '#444' }}>
              <Info size={10} />
              For YouTube: use the embed URL format (youtube.com/embed/VIDEO_ID)
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-xs font-orbitron mb-2" style={{ color: '#888', letterSpacing: '0.1em' }}>
              CATEGORY *
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleChange('category', cat)}
                  className="px-3 py-1.5 rounded-lg font-orbitron text-xs font-bold tracking-wider transition-all"
                  style={{
                    background: form.category === cat ? 'rgba(255,107,0,0.15)' : '#111',
                    border: `1px solid ${form.category === cat ? '#ff6b00' : '#2a2a2a'}`,
                    color: form.category === cat ? '#ff6b00' : '#555',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-xs font-orbitron mb-2" style={{ color: '#888', letterSpacing: '0.1em' }}>
              DESCRIPTION
            </label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="What is this video about?"
              className="input-dark"
              style={{ minHeight: '80px', resize: 'vertical' }}
              maxLength={500}
            />
          </div>

          {/* Rate */}
          <div>
            <label className="flex items-center gap-2 text-xs font-orbitron mb-2" style={{ color: '#888', letterSpacing: '0.1em' }}>
              <DollarSign size={12} />
              RATE PER 30 SECONDS (WP, 1 WP = 1 UCT) *
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={form.rate_per_30s}
                onChange={e => handleChange('rate_per_30s', e.target.value)}
                min="0.0001"
                step="0.0001"
                className="input-dark flex-1"
              />
              <div
                className="flex items-center gap-2 px-4 rounded-lg"
                style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)', color: '#ff6b00' }}
              >
                <Zap size={14} />
                <span className="font-orbitron text-sm font-bold">UCT</span>
              </div>
            </div>

            {/* Rate presets */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {['0.0005', '0.001', '0.002', '0.005', '0.01'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleChange('rate_per_30s', preset)}
                  className="px-2.5 py-1 rounded text-xs font-orbitron transition-all"
                  style={{
                    background: form.rate_per_30s === preset ? 'rgba(255,107,0,0.15)' : '#111',
                    border: `1px solid ${form.rate_per_30s === preset ? 'rgba(255,107,0,0.4)' : '#2a2a2a'}`,
                    color: form.rate_per_30s === preset ? '#ff6b00' : '#555',
                    cursor: 'pointer',
                    fontSize: '0.65rem',
                  }}
                >
                  {preset} UCT
                </button>
              ))}
            </div>
          </div>

          {/* Coin ID display */}
          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={12} style={{ color: '#00ff88' }} />
              <span className="font-orbitron text-xs font-bold" style={{ color: '#00ff88', letterSpacing: '0.08em' }}>
                UCT COIN ID (AUTO-SET)
              </span>
            </div>
            <div className="font-orbitron text-xs break-all" style={{ color: '#ff6b0066', fontSize: '0.6rem' }}>
              {UCT_COIN_ID}
            </div>
            <div className="text-xs mt-2" style={{ color: '#555' }}>
              All payments are in UCT on Unicity testnet2. The coin ID is hardcoded and verified.
            </div>
          </div>

          {/* Earnings estimate */}
          {parseFloat(form.rate_per_30s) > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl"
              style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
            >
              <div className="font-orbitron text-xs mb-3" style={{ color: '#555', letterSpacing: '0.1em' }}>
                EARNINGS ESTIMATE (per viewer)
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Per Minute', multiplier: 2 },
                  { label: 'Per Hour', multiplier: 120 },
                  { label: 'Per Day (1h)', multiplier: 120 * 24 },
                ].map(item => (
                  <div key={item.label}>
                    <div className="font-orbitron text-lg font-bold" style={{ color: '#ff6b00' }}>
                      {(parseFloat(form.rate_per_30s) * item.multiplier).toFixed(4)}
                    </div>
                    <div className="text-xs" style={{ color: '#444' }}>{item.label}</div>
                    <div className="text-xs" style={{ color: '#333' }}>UCT</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)' }}
              >
                <AlertCircle size={14} style={{ color: '#ff4444' }} />
                <span className="text-xs" style={{ color: '#ff4444' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            className="w-full py-4 rounded-xl font-orbitron font-bold tracking-widest flex items-center justify-center gap-3"
            style={{
              background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #ff6b00, #ff8c00)',
              color: loading ? '#555' : 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              boxShadow: loading ? 'none' : '0 0 30px rgba(255,107,0,0.3)',
            }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full"
                />
                PUBLISHING...
              </>
            ) : (
              <>
                <Upload size={18} />
                PUBLISH VIDEO
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
}
