import { v4 as uuidv4 } from 'uuid';

export type AuditOperation = 'ENCRYPT_SAVE' | 'DECRYPT_READ' | 'DELETE' | 'BENCHMARK' | 'HEALTH';
export type AuditStatus = 'SUCCESS' | 'FAILURE';

export interface AuditEntry {
  entryId: string;
  timestamp: string;
  operation: AuditOperation;
  recordId?: string;
  requestId: string;
  durationMs: number;
  status: AuditStatus;
  errorCode?: string;
}

const MAX_ENTRIES = 10_000;
const log: AuditEntry[] = [];

/**
 * AuditLogger stores operation metadata only.
 * Keys, plaintext, ciphertext, IV, auth tags, and shard values are NEVER logged.
 */
export class AuditLogger {
  record(entry: Omit<AuditEntry, 'entryId' | 'timestamp'>): AuditEntry {
    const full: AuditEntry = {
      entryId: uuidv4(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    log.push(full);

    // Rolling window — drop oldest entries when over limit
    if (log.length > MAX_ENTRIES) {
      log.shift();
    }

    return full;
  }

  getAll(): AuditEntry[] {
    return [...log];
  }

  getRecent(limit = 100): AuditEntry[] {
    return log.slice(-limit).reverse();
  }

  clear(): void {
    log.length = 0;
  }
}

export const auditLogger = new AuditLogger();
