# Security Model

## Core Security Property

The encryption key is a transient runtime artifact. It does not exist before a request is received, it exists only within the scope of a single cryptographic operation, and it is erased immediately after that operation completes.

## Key Material Lifecycle

```
Before request   → key does not exist
Request arrives  → ShardEngine.reconstruct() derives key
Key used         → AES-256-GCM encrypt or decrypt
Operation done   → Buffer.fill(0) on all key buffers
After response   → key does not exist
```

## Shard Independence

No single component possesses enough information to reconstruct the key without the other three shards.

| Shard | Source | Compromise Impact |
|---|---|---|
| A — Hardware Seed | SoftwareHSM (per-request derived) | One factor missing |
| B — Server Secret | Environment variable (process memory) | One factor missing |
| C — Session Nonce | `crypto.randomBytes(32)` per request | One factor missing |
| D — Telemetry Fingerprint | SHA-256 of session+time+server+nonce | One factor missing |

An attacker who compromises the database obtains only ciphertext, IV, and auth tag — all useless without the runtime key. An attacker who compromises the server secret (Shard B) still lacks shards A, C, and D.

## Cryptographic Choices

| Primitive | Justification |
|---|---|
| AES-256-GCM | Authenticated encryption; provides confidentiality and integrity |
| HKDF-SHA256 | Standard key derivation; PRF security; avoids naive concatenation |
| 12-byte random IV | GCM standard recommendation; fresh per encryption |
| 16-byte auth tag | Full GCM auth tag; detects any ciphertext tampering |

## What Is NOT Stored

The following are guaranteed absent from MongoDB:

- Encryption key or derived key
- Master seed or hardware seed
- Server secret or any shard value
- Session nonce
- Plaintext

## Zeroization

All sensitive buffers are passed through `Buffer.fill(0)` immediately after use. The `Zeroizer` class provides a registry pattern to ensure cleanup occurs even when exceptions are thrown.

## Audit Logging

The audit logger explicitly filters these field names from all log output: `key`, `masterKey`, `derivedKey`, `seed`, `secret`, `password`, `shard`, `plaintext`, `ciphertext`, `iv`, `authTag`, `nonce`.

## Limitations (Prototype Scope)

- Session nonce (Shard C) is ephemeral per request; the current demo UI requires the same browser session to decrypt a record encrypted in that session. Production deployments would use a separate session-key exchange protocol.
- SoftwareHSM does not provide hardware-backed isolation; production deployment would use a TPM, HSM, or cloud KMS for Shard A.
- The server secret (Shard B) is loaded from an environment variable; production would use a secrets manager with audit trail.
