import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data, error } = await supabase
      .from('videos')
      .select('*, users:creator_id (real_nametag)')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const videos = (data ?? []).map((v: any) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      thumbnail: `https://picsum.photos/seed/${v.id}/640/360`,
      creator: v.users?.real_nametag ? `@${v.users.real_nametag}` : '@unknown',
      creator_id: v.creator_id,
      rate_per_30s: Number(v.rate_per_30s),
      views: 0,
      duration: '—',
      category: 'General',
      description: '',
    }));

    return res.status(200).json({ videos });
  } catch (err: any) {
    console.error('[WatchPay] videos-list crashed:', err);
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}