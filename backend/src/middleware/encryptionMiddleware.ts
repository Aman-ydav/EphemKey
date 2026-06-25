import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ShardEngine } from '../shard-engine/ShardEngine';
import { encrypt } from '../crypto/encrypt';
import { decrypt } from '../crypto/decrypt';
import { zeroize } from '../crypto/zeroize';
import { Zeroizer } from '../zeroization/Zeroizer';
import { auditLogger } from '../audit/AuditLogger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      requestStart: bigint;
      sessionId: string;
      cryptoContext?: {
        encrypt: (plaintext: Buffer) => { ciphertext: Buffer; iv: Buffer; authTag: Buffer };
        decrypt: (ciphertext: Buffer, iv: Buffer, authTag: Buffer) => Buffer;
      };
    }
  }
}

/**
 * encryptionMiddleware — executes on every request.
 *
 * Flow (per spec):
 *   1. Validate request
 *   2. Collect runtime factors
 *   3. Generate/retrieve shard inputs
 *   4. Derive runtime key
 *   5. Attach crypto context (encrypt/decrypt closures that hold the key)
 *   6. Continue request
 *   7. Erase memory (via Zeroizer registered in the closure)
 */
export function createEncryptionMiddleware(shardEngine: ShardEngine) {
  return async function encryptionMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const requestStart = process.hrtime.bigint();
    req.requestId = uuidv4();
    req.requestStart = requestStart;
    req.sessionId = (req.headers['x-session-id'] as string) ?? uuidv4();

    const zeroizer = new Zeroizer();
    let runtimeKey: Buffer | null = null;

    try {
      // Steps 2–4: collect runtime factors and derive runtime key
      const { runtimeKey: key, telemetry } = await shardEngine.reconstruct(
        req,
        req.sessionId,
        requestStart
      );

      runtimeKey = key;
      zeroizer.register(runtimeKey);

      // Step 5: attach single-use crypto context to request
      req.cryptoContext = {
        encrypt: (plaintext: Buffer) => {
          const result = encrypt(plaintext, runtimeKey!);
          return result;
        },
        decrypt: (ciphertext: Buffer, iv: Buffer, authTag: Buffer) => {
          return decrypt(ciphertext, iv, authTag, runtimeKey!);
        }
      };

      // Clean up after response is sent
      res.on('finish', () => {
        zeroizer.cleanAll();
        runtimeKey = null;
        req.cryptoContext = undefined;
      });

      next();
    } catch (err) {
      zeroizer.cleanAll();
      runtimeKey = null;

      const durationMs = Number((process.hrtime.bigint() - requestStart) / 1_000_000n);
      auditLogger.record({
        operation: 'ENCRYPT_SAVE',
        requestId: req.requestId,
        durationMs,
        status: 'FAILURE',
        errorCode: 'MIDDLEWARE_INIT_FAILED'
      });

      res.status(500).json({ error: 'Cryptographic initialisation failed', requestId: req.requestId });
    }
  };
}
