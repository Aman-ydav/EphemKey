import { randomBytes } from 'crypto';
import { HardwareProvider } from '../hsm/HardwareProvider';
import { TelemetryEngine, TelemetrySnapshot } from '../telemetry/TelemetryEngine';
import { deriveKey } from '../crypto/hkdf';
import { zeroizeMany } from '../crypto/zeroize';
import { Request } from 'express';

export interface ShardEngineResult {
  runtimeKey: Buffer;
  telemetry: TelemetrySnapshot;
}

/**
 * ShardEngine assembles exactly four independent shards and derives
 * the runtime key via HKDF-SHA256. No component outside this engine
 * ever holds the complete key before reconstruction.
 */
export class ShardEngine {
  constructor(
    private readonly hwProvider: HardwareProvider,
    private readonly telemetryEngine: TelemetryEngine,
    private readonly serverSecret: Buffer // Shard B — loaded from env, never logged
  ) {}

  async reconstruct(req: Request, sessionId: string, requestStart: bigint): Promise<ShardEngineResult> {
    // Shard A — hardware seed
    const shardA = await this.hwProvider.getSeed();

    // Shard B — server secret (persistent, never stored in DB)
    const shardB = Buffer.from(this.serverSecret); // copy so we can wipe the copy

    // Shard C — session nonce (ephemeral per-request random)
    const shardC = randomBytes(32);

    // Shard D — telemetry fingerprint
    const telemetry = this.telemetryEngine.collect(req, sessionId, requestStart);
    const shardD = telemetry.fingerprint;

    // Derive the 256-bit runtime key — this is the ONLY place the full key exists
    const runtimeKey = deriveKey(shardA, shardB, shardC, shardD);

    // Immediately wipe all shard material; key is returned for single-use
    zeroizeMany(shardA, shardB, shardC);
    // shardD is telemetry.fingerprint — caller must not retain it

    return { runtimeKey, telemetry };
  }
}
