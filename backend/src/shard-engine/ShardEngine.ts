import { createHmac } from 'crypto';
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
    // Shard A — hardware seed (deterministic per session via sessionId)
    const shardA = await this.hwProvider.getSeed(sessionId);

    // Shard B — server secret (persistent, never stored in DB)
    const shardB = Buffer.from(this.serverSecret); // copy so we can wipe the copy

    // Shard C — session nonce: deterministic per session, unique across sessions.
    // Derived as HMAC-SHA256(serverSecret, sessionId) so that:
    //   - encrypt and decrypt within the same session reconstruct the same key
    //   - a different session ID produces a completely different Shard C (replay prevention)
    //   - the sessionId alone is not sufficient to derive the key (server secret required)
    const shardC = createHmac('sha256', this.serverSecret)
      .update(Buffer.from(sessionId))
      .digest();

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
