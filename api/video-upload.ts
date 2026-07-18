import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { chainPubkey, nametag, title, url, rate_per_30s, category, description } = req.body;
  if (!chainPubkey || !nametag || !title || !url || !rate_per_30s) {
    return res.status(400).json({ error: 'missing fields' });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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