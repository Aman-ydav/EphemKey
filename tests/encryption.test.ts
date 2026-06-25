import { encrypt } from '../backend/src/crypto/encrypt';
import { decrypt } from '../backend/src/crypto/decrypt';
import { deriveKey } from '../backend/src/crypto/hkdf';
import { zeroizeMany } from '../backend/src/crypto/zeroize';
import { randomBytes } from 'crypto';

function makeKey(): Buffer {
  const a = randomBytes(48), b = randomBytes(32), c = randomBytes(32), d = randomBytes(32);
  const key = deriveKey(a, b, c, d);
  zeroizeMany(a, b, c, d);
  return key;
}

describe('Encryption', () => {
  test('encrypt produces non-empty ciphertext, iv, and authTag', () => {
    const key = makeKey();
    const plaintext = Buffer.from('Hello, patent system!');
    const result = encrypt(plaintext, key);

    expect(result.ciphertext).toBeInstanceOf(Buffer);
    expect(result.ciphertext.length).toBeGreaterThan(0);
    expect(result.iv.length).toBe(12);
    expect(result.authTag.length).toBe(16);

    zeroizeMany(key);
  });

  test('ciphertext differs from plaintext', () => {
    const key = makeKey();
    const plaintext = Buffer.from('SensitiveData');
    const { ciphertext } = encrypt(plaintext, key);

    expect(ciphertext.equals(plaintext)).toBe(false);
    zeroizeMany(key);
  });

  test('each encryption produces a different IV', () => {
    const key = makeKey();
    const plaintext = Buffer.from('same data');
    const r1 = encrypt(plaintext, key);
    const r2 = encrypt(plaintext, key);

    expect(r1.iv.equals(r2.iv)).toBe(false);
    zeroizeMany(key);
  });

  test('ciphertext length matches plaintext length for GCM', () => {
    const key = makeKey();
    const plaintext = Buffer.from('exactly sixteen!');
    const { ciphertext } = encrypt(plaintext, key);
    expect(ciphertext.length).toBe(plaintext.length);
    zeroizeMany(key);
  });
});

describe('Decryption', () => {
  test('decrypt recovers original plaintext', () => {
    const key = makeKey();
    const original = 'Patent runtime key reconstruction test';
    const plaintext = Buffer.from(original);
    const { ciphertext, iv, authTag } = encrypt(plaintext, key);
    const recovered = decrypt(ciphertext, iv, authTag, key);

    expect(recovered.toString('utf-8')).toBe(original);
    zeroizeMany(key);
    recovered.fill(0);
  });

  test('large payload round-trips correctly', () => {
    const key = makeKey();
    const original = 'x'.repeat(100_000);
    const { ciphertext, iv, authTag } = encrypt(Buffer.from(original), key);
    const recovered = decrypt(ciphertext, iv, authTag, key);
    expect(recovered.toString()).toBe(original);
    zeroizeMany(key);
  });
});
