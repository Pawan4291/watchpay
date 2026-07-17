import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const { creator_id } = req.query;
  if (!creator_id) return res.status(400).json({ error: 'missing creator_id' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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