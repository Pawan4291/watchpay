import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const { chainPubkey } = req.query;
  if (!chainPubkey) return res.status(400).json({ error: 'missing chainPubkey' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('creator_chain_pubkey', chainPubkey)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ videos: data ?? [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}