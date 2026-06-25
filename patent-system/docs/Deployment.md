# Deployment

## Prerequisites

- Node.js 20+
- MongoDB 7+
- Docker + Docker Compose (for containerised deployment)

## Development — Local

```bash
# 1. Start MongoDB
docker-compose -f docker-compose.dev.yml up -d

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set SERVER_SECRET to a 64-char hex string

# 4. Start backend
npm run dev

# 5. Install and start frontend (separate terminal)
cd ../frontend
npm install
npm start
```

Backend: http://localhost:3001  
Frontend: http://localhost:3000

## Production — Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

Services:
- `mongodb` — port 27017
- `backend` — port 3001
- `frontend` — port 3000 (nginx)

## Environment Variables (Backend)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default 3001) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `SERVER_SECRET` | Yes | 64-char hex string (Shard B) |
| `SERVER_ID` | No | Node identifier for telemetry (default `patent-node-01`) |
| `CORS_ORIGIN` | No | Allowed CORS origin (default `http://localhost:3000`) |
| `HSM_SEED_ROTATION_MS` | No | SoftwareHSM rotation interval ms (default 3600000) |

## Running Tests

```bash
cd backend
npm test              # all tests
npm run test:stress   # stress test (1000 iterations)
```

## Security Notes for Production

1. Replace `SERVER_SECRET` with a value from a secrets manager.
2. Replace `SoftwareHSM` with a TPM/HSM/KMS implementation that plugs into the `HardwareProvider` interface.
3. Enable MongoDB authentication and TLS.
4. Disable core dumps on the host OS.
5. Enable OS-level swap encryption.
6. Deploy behind TLS (terminate at the load balancer or nginx).
