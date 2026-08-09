import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  const action = req.query.action;
  res.setHeader('Cache-Control', 'no-store');
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // ── POST delete (was video-delete.ts) ──
  if (req.method === 'POST' && action === 'delete') {
    const { videoId, chainPubkey } = req.body;
    if (!videoId || !chainPubkey) return res.status(400).json({ error: 'missing fields' });

    try {
      const { data: video } = await supabase
        .from('videos')
        .select('id')
        .eq('id', videoId)
        .eq('creator_chain_pubkey', chainPubkey)
        .maybeSingle();

      if (!video) return res.status(404).json({ error: 'video not found or not owned by you' });

      await supabase.from('watch_sessions').delete().eq('video_id', videoId);

      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('creator_chain_pubkey', chainPubkey);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message ?? 'unknown error' });
    }
  }

  // ── GET earnings (was video-earnings.ts) ──
  if (req.method === 'GET' && action === 'earnings') {
    const { creator_id } = req.query;
    if (!creator_id) return res.status(400).json({ error: 'missing creator_id' });

    try {
      const { data, error } = await supabase
        .from('video_earnings')
        .select('video_id, total_earned, videos(title)')
        .eq('creator_chain_pubkey', creator_id)
        .order('total_earned', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const result = (data ?? []).map((r: any) => ({
        video_id: r.video_id,
        title: r.videos?.title ?? 'Untitled',
        total_earned: r.total_earned,
      }));

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message ?? 'unknown error' });
    }
  }

  // ── POST upload (was video-upload.ts) ──
  if (req.method === 'POST' && action === 'upload') {
    const { chainPubkey, nametag, title, url, rate_per_30s, category, description } = req.body;
    if (!chainPubkey || !nametag || !title || !url || !rate_per_30s) {
      return res.status(400).json({ error: 'missing fields' });
    }

    const { data, error } = await supabase.from('videos').insert({
      creator_chain_pubkey: chainPubkey,
      creator_nametag: nametag,
      title,
      url,
      rate_per_30s: Number(rate_per_30s),
      category: category || 'Other',
      description: description || '',
    }).select().maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ video: data });
  }

  // ── GET list (was videos-list.ts) ──
  if (req.method === 'GET' && action === 'list') {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const videos = (data ?? []).map((v: any) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        thumbnail: v.url && v.url.includes('youtube.com/embed/')
          ? `https://img.youtube.com/vi/${v.url.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1]}/hqdefault.jpg`
          : `https://picsum.photos/seed/${v.id}/640/360`,
        creator: `@${v.creator_nametag}`,
        creator_id: v.creator_chain_pubkey,
        rate_per_30s: Number(v.rate_per_30s),
        views: v.views ?? 0,
        duration: '—',
        category: v.category ?? 'Other',
        description: v.description ?? '',
      }));

      return res.status(200).json({ videos });
    } catch (err: any) {
      console.error('[WatchPay] video list crashed:', err);
      return res.status(500).json({ error: err.message ?? 'unknown error' });
    }
  }

  return res.status(400).json({ error: 'unknown action' });
}