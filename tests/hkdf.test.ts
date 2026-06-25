import { deriveKey } from '../backend/src/crypto/hkdf';
import { zeroizeMany } from '../backend/src/crypto/zeroize';
import { randomBytes } from 'crypto';

describe('HKDF Key Derivation', () => {
  test('derived key is 32 bytes (256 bits)', () => {
    const a = randomBytes(48), b = randomBytes(32), c = randomBytes(32), d = randomBytes(32);
    const key = deriveKey(a, b, c, d);
    expect(key.length).toBe(32);
    zeroizeMany(a, b, c, d, key);
  });

  test('same inputs produce same key (deterministic)', () => {
    const a = randomBytes(48), b = randomBytes(32), c = randomBytes(32), d = randomBytes(32);
    const key1 = deriveKey(
      Buffer.from(a), Buffer.from(b), Buffer.from(c), Buffer.from(d)
    );
    const key2 = deriveKey(
      Buffer.from(a), Buffer.from(b), Buffer.from(c), Buffer.from(d)
    );
    expect(key1.equals(key2)).toBe(true);
    zeroizeMany(a, b, c, d, key1, key2);
  });

  test('different shard A produces different key', () => {
    const a1 = randomBytes(48), a2 = randomBytes(48);
    const b = randomBytes(32), c = randomBytes(32), d = randomBytes(32);
    const key1 = deriveKey(a1, b, c, d);
    const key2 = deriveKey(a2, b, c, d);
    expect(key1.equals(key2)).toBe(false);
    zeroizeMany(a1, a2, b, c, d, key1, key2);
  });

  test('output is not a simple hash of the input', () => {
    // HKDF output should not equal sha256(concat(shards))
    const { createHash } = require('crypto');
    const a = randomBytes(48), b = randomBytes(32), c = randomBytes(32), d = randomBytes(32);
    const key = deriveKey(a, b, c, d);
    const naiveHash = createHash('sha256').update(Buffer.concat([a, b, c, d])).digest();
    expect(key.equals(naiveHash)).toBe(false);
    zeroizeMany(a, b, c, d, key);
  });
});
