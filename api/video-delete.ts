import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { videoId, chainPubkey } = req.body;
  if (!videoId || !chainPubkey) return res.status(400).json({ error: 'missing fields' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)
      .eq('creator_chain_pubkey', chainPubkey); // only owner can delete

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}