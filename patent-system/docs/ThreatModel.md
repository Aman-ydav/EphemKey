# Threat Model

## Assets

1. Plaintext data submitted by clients
2. Encryption key (runtime only)
3. Server secret (Shard B)
4. MongoDB records

## Threat Scenarios

### 1. Database Exfiltration

**Threat**: Attacker gains full read access to MongoDB.

**Impact**: Attacker obtains ciphertext, IV, auth tag, metadata, and record IDs.

**Mitigation**: Without the runtime key (which is never stored), ciphertext is computationally indistinguishable from random bytes. AES-256-GCM provides IND-CCA2 security.

**Residual Risk**: None for confidentiality. Auth tag integrity is separately enforced on every decrypt.

---

### 2. Replay Attack

**Threat**: Attacker captures a valid `POST /secure/save` request and replays it.

**Impact**: Replay creates a second encrypted record. The attacker cannot read it.

**Mitigation**: Each request derives a fresh Shard C (session nonce) and Shard D (telemetry with fresh timestamp window). The resulting key is different for every request.

**Residual Risk**: Duplicate records may be created; application-level deduplication is out of scope for this prototype.

---

### 3. Ciphertext Tampering

**Threat**: Attacker modifies stored ciphertext, IV, or auth tag.

**Impact**: `decrypt()` throws `ERR_OSSL_EVP_BAD_DECRYPT` due to GCM auth tag mismatch.

**Mitigation**: AES-256-GCM authentication tag covers all ciphertext bytes. Any bit flip is detected with probability 1 − 2⁻¹²⁸.

**Residual Risk**: None.

---

### 4. Key Logging / Memory Forensics

**Threat**: Attacker reads process memory or log files searching for key material.

**Impact**: Key material could be found if it persists in memory or logs.

**Mitigation**: `Buffer.fill(0)` is called on all key buffers immediately after use. The logger sanitizer strips key-adjacent field names from all output. Node.js garbage collection cannot be relied upon for sensitive data erasure, so explicit overwrite is mandatory.

**Residual Risk**: OS swap or core dumps could capture memory between derivation and zeroization. Production hardening would include swap encryption and core dump suppression.

---

### 5. Server Secret Compromise

**Threat**: Attacker reads the `SERVER_SECRET` environment variable.

**Impact**: Shard B is compromised.

**Mitigation**: The attacker still lacks Shards A (hardware seed), C (per-request nonce), and D (telemetry). All four shards are required to derive the key via HKDF.

**Residual Risk**: Reduced — three remaining shards still protect encrypted records.

---

### 6. Session Nonce Prediction

**Threat**: Attacker predicts future values of Shard C.

**Impact**: If predictable, the key could be pre-computed.

**Mitigation**: Shard C is generated with `crypto.randomBytes(32)` which uses the OS CSPRNG (getrandom/CryptGenRandom). Prediction is computationally infeasible.

**Residual Risk**: None under standard CSPRNG assumptions.

---

### 7. Wrong Session Decryption

**Threat**: Request from a different session (or later request) attempts to decrypt a record.

**Impact**: Session nonce changes per request; the reconstructed key differs.

**Mitigation**: HKDF-SHA256 is a PRF; a single-bit change in any shard produces an entirely different output key. Decryption with the wrong key fails the GCM auth tag check.

**Residual Risk**: None.

## Out of Scope

- Distributed denial-of-service
- Physical hardware attacks
- Social engineering
- Side-channel attacks on AES implementation (mitigated by hardware AES-NI in production)
