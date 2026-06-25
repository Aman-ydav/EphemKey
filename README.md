# Patent Prototype — Dynamic Runtime Key Reconstruction System

A working prototype demonstrating the patented invention: an encryption key that is assembled from four independent shards at request time, used once for AES-256-GCM encryption or decryption, and then securely erased from memory. The key never exists at rest.

## Quick Start

```bash
# 1. Start MongoDB
docker-compose -f docker-compose.dev.yml up -d

# 2. Backend
cd backend
npm install
cp .env.example .env   # edit SERVER_SECRET
npm run dev

# 3. Frontend (separate terminal)
cd frontend
npm install
npm start
```

Open http://localhost:3000

## What It Demonstrates

| Property | Implementation |
|---|---|
| Runtime-only key | Key derived per-request, erased on `res.finish` |
| Four-shard independence | Hardware / Server Secret / Session Nonce / Telemetry |
| HKDF-SHA256 derivation | `crypto.hkdfSync` — no manual concatenation |
| AES-256-GCM | Node built-in `crypto` — no CryptoJS |
| Automatic zeroization | `Buffer.fill(0)` via `Zeroizer` |
| No key in MongoDB | SecureRecord stores only ciphertext + IV + authTag |
| Pluggable HSM | `HardwareProvider` interface — `SoftwareHSM` today |

## Project Structure

```
patent-system/
├── backend/src/
│   ├── crypto/          AES-256-GCM + HKDF + zeroize
│   ├── hsm/             HardwareProvider interface + SoftwareHSM
│   ├── telemetry/       TelemetryEngine (Shard D)
│   ├── shard-engine/    ShardEngine — assembles shards, derives key
│   ├── zeroization/     Zeroizer registry
│   ├── middleware/       encryptionMiddleware
│   ├── api/             secure / health / benchmark / audit routes
│   ├── db/              MongoDB models + repositories
│   └── audit/           AuditLogger
├── frontend/src/
│   └── pages/           Dashboard / Encrypt / Decrypt / Benchmark / Audit / Architecture
├── tests/               Jest test suite (8 files)
├── docs/                Architecture, Security, Threat, API, Benchmark, Deployment, Testing
└── docker/              Dockerfiles + nginx config
```

## Tests

```bash
cd backend && npm test
```

## Documentation

- [Architecture.md](docs/Architecture.md)
- [SecurityModel.md](docs/SecurityModel.md)
- [ThreatModel.md](docs/ThreatModel.md)
- [API.md](docs/API.md)
- [Benchmark.md](docs/Benchmark.md)
- [Deployment.md](docs/Deployment.md)
- [Testing.md](docs/Testing.md)
