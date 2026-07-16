import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  const { creator_id } = req.query;
  if (!creator_id) return res.status(400).json({ error: 'missing creator_id' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await supabase
      .from('pending_settlements')
      .select('amount_owed')
      .eq('creator_chain_pubkey', creator_id)
      .maybeSingle();

    return res.status(200).json({ amount_owed: data?.amount_owed ?? 0 });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}