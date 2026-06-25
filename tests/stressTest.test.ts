import { encrypt } from '../backend/src/crypto/encrypt';
import { decrypt } from '../backend/src/crypto/decrypt';
import { deriveKey } from '../backend/src/crypto/hkdf';
import { zeroizeMany } from '../backend/src/crypto/zeroize';
import { randomBytes } from 'crypto';

function cycle(): void {
  const a = randomBytes(48), b = randomBytes(32), c = randomBytes(32), d = randomBytes(32);
  const key = deriveKey(a, b, c, d);
  const plaintext = randomBytes(256);
  const { ciphertext, iv, authTag } = encrypt(plaintext, key);
  const recovered = decrypt(ciphertext, iv, authTag, key);
  if (!recovered.equals(plaintext)) throw new Error('Round-trip failed');
  zeroizeMany(a, b, c, d, key);
  plaintext.fill(0);
  recovered.fill(0);
}

describe('Stress Test — 1000 requests', () => {
  test('1000 sequential encrypt/decrypt cycles succeed', () => {
    for (let i = 0; i < 1000; i++) {
      expect(() => cycle()).not.toThrow();
    }
  });

  test('1000 operations complete within 10 seconds', () => {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) cycle();
    const elapsed = Date.now() - start;
    console.log(`1000 cycles in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(10_000);
  });
});
