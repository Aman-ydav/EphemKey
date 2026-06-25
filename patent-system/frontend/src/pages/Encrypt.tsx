import React, { useState } from 'react';
import { api } from '../api';

export default function Encrypt() {
  const [data, setData] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!data.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.save(data, { source: 'demo-ui' });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={h1}>ENCRYPT DATA</h1>
      <p style={desc}>
        Enter plaintext below. The middleware will generate a runtime key from four shards,
        encrypt with AES-256-GCM, store ciphertext in MongoDB, then erase the key.
      </p>

      <Label>Plaintext Input</Label>
      <textarea
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder="Enter data to encrypt…"
        style={textarea}
        rows={5}
      />

      <button onClick={submit} disabled={loading || !data.trim()} style={btn}>
        {loading ? 'Encrypting…' : '▶ ENCRYPT & STORE'}
      </button>

      {result && (
        <div style={resultBox}>
          <div style={label}>SUCCESS — Record Saved</div>
          <Field name="Record ID" value={result.recordId} />
          <Field name="Request ID" value={result.requestId} />
          <Field name="Duration" value={`${result.durationMs} ms`} />
          <div style={{ marginTop: 12, fontSize: 11, color: '#00ff8840' }}>
            Runtime key was generated, used, and destroyed. Only ciphertext is in MongoDB.
          </div>
        </div>
      )}

      {error && <div style={errBox}>{error}</div>}
    </div>
  );
}

function Field({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: '#666', width: 100 }}>{name}</span>
      <span style={{ color: '#00ff88', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: '#00ff8860', letterSpacing: 2, marginBottom: 8 }}>{children}</div>;
}

const h1: React.CSSProperties = { fontSize: 20, marginBottom: 16, letterSpacing: 2 };
const desc: React.CSSProperties = { color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.7 };
const textarea: React.CSSProperties = { width: '100%', background: '#111', border: '1px solid #00ff8830', color: '#00ff88', padding: 12, fontFamily: 'inherit', fontSize: 13, borderRadius: 4, outline: 'none', resize: 'vertical' };
const btn: React.CSSProperties = { marginTop: 12, padding: '10px 24px', background: '#00ff8818', border: '1px solid #00ff88', color: '#00ff88', fontFamily: 'inherit', cursor: 'pointer', fontSize: 13, letterSpacing: 1 };
const resultBox: React.CSSProperties = { marginTop: 20, padding: 16, border: '1px solid #00ff8840', borderRadius: 4, background: '#00ff8808' };
const errBox: React.CSSProperties = { marginTop: 20, padding: 16, border: '1px solid #ff4444', borderRadius: 4, color: '#ff4444', fontSize: 13 };
const label: React.CSSProperties = { fontSize: 11, color: '#00ff8860', letterSpacing: 2, marginBottom: 12 };
