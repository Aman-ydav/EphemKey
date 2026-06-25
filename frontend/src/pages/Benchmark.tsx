import React, { useState } from 'react';
import { api } from '../api';

export default function Benchmark() {
  const [iterations, setIterations] = useState('1000');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.benchmark(parseInt(iterations, 10));
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16, letterSpacing: 2 }}>BENCHMARK</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
        Measures encryption time, decryption time, key derivation time, memory usage,
        and throughput for N iterations of the full encrypt/decrypt/zeroize cycle.
      </p>

      <label style={{ fontSize: 11, color: '#00ff8860', letterSpacing: 2, display: 'block', marginBottom: 8 }}>
        ITERATIONS (10 – 10,000)
      </label>
      <input
        type="number"
        value={iterations}
        min={10}
        max={10000}
        onChange={(e) => setIterations(e.target.value)}
        style={{ background: '#111', border: '1px solid #00ff8830', color: '#00ff88', padding: 10, fontFamily: 'inherit', fontSize: 13, borderRadius: 4, outline: 'none', width: 160 }}
      />
      <button onClick={run} disabled={loading} style={{ marginLeft: 12, padding: '10px 24px', background: '#00ff8818', border: '1px solid #00ff88', color: '#00ff88', fontFamily: 'inherit', cursor: 'pointer', fontSize: 13 }}>
        {loading ? 'Running…' : '▶ RUN BENCHMARK'}
      </button>

      {result && (
        <div style={{ marginTop: 24 }}>
          <MetricGroup title="Key Derivation (ms)" data={result.keyDerivationMs} />
          <MetricGroup title="Encryption (ms)" data={result.encryptionMs} />
          <MetricGroup title="Decryption (ms)" data={result.decryptionMs} />

          <Row label="Iterations" value={String(result.iterations)} />
          <Row label="Total Wall Time" value={`${result.totalMs} ms`} />
          <Row label="Throughput" value={`${result.throughputOpsPerSec} ops/sec`} />
          <Row label="Heap Used" value={`${result.memoryUsageMB?.heapUsed} MB`} />
          <Row label="RSS" value={`${result.memoryUsageMB?.rss} MB`} />
        </div>
      )}
    </div>
  );
}

function MetricGroup({ title, data }: { title: string; data: any }) {
  return (
    <div style={{ marginBottom: 20, border: '1px solid #00ff8820', borderRadius: 4, padding: 14 }}>
      <div style={{ fontSize: 11, color: '#00ff8860', letterSpacing: 2, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {['min', 'avg', 'p95', 'max'].map((k) => (
          <div key={k}>
            <div style={{ fontSize: 10, color: '#666' }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 15, color: '#00ff88' }}>{data?.[k]?.toFixed(3)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: '#666', width: 160 }}>{label}</span>
      <span style={{ color: '#00ff88' }}>{value}</span>
    </div>
  );
}
