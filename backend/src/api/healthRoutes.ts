import { Router, Request, Response } from 'express';
import { HardwareProvider } from '../hsm/HardwareProvider';
import { secureRecordRepository } from '../db/repositories/SecureRecordRepository';

export function createHealthRouter(hwProvider: HardwareProvider): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    const hsmOk = await hwProvider.healthCheck();
    const recordCount = await secureRecordRepository.count().catch(() => -1);

    res.status(200).json({
      status: 'healthy',
      time: new Date().toISOString(),
      hsm: hsmOk ? 'operational' : 'degraded',
      recordCount
    });
  });

  return router;
}
