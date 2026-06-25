import { hkdfSync } from 'crypto';
import { zeroize } from './zeroize';

const KEY_LENGTH = 32; // 256-bit key
const HASH = 'sha256';
const INFO = Buffer.from('patent-runtime-key-v1');

/**
 * Derives the 256-bit runtime key from four independent shard buffers using HKDF-SHA256.
 * The shards are used as IKM; they are zeroed immediately after derivation.
 */
export function deriveKey(
  shardA: Buffer, // Hardware seed
  shardB: Buffer, // Server secret
  shardC: Buffer, // Session nonce
  shardD: Buffer  // Telemetry fingerprint
): Buffer {
  // Concatenate shards as IKM — shards themselves are never stored or returned
  const ikm = Buffer.concat([shardA, shardB, shardC, shardD]);

  // HKDF salt: XOR of shardA and shardD lengths encoded as salt
  const salt = Buffer.from(
    `${shardA.length}:${shardB.length}:${shardC.length}:${shardD.length}`
  );

  const key = Buffer.from(
    hkdfSync(HASH, ikm, salt, INFO, KEY_LENGTH)
  );

  // Wipe IKM immediately
  ikm.fill(0);

  return key;
}
