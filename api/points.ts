import { createClient } from '@supabase/supabase-js';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders, createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';

async function getSphere() {
  const base = createNodeProviders({ network: 'testnet2', dataDir: '/tmp/sphere-data', oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' } });
  const providers = createWalletApiProviders(base, {
    baseUrl: 'https://wallet-api.unicity.network',
    network: 'testnet2',
    deviceId: 'watchpay-agent',
  });
  const { sphere } = await Sphere.init({
    ...providers,
    network: 'testnet2',
    mnemonic: process.env.AGENT_WALLET_MNEMONIC!,
  } as any);
  return sphere;
}

export default async function handler(req: any, res: any) {
  const action = req.query.action;
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // ── GET balance (was points-get.ts) ──
  if (req.method === 'GET' && action === 'get') {
    const { chainPubkey } = req.query;
    if (!chainPubkey) return res.status(400).json({ error: 'missing chainPubkey' });
    const { data, error } = await supabase.from('wp_points').select('*').eq('chain_pubkey', chainPubkey).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ balance: data?.balance ?? 0 });
  }

  // ── POST tick (was points-tick.ts) ──
  if (req.method === 'POST' && action === 'tick') {
    const { chainPubkey, videoId, amount } = req.body;
    if (!chainPubkey || !videoId || !amount) return res.status(400).json({ error: 'missing fields' });

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

  // ── POST withdraw (was points-withdraw.ts) ──
  if (req.method === 'POST' && action === 'withdraw') {
    const { chainPubkey, realNametag, amount } = req.body;
    if (!chainPubkey || !realNametag || !amount) return res.status(400).json({ error: 'missing fields' });

    try {
      const { data: existing } = await supabase.from('wp_points').select('balance').eq('chain_pubkey', chainPubkey).maybeSingle();
      if (!existing || existing.balance < amount) return res.status(400).json({ error: 'insufficient balance' });

      const sphere = await getSphere();
      const result = await sphere.payments.send({
        recipient: realNametag.startsWith('@') ? realNametag : `@${realNametag}`,
        amount: String(Math.floor(amount * 1e18)),
        coinId: 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0',
        memo: `WatchPay withdrawal — ${amount} UCT`,
      });

      await supabase.from('wp_points').update({ balance: existing.balance - amount, updated_at: new Date().toISOString() }).eq('chain_pubkey', chainPubkey);
      return res.status(200).json({ txId: result.id });
    } catch (err: any) {
      console.error('[WatchPay] points withdraw crashed:', err);
      return res.status(500).json({ error: err.message ?? 'unknown error' });
    }
  }

  // ── GET deposit-check (was points-deposit-check.ts) ──
  if (req.method === 'GET' && action === 'deposit-check') {
    const { chainPubkey, senderNametag } = req.query;
    if (!chainPubkey || !senderNametag) return res.status(400).json({ error: 'missing params' });

    try {
      const sphere = await getSphere();
      await sphere.payments.receive();
      console.log('[WatchPay] agent wallet identity:', sphere.identity?.nametag, sphere.identity?.directAddress);
      const historyPage: any = await sphere.payments.history();
      const historyItems: any[] = historyPage?.entries ?? [];

      const incoming = historyItems.filter((h: any) => {
        const type = (h.type ?? '').toString().toUpperCase();
        return type === 'RECEIVED' && h.senderPubkey === chainPubkey;
      });

      let creditedTotal = 0;
      for (const tx of incoming) {
        const { error } = await supabase.from('wp_deposits_seen').insert({ transfer_id: tx.tokenId, chain_pubkey: chainPubkey, amount: Number(tx.amount) / 1e18 });
        if (!error) creditedTotal += Number(tx.amount) / 1e18;
      }

      if (creditedTotal > 0) {
        const { data: existing } = await supabase.from('wp_points').select('balance').eq('chain_pubkey', chainPubkey).maybeSingle();
        const newBalance = (existing?.balance ?? 0) + creditedTotal;
        await supabase.from('wp_points').upsert({ chain_pubkey: chainPubkey, real_nametag: senderNametag, balance: newBalance, updated_at: new Date().toISOString() });
      }

      return res.status(200).json({ credited: creditedTotal, historyCount: historyItems.length });
    } catch (err: any) {
      console.error('[WatchPay] points deposit-check crashed:', err);
      return res.status(500).json({ error: err.message ?? 'unknown error' });
    }
  }

  return res.status(400).json({ error: 'unknown action' });
}