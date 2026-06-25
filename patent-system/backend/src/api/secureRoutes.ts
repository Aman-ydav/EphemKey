import { Router, Request, Response } from 'express';
import { secureRecordRepository } from '../db/repositories/SecureRecordRepository';
import { auditLogger } from '../audit/AuditLogger';
import { logger } from '../utils/logger';

export function createSecureRouter(): Router {
  const router = Router();

  // POST /secure/save
  router.post('/save', async (req: Request, res: Response): Promise<void> => {
    const start = process.hrtime.bigint();
    try {
      if (!req.cryptoContext) {
        res.status(500).json({ error: 'Crypto context unavailable' });
        return;
      }

      const { data, metadata } = req.body as { data: string; metadata?: Record<string, unknown> };
      if (!data || typeof data !== 'string') {
        res.status(400).json({ error: 'Field "data" (string) is required' });
        return;
      }

      const plaintext = Buffer.from(data, 'utf-8');
      const { ciphertext, iv, authTag } = req.cryptoContext.encrypt(plaintext);
      plaintext.fill(0); // wipe plaintext buffer immediately

      const recordId = await secureRecordRepository.save({ ciphertext, iv, authTag, metadata });

      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
      auditLogger.record({
        operation: 'ENCRYPT_SAVE',
        recordId,
        requestId: req.requestId,
        durationMs,
        status: 'SUCCESS'
      });

      logger.info('Record saved', { requestId: req.requestId, recordId, durationMs });
      res.status(201).json({ recordId, requestId: req.requestId, durationMs });
    } catch (err) {
      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
      auditLogger.record({
        operation: 'ENCRYPT_SAVE',
        requestId: req.requestId,
        durationMs,
        status: 'FAILURE',
        errorCode: 'SAVE_ERROR'
      });
      logger.error('Save failed', { requestId: req.requestId, error: String(err) });
      res.status(500).json({ error: 'Save failed', requestId: req.requestId });
    }
  });

  // GET /secure/read/:id
  router.get('/read/:id', async (req: Request, res: Response): Promise<void> => {
    const start = process.hrtime.bigint();
    const { id } = req.params;

    try {
      if (!req.cryptoContext) {
        res.status(500).json({ error: 'Crypto context unavailable' });
        return;
      }

      const record = await secureRecordRepository.findById(id);
      if (!record) {
        res.status(404).json({ error: 'Record not found', requestId: req.requestId });
        return;
      }

      const plaintext = req.cryptoContext.decrypt(
        record.ciphertext,
        record.iv,
        record.authTag
      );

      const data = plaintext.toString('utf-8');
      plaintext.fill(0); // wipe immediately

      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
      auditLogger.record({
        operation: 'DECRYPT_READ',
        recordId: id,
        requestId: req.requestId,
        durationMs,
        status: 'SUCCESS'
      });

      logger.info('Record read', { requestId: req.requestId, recordId: id, durationMs });
      res.status(200).json({ data, metadata: record.metadata, requestId: req.requestId, durationMs });
    } catch (err) {
      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
      auditLogger.record({
        operation: 'DECRYPT_READ',
        recordId: id,
        requestId: req.requestId,
        durationMs,
        status: 'FAILURE',
        errorCode: 'DECRYPT_ERROR'
      });
      logger.error('Read/decrypt failed', { requestId: req.requestId, error: String(err) });
      res.status(400).json({ error: 'Decryption failed — invalid session or tampered record', requestId: req.requestId });
    }
  });

  // DELETE /secure/delete/:id
  router.delete('/delete/:id', async (req: Request, res: Response): Promise<void> => {
    const start = process.hrtime.bigint();
    const { id } = req.params;

    try {
      const deleted = await secureRecordRepository.deleteById(id);
      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);

      if (!deleted) {
        res.status(404).json({ error: 'Record not found', requestId: req.requestId });
        return;
      }

      auditLogger.record({
        operation: 'DELETE',
        recordId: id,
        requestId: req.requestId,
        durationMs,
        status: 'SUCCESS'
      });

      logger.info('Record deleted', { requestId: req.requestId, recordId: id, durationMs });
      res.status(200).json({ deleted: true, requestId: req.requestId, durationMs });
    } catch (err) {
      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
      auditLogger.record({
        operation: 'DELETE',
        recordId: id,
        requestId: req.requestId,
        durationMs,
        status: 'FAILURE',
        errorCode: 'DELETE_ERROR'
      });
      res.status(500).json({ error: 'Delete failed', requestId: req.requestId });
    }
  });

  return router;
}
