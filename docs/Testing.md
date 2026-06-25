# Testing

## Test Suite

All tests are in `tests/` and run with Jest + ts-jest.

```bash
cd backend
npm test
```

## Test Files

| File | What It Tests |
|---|---|
| `encryption.test.ts` | AES-256-GCM output properties, unique IV per call, length |
| `hkdf.test.ts` | Key is 32 bytes, deterministic, shard-sensitive, differs from naive hash |
| `tamperedCiphertext.test.ts` | Modified ciphertext/IV/authTag/key all throw on decrypt |
| `wrongSession.test.ts` | Different session nonce or telemetry fingerprint produces an incompatible key |
| `replayAttack.test.ts` | Replayed ciphertext fails with a fresh session key |
| `memoryCleanup.test.ts` | `zeroize()` overwrites buffers; `Zeroizer` handles all registered buffers; idempotent |
| `concurrent.test.ts` | 50 simultaneous encrypt/decrypt pairs all succeed; 100 concurrent keys all unique |
| `stressTest.test.ts` | 1,000 sequential cycles succeed; complete in under 10 seconds |

## Test Coverage Map

| Requirement | Test |
|---|---|
| AES-256-GCM encryption | `encryption.test.ts` |
| AES-256-GCM decryption round-trip | `encryption.test.ts` |
| HKDF-SHA256 key derivation | `hkdf.test.ts` |
| Tampered ciphertext detection | `tamperedCiphertext.test.ts` |
| Wrong session rejection | `wrongSession.test.ts` |
| Replay attack prevention | `replayAttack.test.ts` |
| Memory zeroization | `memoryCleanup.test.ts` |
| Concurrent isolation | `concurrent.test.ts` |
| 1,000-request stress | `stressTest.test.ts` |

## Running Individual Tests

```bash
npx jest tests/encryption.test.ts
npx jest tests/memoryCleanup.test.ts
npx jest --testPathPattern=stress --testTimeout=60000
```
