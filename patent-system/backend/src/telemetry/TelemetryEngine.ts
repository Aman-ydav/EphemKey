import { randomBytes, createHash } from 'crypto';
import { Request } from 'express';

export interface TelemetrySnapshot {
  sessionId: string;
  requestNonce: Buffer;
  timestampWindow: number; // Unix epoch seconds, floored to 30-second window
  serverId: string;
  latencyHint: number; // ms since request start
  fingerprint: Buffer; // SHA-256 of all fields — used as Shard D
}

const WINDOW_SECONDS = 30;

/**
 * TelemetryEngine collects runtime factors for Shard D derivation.
 * Deliberately excludes IP address, GPS, and browser fingerprint.
 */
export class TelemetryEngine {
  private readonly serverId: string;

  constructor(serverId: string) {
    this.serverId = serverId;
  }

  collect(req: Request, sessionId: string, requestStart: bigint): TelemetrySnapshot {
    const nowMs = Number(process.hrtime.bigint() / 1_000_000n);
    const latencyHint = Number((process.hrtime.bigint() - requestStart) / 1_000_000n);

    const requestNonce = randomBytes(16);
    const timestampWindow = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);

    // Build fingerprint from runtime factors — no user-identifiable data
    const hash = createHash('sha256');
    hash.update(sessionId);
    hash.update(requestNonce);
    hash.update(Buffer.from(String(timestampWindow)));
    hash.update(Buffer.from(this.serverId));
    hash.update(Buffer.from(String(latencyHint)));

    const fingerprint = hash.digest();

    return {
      sessionId,
      requestNonce,
      timestampWindow,
      serverId: this.serverId,
      latencyHint,
      fingerprint
    };
  }
}
