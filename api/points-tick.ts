import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { chainPubkey, videoId, amount } = req.body;
  if (!chainPubkey || !videoId || !amount) return res.status(400).json({ error: 'missing fields' });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: existing } = await supabase.from('wp_points').select('balance').eq('chain_pubkey', chainPubkey).maybeSingle();
  if (!existing || existing.balance < amount) return res.status(400).json({ error: 'insufficient balance' });

  const { data: video } = await supabase.from('videos').select('creator_chain_pubkey, creator_nametag').eq('id', videoId).maybeSingle();
  if (!video) return res.status(404).json({ error: 'video not found' });

  await supabase.from('wp_points').update({ balance: existing.balance - amount, updated_at: new Date().toISOString() }).eq('chain_pubkey', chainPubkey);

  const { data: pending } = await supabase.from('pending_settlements').select('amount_owed').eq('creator_chain_pubkey', video.creator_chain_pubkey).maybeSingle();
  const newOwed = (pending?.amount_owed ?? 0) + amount;
  await supabase.from('pending_settlements').upsert({
    creator_chain_pubkey: video.creator_chain_pubkey,
    creator_nametag: video.creator_nametag,
    amount_owed: newOwed,
    updated_at: new Date().toISOString(),
  });

  // Track per-video earnings for the creator's breakdown view
  const { data: videoEarning } = await supabase.from('video_earnings').select('total_earned').eq('video_id', videoId).maybeSingle();
  const newVideoTotal = (videoEarning?.total_earned ?? 0) + amount;
  await supabase.from('video_earnings').upsert({
    video_id: videoId,
    creator_chain_pubkey: video.creator_chain_pubkey,
    total_earned: newVideoTotal,
    updated_at: new Date().toISOString(),
  });

  await supabase.from('watch_sessions')
    .update({ total_ticks: 1, total_spent: amount })
    .eq('video_id', videoId)
    .eq('viewer_chain_pubkey', chainPubkey)
    .is('ended_at', null);

  return res.status(200).json({ ok: true });
}