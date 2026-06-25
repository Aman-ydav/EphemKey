import React, { useState } from 'react';
import { api } from '../api';

export default function Decrypt() {
  const [recordId, setRecordId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!recordId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.read(recordId.trim());
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={h1}>DECRYPT DATA</h1>
      <p style={desc}>
        Enter the Record ID returned during encryption. The middleware reconstructs
        the runtime key from the current session's shards, decrypts the ciphertext,
        and returns plaintext — then erases the key.
      </p>
      <p style={{ ...desc, color: '#ff444490', fontSize: 12 }}>
        Note: Because Shard C (Session Nonce) is unique per request, only records
        encrypted in the same session can be decrypted here. This demonstrates
        the runtime binding property of the invention.
      </p>

      <Label>Record ID</Label>
      <input
        value={recordId}
        onChange={(e) => setRecordId(e.target.value)}
        placeholder="Paste record ID from encrypt step…"
        style={input}
      />

      <button onClick={submit} disabled={loading || !recordId.trim()} style={btn}>
        {loading ? 'Decrypting…' : '▶ RETRIEVE & DECRYPT'}
      </button>

      {result && (
        <div style={resultBox}>
          <div style={label}>DECRYPTION SUCCESS</div>
          <Field name="Plaintext" value={result.data} />
          <Field name="Request ID" value={result.requestId} />
          <Field name="Duration" value={`${result.durationMs} ms`} />
        </div>
      )}

      {error && <div style={errBox}>{error}</div>}
    </div>
  );
}

function Field({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#00ff8850', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 13, color: '#00ff88', wordBreak: 'break-all', background: '#00ff8808', padding: 8, borderRadius: 2 }}>{value}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: '#00ff8860', letterSpacing: 2, marginBottom: 8 }}>{children}</div>;
}

const h1: React.CSSProperties = { fontSize: 20, marginBottom: 16, letterSpacing: 2 };
const desc: React.CSSProperties = { color: '#666', fontSize: 13, marginBottom: 16, lineHeight: 1.7 };
const input: React.CSSProperties = { width: '100%', background: '#111', border: '1px solid #00ff8830', color: '#00ff88', padding: 10, fontFamily: 'inherit', fontSize: 13, borderRadius: 4, outline: 'none' };
const btn: React.CSSProperties = { marginTop: 12, padding: '10px 24px', background: '#00ff8818', border: '1px solid #00ff88', color: '#00ff88', fontFamily: 'inherit', cursor: 'pointer', fontSize: 13, letterSpacing: 1 };
const resultBox: React.CSSProperties = { marginTop: 20, padding: 16, border: '1px solid #00ff8840', borderRadius: 4, background: '#00ff8808' };
const errBox: React.CSSProperties = { marginTop: 20, padding: 16, border: '1px solid #ff4444', borderRadius: 4, color: '#ff4444', fontSize: 13 };
const label: React.CSSProperties = { fontSize: 11, color: '#00ff8860', letterSpacing: 2, marginBottom: 12 };
