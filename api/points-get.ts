import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  const { chainPubkey } = req.query;
  if (!chainPubkey) return res.status(400).json({ error: 'missing chainPubkey' });
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from('wp_points').select('*').eq('chain_pubkey', chainPubkey).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ balance: data?.balance ?? 0 });
}