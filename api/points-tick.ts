import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { chainPubkey, amount } = req.body;
  if (!chainPubkey || !amount) return res.status(400).json({ error: 'missing fields' });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: existing } = await supabase.from('wp_points').select('balance').eq('chain_pubkey', chainPubkey).maybeSingle();
  if (!existing || existing.balance < amount) return res.status(400).json({ error: 'insufficient balance' });

  await supabase.from('wp_points').update({ balance: existing.balance - amount, updated_at: new Date().toISOString() }).eq('chain_pubkey', chainPubkey);
  return res.status(200).json({ ok: true });
}