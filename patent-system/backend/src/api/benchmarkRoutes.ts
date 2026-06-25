import { Router, Request, Response } from 'express';
import { runBenchmark } from '../benchmarks/BenchmarkRunner';
import { auditLogger } from '../audit/AuditLogger';
import { logger } from '../utils/logger';

export function createBenchmarkRouter(): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    const start = process.hrtime.bigint();
    try {
      const iterations = parseInt(req.query['iterations'] as string ?? '1000', 10);
      const clamped = Math.min(Math.max(iterations, 10), 10_000);

      const result = await runBenchmark(clamped);
      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);

      auditLogger.record({
        operation: 'BENCHMARK',
        requestId: req.requestId,
        durationMs,
        status: 'SUCCESS'
      });

      logger.info('Benchmark complete', { requestId: req.requestId, iterations: clamped, durationMs });
      res.status(200).json(result);
    } catch (err) {
      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
      auditLogger.record({
        operation: 'BENCHMARK',
        requestId: req.requestId,
        durationMs,
        status: 'FAILURE',
        errorCode: 'BENCHMARK_ERROR'
      });
      res.status(500).json({ error: 'Benchmark failed', requestId: req.requestId });
    }
  });

  return router;
}
