# API Reference

Base URL: `http://localhost:3001`

All `/secure` routes execute the encryption middleware before the route handler.

## Headers

| Header | Required | Description |
|---|---|---|
| `x-session-id` | No | Session identifier. Generated server-side if absent. |
| `Content-Type` | Yes (POST) | `application/json` |

---

## POST /secure/save

Encrypts the provided data and stores ciphertext in MongoDB.

**Request body**
```json
{
  "data": "string — plaintext to encrypt",
  "metadata": { "optional": "key-value pairs" }
}
```

**Response 201**
```json
{
  "recordId": "507f1f77bcf86cd799439011",
  "requestId": "a1b2c3d4-...",
  "durationMs": 2
}
```

**Response 400** — missing or invalid `data` field.

**Response 500** — internal encryption failure.

---

## GET /secure/read/:id

Reconstructs the runtime key and decrypts the record identified by `:id`.

**Path parameter**: `:id` — MongoDB ObjectId returned by `/secure/save`.

**Response 200**
```json
{
  "data": "original plaintext",
  "metadata": {},
  "requestId": "...",
  "durationMs": 1
}
```

**Response 400** — decryption failed (wrong session, tampered record).

**Response 404** — record not found.

---

## DELETE /secure/delete/:id

Deletes the encrypted record permanently.

**Response 200**
```json
{ "deleted": true, "requestId": "...", "durationMs": 0 }
```

**Response 404** — record not found.

---

## GET /health

Returns system health without executing the encryption middleware.

**Response 200**
```json
{
  "status": "healthy",
  "time": "2025-01-01T00:00:00.000Z",
  "hsm": "operational",
  "recordCount": 42
}
```

---

## GET /benchmark?iterations=N

Runs N encrypt+decrypt+zeroize cycles and returns timing statistics.

**Query parameter**: `iterations` — integer 10–10,000 (default 1,000).

**Response 200**
```json
{
  "iterations": 1000,
  "keyDerivationMs": { "min": 0.01, "avg": 0.03, "p95": 0.05, "max": 0.12 },
  "encryptionMs":   { "min": 0.01, "avg": 0.02, "p95": 0.04, "max": 0.09 },
  "decryptionMs":   { "min": 0.01, "avg": 0.02, "p95": 0.04, "max": 0.08 },
  "totalMs": 180.5,
  "throughputOpsPerSec": 5540.2,
  "memoryUsageMB": { "rss": 65.2, "heapUsed": 28.1, "heapTotal": 48.0 }
}
```

---

## GET /audit?limit=N

Returns the most recent audit log entries.

**Query parameter**: `limit` — integer 1–500 (default 100).

**Response 200**
```json
{
  "count": 50,
  "entries": [
    {
      "entryId": "uuid",
      "timestamp": "2025-01-01T00:00:00.000Z",
      "operation": "ENCRYPT_SAVE",
      "recordId": "507f1f77bcf86cd799439011",
      "requestId": "a1b2c3d4-...",
      "durationMs": 2,
      "status": "SUCCESS"
    }
  ]
}
```

Operations: `ENCRYPT_SAVE` | `DECRYPT_READ` | `DELETE` | `BENCHMARK` | `HEALTH`
