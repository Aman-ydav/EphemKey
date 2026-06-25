import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function AuditLogs() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.audit(100);
      setEntries(res.entries ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, letterSpacing: 2 }}>AUDIT LOGS</h1>
        <button onClick={load} disabled={loading} style={refreshBtn}>
          {loading ? '…' : '↻ Refresh'}
        </button>
      </div>
      <p style={{ color: '#666', fontSize: 12, marginBottom: 20 }}>
        Only timestamps, operation type, request IDs, latency, and status are recorded.
        No keys, plaintext, ciphertext, IV, auth tags, or shard values are ever logged.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Timestamp', 'Operation', 'Record ID', 'Request ID', 'Duration', 'Status'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.entryId}>
                <td style={td}>{e.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                <td style={td}><span style={{ color: opColor(e.operation) }}>{e.operation}</span></td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 10 }}>{e.recordId?.slice(0, 12) ?? '—'}…</td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 10 }}>{e.requestId?.slice(0, 12)}…</td>
                <td style={td}>{e.durationMs} ms</td>
                <td style={td}><span style={{ color: e.status === 'SUCCESS' ? '#00ff88' : '#ff4444' }}>{e.status}</span></td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, color: '#333', textAlign: 'center', padding: 32 }}>No entries yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function opColor(op: string): string {
  if (op === 'ENCRYPT_SAVE') return '#00aaff';
  if (op === 'DECRYPT_READ') return '#00ff88';
  if (op === 'DELETE') return '#ff8800';
  return '#aaa';
}

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #00ff8820', color: '#00ff8860', fontWeight: 'normal', letterSpacing: 1 };
const td: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid #00ff8810', color: '#aaa' };
const refreshBtn: React.CSSProperties = { padding: '4px 12px', background: 'transparent', border: '1px solid #00ff8840', color: '#00ff8880', fontFamily: 'inherit', cursor: 'pointer', fontSize: 12 };
