import { createClient } from '@supabase/supabase-js';

export default async function handler(_req: any, res: any) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { count: activeSessions } = await supabase
      .from('watch_sessions')
      .select('*', { count: 'exact', head: true })
      .is('ended_at', null);

    const { data: settlementRows } = await supabase
      .from('settlements')
      .select('creator_chain_pubkey');

    const creatorsEarning = new Set((settlementRows ?? []).map((r: any) => r.creator_chain_pubkey)).size;

    return res.status(200).json({
      activeSessions: activeSessions ?? 0,
      creatorsEarning,
    });
  } catch (err: any) {
    console.error('[WatchPay] watch-stats crashed:', err);
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}