import { createClient } from '@supabase/supabase-js';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';

export default async function handler(req: any, res: any) {
  const { chainPubkey, senderNametag } = req.query;
  if (!chainPubkey || !senderNametag) return res.status(400).json({ error: 'missing params' });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { sphere } = await Sphere.init({
    ...createNodeProviders({ network: 'testnet2' }),
    mnemonic: process.env.AGENT_WALLET_MNEMONIC!,
  } as any);

  const history = await sphere.payments.getHistory();
  const incoming = history.filter((h: any) => h.type === 'RECEIVED' && h.senderNametag === senderNametag);

  let creditedTotal = 0;
  for (const tx of incoming) {
    const { error } = await supabase.from('wp_deposits_seen').insert({ transfer_id: tx.tokenId, chain_pubkey: chainPubkey, amount: Number(tx.amount) / 1e18 });
    if (!error) creditedTotal += Number(tx.amount) / 1e18; // insert succeeded = not seen before
  }

  if (creditedTotal > 0) {
    const { data: existing } = await supabase.from('wp_points').select('balance').eq('chain_pubkey', chainPubkey).maybeSingle();
    const newBalance = (existing?.balance ?? 0) + creditedTotal;
    await supabase.from('wp_points').upsert({ chain_pubkey: chainPubkey, real_nametag: senderNametag, balance: newBalance, updated_at: new Date().toISOString() });
  }

  return res.status(200).json({ credited: creditedTotal });
}