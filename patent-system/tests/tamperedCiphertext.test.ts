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

describe('Tampered Ciphertext', () => {
  test('modified ciphertext throws on decrypt', () => {
    const key = makeKey();
    const { ciphertext, iv, authTag } = encrypt(Buffer.from('secret data'), key);
    ciphertext[0] ^= 0xff; // flip first byte

    expect(() => decrypt(ciphertext, iv, authTag, key)).toThrow();
    zeroizeMany(key);
  });

  test('modified authTag throws on decrypt', () => {
    const key = makeKey();
    const { ciphertext, iv, authTag } = encrypt(Buffer.from('secret data'), key);
    authTag[0] ^= 0x01;

    expect(() => decrypt(ciphertext, iv, authTag, key)).toThrow();
    zeroizeMany(key);
  });

  test('modified IV throws on decrypt', () => {
    const key = makeKey();
    const { ciphertext, iv, authTag } = encrypt(Buffer.from('secret data'), key);
    iv[0] ^= 0x80;

    expect(() => decrypt(ciphertext, iv, authTag, key)).toThrow();
    zeroizeMany(key);
  });

  test('wrong key throws on decrypt', () => {
    const key1 = makeKey();
    const key2 = makeKey();
    const { ciphertext, iv, authTag } = encrypt(Buffer.from('secret'), key1);

    expect(() => decrypt(ciphertext, iv, authTag, key2)).toThrow();
    zeroizeMany(key1, key2);
  });
});
