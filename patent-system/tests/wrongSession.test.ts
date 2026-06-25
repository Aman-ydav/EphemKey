import { deriveKey } from '../backend/src/crypto/hkdf';
import { encrypt } from '../backend/src/crypto/encrypt';
import { decrypt } from '../backend/src/crypto/decrypt';
import { zeroizeMany } from '../backend/src/crypto/zeroize';
import { randomBytes } from 'crypto';

/**
 * Simulates a different session/telemetry producing a different key.
 * The same ciphertext must not decrypt with a key from a different session.
 */
describe('Wrong Session / Wrong Telemetry', () => {
  test('different session nonce produces different key and fails decryption', () => {
    const shardA = randomBytes(48);
    const shardB = randomBytes(32);
    const shardD = randomBytes(32);

    const sessionNonce1 = randomBytes(32); // Shard C session 1
    const sessionNonce2 = randomBytes(32); // Shard C session 2

    const key1 = deriveKey(shardA, shardB, sessionNonce1, shardD);
    const key2 = deriveKey(shardA, shardB, sessionNonce2, shardD);

    const { ciphertext, iv, authTag } = encrypt(Buffer.from('session-bound secret'), key1);

    expect(() => decrypt(ciphertext, iv, authTag, key2)).toThrow();

    zeroizeMany(shardA, shardB, shardD, sessionNonce1, sessionNonce2, key1, key2);
  });

  test('different telemetry fingerprint produces different key and fails decryption', () => {
    const shardA = randomBytes(48);
    const shardB = randomBytes(32);
    const shardC = randomBytes(32);

    const telemetry1 = randomBytes(32); // Shard D moment 1
    const telemetry2 = randomBytes(32); // Shard D moment 2

    const key1 = deriveKey(shardA, shardB, shardC, telemetry1);
    const key2 = deriveKey(shardA, shardB, shardC, telemetry2);

    const { ciphertext, iv, authTag } = encrypt(Buffer.from('telemetry-bound secret'), key1);

    expect(() => decrypt(ciphertext, iv, authTag, key2)).toThrow();

    zeroizeMany(shardA, shardB, shardC, telemetry1, telemetry2, key1, key2);
  });
});
