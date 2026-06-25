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

  async getSeed(sessionId: string): Promise<Buffer> {
    // Derive a session-stable seed: same sessionId → same Shard A within this
    // master-seed rotation period. The master seed is never exposed directly.
    const hmac = createHmac('sha256', this.masterSeed);
    hmac.update(Buffer.from(sessionId));
    hmac.update(Buffer.from(this.serverId));
    return hmac.digest(); // 32 bytes
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
