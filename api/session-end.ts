import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { chainPubkey, videoId } = req.body;
  if (!chainPubkey || !videoId) return res.status(400).json({ error: 'missing fields' });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from('watch_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('video_id', videoId)
    .eq('viewer_chain_pubkey', chainPubkey)
    .is('ended_at', null);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}