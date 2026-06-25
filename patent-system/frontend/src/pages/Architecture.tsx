import React from 'react';

export default function Architecture() {
  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 24, letterSpacing: 2 }}>ARCHITECTURE OVERVIEW</h1>

      <div style={{ marginBottom: 32 }}>
        <SectionTitle>Runtime Key Reconstruction Flow</SectionTitle>
        <svg viewBox="0 0 700 560" style={{ width: '100%', maxWidth: 700, display: 'block' }} xmlns="http://www.w3.org/2000/svg">
          <rect width="700" height="560" fill="#0a0a0a" />
          {/* Boxes */}
          {[
            [250, 10, 200, 44, 'CLIENT REQUEST'],
            [250, 90, 200, 44, 'EXPRESS MIDDLEWARE'],
            [50, 180, 140, 44, 'Hardware Shard A'],
            [180, 180, 140, 44, 'Server Secret B'],
            [320, 180, 140, 44, 'Session Nonce C'],
            [460, 180, 140, 44, 'Telemetry D'],
            [250, 270, 200, 44, 'HKDF-SHA256'],
            [250, 350, 200, 44, 'AES-256-GCM ENGINE'],
            [250, 430, 200, 44, 'MONGODB STORAGE'],
            [250, 510, 200, 44, 'KEY ZEROIZATION ✓'],
          ].map(([x, y, w, h, label], i) => (
            <g key={i}>
              <rect x={x as number} y={y as number} width={w as number} height={h as number}
                rx="3" fill="#00ff8810" stroke="#00ff8840" strokeWidth="1" />
              <text x={(x as number) + (w as number) / 2} y={(y as number) + (h as number) / 2 + 5}
                textAnchor="middle" fill="#00ff88" fontSize="11" fontFamily="Courier New">
                {label as string}
              </text>
            </g>
          ))}
          {/* Arrows - main flow */}
          <Arrow x1={350} y1={54} x2={350} y2={90} />
          {/* Shard arrows down to HKDF */}
          <Arrow x1={120} y1={224} x2={280} y2={270} />
          <Arrow x1={250} y1={224} x2={310} y2={270} />
          <Arrow x1={390} y1={224} x2={370} y2={270} />
          <Arrow x1={530} y1={224} x2={420} y2={270} />
          {/* Middleware to shards */}
          <Arrow x1={290} y1={134} x2={120} y2={180} />
          <Arrow x1={320} y1={134} x2={250} y2={180} />
          <Arrow x1={380} y1={134} x2={390} y2={180} />
          <Arrow x1={410} y1={134} x2={530} y2={180} />
          {/* HKDF to AES */}
          <Arrow x1={350} y1={314} x2={350} y2={350} />
          {/* AES to MongoDB */}
          <Arrow x1={350} y1={394} x2={350} y2={430} />
          {/* MongoDB to Zeroize */}
          <Arrow x1={350} y1={474} x2={350} y2={510} />
          {/* Labels */}
          <text x="350" y="168" textAnchor="middle" fill="#00ff8840" fontSize="9" fontFamily="Courier New">4 INDEPENDENT SHARDS</text>
          <text x="350" y="340" textAnchor="middle" fill="#00ff8840" fontSize="9" fontFamily="Courier New">256-BIT RUNTIME KEY</text>
        </svg>
      </div>

      <div style={{ marginBottom: 32 }}>
        <SectionTitle>Key Properties</SectionTitle>
        <ul style={{ color: '#aaa', fontSize: 13, lineHeight: 2.2, paddingLeft: 20 }}>
          <li><Highlight>Runtime-only existence</Highlight> — key is derived per-request, never stored</li>
          <li><Highlight>Four-shard independence</Highlight> — no single component holds the complete key</li>
          <li><Highlight>HKDF-SHA256 derivation</Highlight> — cryptographically sound key expansion</li>
          <li><Highlight>AES-256-GCM</Highlight> — authenticated encryption with integrity protection</li>
          <li><Highlight>Automatic zeroization</Highlight> — all key material overwritten after use</li>
          <li><Highlight>Telemetry binding</Highlight> — key is bound to the specific request context</li>
          <li><Highlight>Pluggable HSM layer</Highlight> — SoftwareHSM now; TPM/KMS in production</li>
        </ul>
      </div>

      <div>
        <SectionTitle>What MongoDB Stores</SectionTitle>
        <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#aaa', background: '#111', padding: 16, borderRadius: 4 }}>
          <div style={{ color: '#00ff8860', marginBottom: 8 }}>{'// SecureRecord document'}</div>
          <div>{'{'}</div>
          <div style={{ paddingLeft: 20 }}><span style={{ color: '#00ff88' }}>_id</span>: ObjectId,</div>
          <div style={{ paddingLeft: 20 }}><span style={{ color: '#00ff88' }}>ciphertext</span>: Binary,  <span style={{ color: '#444' }}>// encrypted payload</span></div>
          <div style={{ paddingLeft: 20 }}><span style={{ color: '#00ff88' }}>iv</span>: Binary,         <span style={{ color: '#444' }}>// 12-byte random IV</span></div>
          <div style={{ paddingLeft: 20 }}><span style={{ color: '#00ff88' }}>authTag</span>: Binary,    <span style={{ color: '#444' }}>// 16-byte GCM auth tag</span></div>
          <div style={{ paddingLeft: 20 }}><span style={{ color: '#00ff88' }}>metadata</span>: Object,</div>
          <div style={{ paddingLeft: 20 }}><span style={{ color: '#00ff88' }}>createdAt</span>: Date</div>
          <div>{'}'}</div>
          <div style={{ marginTop: 12, color: '#ff4444' }}>
            // key, seed, secret, shard, derivedKey — NEVER present
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: '#00ff8860', letterSpacing: 2, marginBottom: 16 }}>{children}</div>;
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#00ff88' }}>{children}</span>;
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="#00ff8830" strokeWidth="1.5"
      markerEnd="url(#arrowhead)" />
  );
}
