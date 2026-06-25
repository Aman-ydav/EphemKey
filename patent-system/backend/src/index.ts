import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './db/connection';
import { SoftwareHSM } from './hsm/SoftwareHSM';
import { TelemetryEngine } from './telemetry/TelemetryEngine';
import { ShardEngine } from './shard-engine/ShardEngine';
import { createEncryptionMiddleware } from './middleware/encryptionMiddleware';
import { createSecureRouter } from './api/secureRoutes';
import { createHealthRouter } from './api/healthRoutes';
import { createBenchmarkRouter } from './api/benchmarkRoutes';
import { createAuditRouter } from './api/auditRoutes';
import { logger } from './utils/logger';

async function bootstrap() {
  const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
  const MONGODB_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/patent_system';
  const SERVER_ID = process.env['SERVER_ID'] ?? 'patent-node-01';
  const SERVER_SECRET_HEX = process.env['SERVER_SECRET'] ?? '';

  if (!SERVER_SECRET_HEX || SERVER_SECRET_HEX.length < 64) {
    throw new Error('SERVER_SECRET env var must be at least 32 bytes (64 hex chars)');
  }

  const serverSecret = Buffer.from(SERVER_SECRET_HEX, 'hex');

  // Initialise subsystems
  const hwProvider = new SoftwareHSM(SERVER_ID);
  const telemetryEngine = new TelemetryEngine(SERVER_ID);
  const shardEngine = new ShardEngine(hwProvider, telemetryEngine, serverSecret);

  // Connect to MongoDB
  await connectDB(MONGODB_URI);

  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000' }));
  app.use(express.json({ limit: '1mb' }));

  // Attach request IDs (done inside middleware but set early for all routes)
  app.use((req, _res, next) => {
    req.requestStart = process.hrtime.bigint();
    next();
  });

  // Encryption middleware on all /secure routes
  const encryptionMiddleware = createEncryptionMiddleware(shardEngine);
  app.use('/secure', encryptionMiddleware);
  app.use('/secure', createSecureRouter());

  // Other routes — no encryption middleware needed
  app.use('/health', createHealthRouter(hwProvider));
  app.use('/benchmark', createBenchmarkRouter());
  app.use('/audit', createAuditRouter());

  const server = app.listen(PORT, () => {
    logger.info('Patent system backend started', { port: PORT, serverId: SERVER_ID });
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    server.close(async () => {
      await hwProvider.destroy();
      serverSecret.fill(0);
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export { bootstrap };
