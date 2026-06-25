# Architecture

## System Overview

The patent prototype implements a Dynamic Runtime Key Reconstruction System. The encryption key is assembled from four independent shard inputs within each request, used once, and then securely erased. The key never exists before a request arrives and never persists after the response is sent.

## Component Map

```
Client Request
    │
    ▼
Express Middleware  ──────────────────────────────────────────┐
    │                                                         │
    ├─► SoftwareHSM.getSeed()          → Shard A (hardware)  │
    ├─► ServerSecret (env)             → Shard B (static)    │
    ├─► randomBytes(32)               → Shard C (nonce)      │
    └─► TelemetryEngine.collect()      → Shard D (context)   │
                                                              │
    ▼                                                         │
ShardEngine.reconstruct()                                     │
    │                                                         │
    ▼                                                         │
HKDF-SHA256 (shardA ‖ shardB ‖ shardC ‖ shardD)             │
    │                                                         │
    ▼                                                         │
AES-256-GCM Engine                                           │
    ├─ encrypt() → { ciphertext, iv, authTag }               │
    └─ decrypt() → plaintext                                  │
                                                             │
    ▼                                                         │
MongoDB (SecureRecord)                                        │
    └─ stores: ciphertext, iv, authTag, metadata, createdAt  │
                                                             │
    ▼                                                         │
Zeroizer.cleanAll()                                          │
    └─ Buffer.fill(0) on all key material ◄───────────────────┘
```

## Module Descriptions

### `src/crypto/`
Pure cryptographic primitives. No state, no external dependencies beyond Node's built-in `crypto` module.

| File | Responsibility |
|---|---|
| `encrypt.ts` | AES-256-GCM encryption, returns `{ciphertext, iv, authTag}` |
| `decrypt.ts` | AES-256-GCM decryption, throws on invalid auth tag |
| `hkdf.ts` | HKDF-SHA256 key derivation from four shard buffers |
| `iv.ts` | Generates a cryptographically random 12-byte IV per operation |
| `zeroize.ts` | `Buffer.fill(0)` helpers for immediate key erasure |

### `src/hsm/`
Pluggable hardware abstraction layer.

- `HardwareProvider` — TypeScript interface with `getSeed()`, `destroy()`, `healthCheck()`
- `SoftwareHSM` — software emulation; rotates a master seed on an interval; derives per-request seeds via HMAC so the master is never directly exposed

### `src/telemetry/`
Collects runtime context for Shard D. Included: session ID, request nonce, timestamp window (30-second floor), server identifier, request latency. Excluded: IP address, GPS, browser fingerprint.

### `src/shard-engine/`
`ShardEngine.reconstruct()` is the single point where all four shards converge and `deriveKey()` is called. All shard buffers are wiped immediately after HKDF completes. The returned `runtimeKey` is the only output.

### `src/middleware/`
`encryptionMiddleware` wraps every `/secure` request. It attaches `req.cryptoContext` containing single-use `encrypt` and `decrypt` closures that close over the runtime key. A `res.on('finish')` hook calls `Zeroizer.cleanAll()` to erase the key regardless of whether the request succeeded or failed.

### `src/db/`
- `SecureRecord` — Mongoose model with fields `ciphertext`, `iv`, `authTag`, `metadata`, `createdAt`
- `SecureRecordRepository` — `save`, `findById`, `deleteById`

### `src/audit/`
In-memory rolling log (max 10,000 entries). Records: timestamp, operation, recordId, requestId, durationMs, status. Never records key material or plaintext.

### `src/benchmarks/`
`BenchmarkRunner.runBenchmark(n)` executes `n` full key-derivation + encrypt + decrypt + zeroize cycles and returns JSON statistics (min/avg/p95/max per operation, total wall time, throughput, memory usage).

## Data Flow — Save Operation

1. `POST /secure/save` arrives with `{ data: "plaintext" }`
2. Middleware reconstructs runtime key from 4 shards
3. Route handler calls `req.cryptoContext.encrypt(Buffer.from(data))`
4. `encrypt()` generates a fresh IV, runs AES-256-GCM, returns `{ciphertext, iv, authTag}`
5. Plaintext buffer is zeroed immediately
6. `SecureRecordRepository.save()` writes `{ciphertext, iv, authTag, metadata}` to MongoDB
7. Response: `{ recordId, requestId, durationMs }`
8. `res.on('finish')` fires → `Zeroizer.cleanAll()` → runtime key zeroed

## Data Flow — Read Operation

1. `GET /secure/read/:id` arrives (same session, fresh request)
2. Middleware reconstructs a NEW runtime key from current runtime factors
3. Route handler fetches the record from MongoDB
4. `req.cryptoContext.decrypt(ciphertext, iv, authTag)` — will fail if session factors differ
5. Plaintext buffer returned, then zeroed
6. Response: `{ data, metadata, requestId, durationMs }`
