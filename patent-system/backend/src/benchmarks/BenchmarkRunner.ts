import { randomBytes } from 'crypto';
import { encrypt } from '../crypto/encrypt';
import { decrypt } from '../crypto/decrypt';
import { deriveKey } from '../crypto/hkdf';
import { zeroizeMany } from '../crypto/zeroize';

export interface BenchmarkResult {
  iterations: number;
  encryptionMs: { min: number; max: number; avg: number; p95: number };
  decryptionMs: { min: number; max: number; avg: number; p95: number };
  keyDerivationMs: { min: number; max: number; avg: number; p95: number };
  totalMs: number;
  throughputOpsPerSec: number;
  memoryUsageMB: { rss: number; heapUsed: number; heapTotal: number };
}

function stats(samples: number[]): { min: number; max: number; avg: number; p95: number } {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: parseFloat((samples.reduce((s, v) => s + v, 0) / samples.length).toFixed(3)),
    p95: sorted[Math.floor(sorted.length * 0.95)]
  };
}

export async function runBenchmark(iterations = 1000): Promise<BenchmarkResult> {
  const encSamples: number[] = [];
  const decSamples: number[] = [];
  const keyDerivSamples: number[] = [];
  const payload = Buffer.from('Patent prototype benchmark payload — 64 bytes of sample data!!');

  const wallStart = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    // Key derivation timing
    const kdStart = process.hrtime.bigint();
    const shardA = randomBytes(48);
    const shardB = randomBytes(32);
    const shardC = randomBytes(32);
    const shardD = randomBytes(32);
    const key = deriveKey(shardA, shardB, shardC, shardD);
    keyDerivSamples.push(Number(process.hrtime.bigint() - kdStart) / 1e6);

    // Encryption timing
    const encStart = process.hrtime.bigint();
    const { ciphertext, iv, authTag } = encrypt(payload, key);
    encSamples.push(Number(process.hrtime.bigint() - encStart) / 1e6);

    // Decryption timing
    const decStart = process.hrtime.bigint();
    const plain = decrypt(ciphertext, iv, authTag, key);
    decSamples.push(Number(process.hrtime.bigint() - decStart) / 1e6);

    // Zeroize after each iteration
    zeroizeMany(shardA, shardB, shardC, shardD, key);
    plain.fill(0);
  }

  const totalMs = Number(process.hrtime.bigint() - wallStart) / 1e6;
  const mem = process.memoryUsage();

  return {
    iterations,
    encryptionMs: stats(encSamples),
    decryptionMs: stats(decSamples),
    keyDerivationMs: stats(keyDerivSamples),
    totalMs: parseFloat(totalMs.toFixed(2)),
    throughputOpsPerSec: parseFloat((iterations / (totalMs / 1000)).toFixed(1)),
    memoryUsageMB: {
      rss: parseFloat((mem.rss / 1024 / 1024).toFixed(2)),
      heapUsed: parseFloat((mem.heapUsed / 1024 / 1024).toFixed(2)),
      heapTotal: parseFloat((mem.heapTotal / 1024 / 1024).toFixed(2))
    }
  };
}
