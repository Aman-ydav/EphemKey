import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/encrypt', label: 'Encrypt' },
  { to: '/decrypt', label: 'Decrypt' },
  { to: '/benchmark', label: 'Benchmark' },
  { to: '/audit', label: 'Audit Logs' },
  { to: '/architecture', label: 'Architecture' }
];

const styles: Record<string, React.CSSProperties> = {
  root: { display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#00ff88' },
  sidebar: { width: 220, background: '#111', borderRight: '1px solid #00ff8830', padding: '24px 0', flexShrink: 0 },
  brand: { padding: '0 20px 24px', fontSize: 13, borderBottom: '1px solid #00ff8820', lineHeight: 1.6 },
  navItem: { display: 'block', padding: '10px 20px', color: '#00ff8890', textDecoration: 'none', fontSize: 13, transition: 'all .15s' },
  navActive: { color: '#00ff88', background: '#00ff8810', borderLeft: '2px solid #00ff88' },
  main: { flex: 1, padding: 32, overflowY: 'auto' }
};

export default function Layout() {
  return (
    <div style={styles.root}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={{ fontSize: 11, color: '#00ff8850', marginBottom: 4 }}>PATENT PROTOTYPE</div>
          <div>Runtime Key<br />Reconstruction</div>
        </div>
        <nav style={{ marginTop: 16 }}>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navActive : {}) })}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
