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
    const latencyHint = Number((process.hrtime.bigint() - requestStart) / 1_000_000n);

    const requestNonce = randomBytes(16);

    // Timestamp window is floored to WINDOW_SECONDS so that encrypt and decrypt
    // requests made within the same window produce the same fingerprint.
    const timestampWindow = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);

    // Build fingerprint from session-stable factors only.
    // latencyHint, requestNonce, and timestampWindow are excluded from the hash:
    // they vary per request or per 30-second window and would produce a different
    // key for decrypt than was used for encrypt. They are recorded for
    // audit/observability only.
    const hash = createHash('sha256');
    hash.update(sessionId);
    hash.update(Buffer.from(this.serverId));

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
