import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase.from('settlements').select('amount');
    if (error) return res.status(500).json({ error: error.message });
    const total = (data ?? []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    return res.status(200).json({ total: total.toFixed(6) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}