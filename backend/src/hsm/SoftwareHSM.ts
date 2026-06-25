import { randomBytes, createHmac } from 'crypto';
import { HardwareProvider } from './HardwareProvider';
import { zeroize } from '../crypto/zeroize';

const SEED_LENGTH = 32;

/**
 * SoftwareHSM — software emulation of a hardware security module.
 * Rotates its internal master seed on every construction and periodically.
 * In production this would be replaced by TPM / HSM / KMS without changing
 * the middleware interface.
 */
export class SoftwareHSM implements HardwareProvider {
  private masterSeed: Buffer;
  private rotationTimer: NodeJS.Timeout;
  private readonly serverId: string;

  constructor(serverId: string, rotationIntervalMs = 3_600_000) {
    this.serverId = serverId;
    this.masterSeed = randomBytes(SEED_LENGTH);
    this.rotationTimer = setInterval(() => this.rotate(), rotationIntervalMs);
    // Allow Node to exit even if the timer is still running
    this.rotationTimer.unref();
  }

  async getSeed(): Promise<Buffer> {
    // Derive a request-specific seed from the master seed so that each call
    // produces a unique Shard A without exposing the master directly.
    const nonce = randomBytes(16);
    const hmac = createHmac('sha256', this.masterSeed);
    hmac.update(nonce);
    hmac.update(Buffer.from(this.serverId));
    const derived = Buffer.concat([hmac.digest(), nonce]); // 48 bytes
    nonce.fill(0);
    return derived;
  }

  async destroy(): Promise<void> {
    clearInterval(this.rotationTimer);
    this.masterSeed = zeroize(this.masterSeed) as unknown as Buffer ?? Buffer.alloc(0);
  }

  async healthCheck(): Promise<boolean> {
    return Buffer.isBuffer(this.masterSeed) && this.masterSeed.length === SEED_LENGTH;
  }

  private rotate(): void {
    const old = this.masterSeed;
    this.masterSeed = randomBytes(SEED_LENGTH);
    zeroize(old);
  }
}
