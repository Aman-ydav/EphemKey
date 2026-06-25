# Benchmark

## Methodology

The benchmark runner (`src/benchmarks/BenchmarkRunner.ts`) executes N iterations of the complete cryptographic cycle:

1. Generate four random shard buffers (simulating ShardEngine output)
2. `deriveKey(shardA, shardB, shardC, shardD)` — HKDF-SHA256
3. `encrypt(payload, key)` — AES-256-GCM
4. `decrypt(ciphertext, iv, authTag, key)` — AES-256-GCM
5. `zeroizeMany(shards, key)` — memory cleanup

Each step is independently timed using `process.hrtime.bigint()` for nanosecond precision.

## Reported Metrics

| Metric | Unit | Description |
|---|---|---|
| `keyDerivationMs` | ms | Time for HKDF-SHA256 to derive a 256-bit key from 4 shards |
| `encryptionMs` | ms | AES-256-GCM encryption of a 64-byte payload |
| `decryptionMs` | ms | AES-256-GCM decryption and auth tag verification |
| `totalMs` | ms | Total wall time for all N iterations |
| `throughputOpsPerSec` | ops/sec | Full cycles per second |
| `memoryUsageMB.heapUsed` | MB | V8 heap memory used after benchmark |

## Running Benchmarks

```bash
# Via API
GET /benchmark?iterations=1000

# Via CLI
cd backend && npm run benchmark

# Via UI
Navigate to the Benchmark page and click RUN BENCHMARK
```

## Interpreting Results

- **Key derivation** is the dominant cost per cycle. HKDF involves two HMAC-SHA256 operations.
- **Encryption and decryption** are hardware-accelerated (AES-NI) on modern CPUs and take < 0.1 ms per call for typical payloads.
- **Throughput** of > 1,000 ops/sec demonstrates the system is viable for high-frequency access patterns.
- **Memory** stays constant across iterations because key buffers are zeroed and garbage-collected.
