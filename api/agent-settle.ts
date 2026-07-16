import { createClient } from '@supabase/supabase-js';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders, createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';

export default async function handler(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.AGENT_SECRET}`) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: pending, error: pendingErr } = await supabase
      .from('pending_settlements')
      .select('*')
      .gte('amount_owed', 5);

    if (pendingErr) return res.status(500).json({ error: pendingErr.message });
    if (!pending || pending.length === 0) {
      return res.status(200).json({ settled: 0, message: 'nothing pending' });
    }

    const base = createNodeProviders({ network: 'testnet2', dataDir: '/tmp/sphere-data', tokensDir: '/tmp/tokens-data', oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' } });
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

    const results = [];

    for (const row of pending) {
      try {
        const recipient = row.creator_nametag.startsWith('@') ? row.creator_nametag : `@${row.creator_nametag}`;
        const result = await sphere.payments.send({
          recipient,
          amount: String(Math.floor(row.amount_owed * 1e18)),
          coinId: 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0',
          memo: `Watch payment settlement — ${row.amount_owed.toFixed(6)} UCT`,
        });

        await supabase.from('settlements').insert({
          creator_chain_pubkey: row.creator_chain_pubkey,
          creator_nametag: row.creator_nametag,
          amount: row.amount_owed,
          tx_id: result.id,
          memo: `Watch payment settlement — ${row.amount_owed.toFixed(6)} UCT`,
        });

        await supabase.from('pending_settlements')
          .update({ amount_owed: 0, updated_at: new Date().toISOString() })
          .eq('creator_chain_pubkey', row.creator_chain_pubkey);

        await supabase.from('agent_log').insert({
          action_type: 'settlement',
          details: { creator_nametag: row.creator_nametag, amount: row.amount_owed, tx_id: result.id },
        });

        results.push({ creator: row.creator_nametag, amount: row.amount_owed, tx_id: result.id, ok: true });
      } catch (err: any) {
        console.error('[WatchPay] settle failed for', row.creator_nametag, err);
        results.push({ creator: row.creator_nametag, ok: false, error: err.message });
      }
    }

    return res.status(200).json({ settled: results.filter(r => r.ok).length, results });
  } catch (err: any) {
    console.error('[WatchPay] agent-settle crashed:', err);
    return res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}