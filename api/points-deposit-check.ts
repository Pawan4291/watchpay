import { createClient } from '@supabase/supabase-js';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';

export default async function handler(req: any, res: any) {
  const { chainPubkey, senderNametag } = req.query;
  if (!chainPubkey || !senderNametag) return res.status(400).json({ error: 'missing params' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { sphere } = await Sphere.init({
  ...createNodeProviders({ network: 'testnet2', dataDir: '/tmp/sphere-data', tokensDir: '/tmp/tokens-data', oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' } }),
  network: 'testnet2',
  mnemonic: process.env.AGENT_WALLET_MNEMONIC!,
} as any);

   await sphere.payments.receive();
const history = await sphere.payments.getHistory();

    // TEMP DEBUG — log raw shape so we can see real field names
    console.log('[WatchPay] raw history sample:', JSON.stringify(history?.slice?.(0, 3) ?? history, null, 2));

    const incoming = history.filter((h: any) => h.type === 'RECEIVED' && h.senderNametag === senderNametag);
    console.log('[WatchPay] matched incoming count:', incoming.length, 'for senderNametag:', senderNametag);

    let creditedTotal = 0;
    for (const tx of incoming) {
      const { error } = await supabase.from('wp_deposits_seen').insert({ transfer_id: tx.tokenId, chain_pubkey: chainPubkey, amount: Number(tx.amount) / 1e18 });
      if (error) {
        console.log('[WatchPay] insert skipped/failed for tx', tx.tokenId, '-', error.code, error.message);
      } else {
        creditedTotal += Number(tx.amount) / 1e18;
      }
    }

    if (creditedTotal > 0) {
      const { data: existing } = await supabase.from('wp_points').select('balance').eq('chain_pubkey', chainPubkey).maybeSingle();
      const newBalance = (existing?.balance ?? 0) + creditedTotal;
      await supabase.from('wp_points').upsert({ chain_pubkey: chainPubkey, real_nametag: senderNametag, balance: newBalance, updated_at: new Date().toISOString() });
    }

    return res.status(200).json({ credited: creditedTotal, historyCount: history?.length ?? 0 });
  } catch (err: any) {
    console.error('[WatchPay] points-deposit-check crashed:', err);
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}