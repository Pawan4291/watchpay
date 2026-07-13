import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { chainPubkey, address, nametag, mnemonic } = req.body;
  if (!chainPubkey || !address || !nametag || !mnemonic) {
    return res.status(400).json({ error: 'missing fields' });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase
    .from('app_wallets')
    .upsert({ chain_pubkey: chainPubkey, address, nametag, mnemonic_encrypted: mnemonic });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}