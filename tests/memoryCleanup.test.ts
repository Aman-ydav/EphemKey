import { zeroize, zeroizeMany } from '../backend/src/crypto/zeroize';
import { Zeroizer } from '../backend/src/zeroization/Zeroizer';

describe('Memory Cleanup / Zeroization', () => {
  test('zeroize overwrites buffer with zeros', () => {
    const buf = Buffer.from([0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe]);
    zeroize(buf);
    expect(buf.every((b) => b === 0)).toBe(true);
  });

  test('zeroize returns null', () => {
    const buf = Buffer.alloc(32, 0xff);
    const result = zeroize(buf);
    expect(result).toBeNull();
  });

  test('zeroizeMany clears all provided buffers', () => {
    const bufs = Array.from({ length: 5 }, (_, i) => Buffer.alloc(32, i + 1));
    zeroizeMany(...bufs);
    for (const buf of bufs) {
      expect(buf.every((b) => b === 0)).toBe(true);
    }
  });

  test('Zeroizer.cleanAll wipes all registered buffers', () => {
    const zeroizer = new Zeroizer();
    const b1 = zeroizer.register(Buffer.alloc(16, 0xaa));
    const b2 = zeroizer.register(Buffer.alloc(32, 0xbb));

    zeroizer.cleanAll();

    expect(b1.every((b) => b === 0)).toBe(true);
    expect(b2.every((b) => b === 0)).toBe(true);
  });

  test('zeroize handles null/undefined gracefully', () => {
    expect(() => zeroize(null)).not.toThrow();
    expect(() => zeroize(undefined)).not.toThrow();
  });

  test('Zeroizer is idempotent — second cleanAll does not throw', () => {
    const z = new Zeroizer();
    z.register(Buffer.alloc(8, 0xff));
    z.cleanAll();
    expect(() => z.cleanAll()).not.toThrow();
  });
});
