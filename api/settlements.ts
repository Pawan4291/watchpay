import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  const { creator_id } = req.query;
  if (!creator_id) return res.status(400).json({ error: 'missing creator_id' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('creator_chain_pubkey', creator_id)
      .order('timestamp', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data ?? []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}