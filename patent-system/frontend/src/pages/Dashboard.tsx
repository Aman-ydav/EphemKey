import React, { useEffect, useState } from 'react';
import { api } from '../api';

const s: React.CSSProperties = { marginBottom: 8 };

export default function Dashboard() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 24, letterSpacing: 2 }}>SYSTEM DASHBOARD</h1>

      <Section title="Patent Invention">
        <p style={{ color: '#aaa', lineHeight: 1.8, fontSize: 13 }}>
          Dynamic Runtime Key Reconstruction — the encryption key is assembled from
          four independent shards (Hardware Seed, Server Secret, Session Nonce,
          Telemetry Fingerprint) via HKDF-SHA256 <em>within each request</em>, used
          once, then securely erased. The key never exists at rest.
        </p>
      </Section>

      <Section title="System Status">
        {health ? (
          <div style={{ fontSize: 13 }}>
            <Row label="Status" value={health.status?.toUpperCase()} ok={health.status === 'healthy'} />
            <Row label="HSM" value={health.hsm?.toUpperCase()} ok={health.hsm === 'operational'} />
            <Row label="Records in DB" value={String(health.recordCount ?? '—')} />
            <Row label="Server Time" value={health.time ?? '—'} />
          </div>
        ) : (
          <p style={{ color: '#666', fontSize: 13 }}>Loading…</p>
        )}
      </Section>

      <Section title="Architecture Summary">
        <ol style={{ color: '#aaa', fontSize: 13, lineHeight: 2, paddingLeft: 20 }}>
          <li>Client sends encrypted-data request</li>
          <li>Express Middleware intercepts — collects runtime factors</li>
          <li>Shard Engine assembles 4 independent shards</li>
          <li>HKDF-SHA256 derives the 256-bit runtime key</li>
          <li>AES-256-GCM encrypts the payload</li>
          <li>Runtime key zeroed from memory</li>
          <li>Only ciphertext + IV + authTag stored in MongoDB</li>
        </ol>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: '#00ff8860', letterSpacing: 2, marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ border: '1px solid #00ff8820', borderRadius: 4, padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 6 }}>
      <span style={{ color: '#666', width: 120 }}>{label}</span>
      <span style={{ color: ok === undefined ? '#00ff88' : ok ? '#00ff88' : '#ff4444' }}>{value}</span>
    </div>
  );
}
