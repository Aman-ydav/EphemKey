import { zeroize, zeroizeMany } from '../crypto/zeroize';

/**
 * Zeroizer provides a structured cleanup context.
 * Register sensitive buffers during an operation and call cleanAll()
 * in a finally block to guarantee they are wiped regardless of errors.
 */
export class Zeroizer {
  private registry: Buffer[] = [];

  register(buf: Buffer): Buffer {
    this.registry.push(buf);
    return buf;
  }

  cleanAll(): void {
    for (const buf of this.registry) {
      zeroize(buf);
    }
    this.registry = [];
  }
}
