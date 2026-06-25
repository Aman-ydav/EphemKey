import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Encrypt from './pages/Encrypt';
import Decrypt from './pages/Decrypt';
import Benchmark from './pages/Benchmark';
import AuditLogs from './pages/AuditLogs';
import Architecture from './pages/Architecture';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="encrypt" element={<Encrypt />} />
          <Route path="decrypt" element={<Decrypt />} />
          <Route path="benchmark" element={<Benchmark />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="architecture" element={<Architecture />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
