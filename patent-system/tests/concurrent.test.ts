import { encrypt } from '../backend/src/crypto/encrypt';
import { decrypt } from '../backend/src/crypto/decrypt';
import { deriveKey } from '../backend/src/crypto/hkdf';
import { zeroizeMany } from '../backend/src/crypto/zeroize';
import { randomBytes } from 'crypto';

function buildKey(): Buffer {
  const a = randomBytes(48), b = randomBytes(32), c = randomBytes(32), d = randomBytes(32);
  const key = deriveKey(a, b, c, d);
  zeroizeMany(a, b, c, d);
  return key;
}

describe('Concurrent Requests', () => {
  test('50 simultaneous encrypt+decrypt operations all succeed independently', async () => {
    const tasks = Array.from({ length: 50 }, async (_, i) => {
      const key = buildKey();
      const plaintext = Buffer.from(`Concurrent payload ${i} — unique data point`);
      const { ciphertext, iv, authTag } = encrypt(plaintext, key);
      const recovered = decrypt(ciphertext, iv, authTag, key);

      const ok = recovered.toString() === plaintext.toString();
      zeroizeMany(key);
      recovered.fill(0);
      return ok;
    });

    const results = await Promise.all(tasks);
    expect(results.every(Boolean)).toBe(true);
  });

  test('keys derived concurrently are all unique', async () => {
    const COUNT = 100;
    const keys = await Promise.all(
      Array.from({ length: COUNT }, async () => buildKey())
    );

    const hexSet = new Set(keys.map((k) => k.toString('hex')));
    expect(hexSet.size).toBe(COUNT); // all unique

    keys.forEach((k) => zeroizeMany(k));
  });
});
