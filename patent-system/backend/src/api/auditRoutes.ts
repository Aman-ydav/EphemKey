import { Router, Request, Response } from 'express';
import { auditLogger } from '../audit/AuditLogger';

export function createAuditRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response): void => {
    const limit = parseInt(_req.query['limit'] as string ?? '100', 10);
    const entries = auditLogger.getRecent(Math.min(limit, 500));
    res.status(200).json({ count: entries.length, entries });
  });

  return router;
}
