import { createClient } from '@supabase/supabase-js';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { chainPubkey, realNametag, amount } = req.body;
  if (!chainPubkey || !realNametag || !amount) return res.status(400).json({ error: 'missing fields' });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: existing } = await supabase.from('wp_points').select('balance').eq('chain_pubkey', chainPubkey).maybeSingle();
  if (!existing || existing.balance < amount) return res.status(400).json({ error: 'insufficient balance' });

  const { sphere } = await Sphere.init({
    ...createNodeProviders({ network: 'testnet2' }),
    mnemonic: process.env.AGENT_WALLET_MNEMONIC!,
  } as any);

  const result = await sphere.payments.send({
    recipient: realNametag.startsWith('@') ? realNametag : `@${realNametag}`,
    amount: String(Math.floor(amount * 1e18)),
    coinId: 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0',
    memo: `WatchPay withdrawal — ${amount} UCT`,
  });

  await supabase.from('wp_points').update({ balance: existing.balance - amount, updated_at: new Date().toISOString() }).eq('chain_pubkey', chainPubkey);
  return res.status(200).json({ txId: result.id });
}