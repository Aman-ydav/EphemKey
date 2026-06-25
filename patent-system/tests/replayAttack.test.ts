import { deriveKey } from '../backend/src/crypto/hkdf';
import { encrypt } from '../backend/src/crypto/encrypt';
import { decrypt } from '../backend/src/crypto/decrypt';
import { zeroizeMany } from '../backend/src/crypto/zeroize';
import { randomBytes } from 'crypto';

/**
 * Replay attack: the same ciphertext replayed in a new request fails because
 * Shard C (session nonce) is freshly random per request — the reconstructed key
 * is different each time, so the old ciphertext cannot be decrypted.
 */
describe('Replay Attack', () => {
  test('ciphertext from request-1 cannot be decrypted with request-2 key', () => {
    const shardA = randomBytes(48);
    const shardB = randomBytes(32);
    const shardD = randomBytes(32);

    // Request 1 — unique session nonce
    const nonceReq1 = randomBytes(32);
    const keyReq1 = deriveKey(shardA, shardB, nonceReq1, shardD);
    const { ciphertext, iv, authTag } = encrypt(Buffer.from('replay target'), keyReq1);

    // Request 2 — fresh nonce, same other shards
    const nonceReq2 = randomBytes(32);
    const keyReq2 = deriveKey(shardA, shardB, nonceReq2, shardD);

    // Attempt to decrypt with request-2 key — must fail
    expect(() => decrypt(ciphertext, iv, authTag, keyReq2)).toThrow();

    zeroizeMany(shardA, shardB, shardD, nonceReq1, nonceReq2, keyReq1, keyReq2);
  });

  test('replaying ciphertext after telemetry window rolls fails', () => {
    const shardA = randomBytes(48);
    const shardB = randomBytes(32);
    const shardC = randomBytes(32);

    const window1 = randomBytes(32); // Shard D old window
    const window2 = randomBytes(32); // Shard D new window (time has passed)

    const keyOld = deriveKey(shardA, shardB, shardC, window1);
    const keyNew = deriveKey(shardA, shardB, shardC, window2);

    const { ciphertext, iv, authTag } = encrypt(Buffer.from('old data'), keyOld);

    expect(() => decrypt(ciphertext, iv, authTag, keyNew)).toThrow();

    zeroizeMany(shardA, shardB, shardC, window1, window2, keyOld, keyNew);
  });
});
