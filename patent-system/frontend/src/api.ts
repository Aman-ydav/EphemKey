import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const SESSION_ID = crypto.randomUUID();

const client = axios.create({
  baseURL: BASE,
  headers: { 'x-session-id': SESSION_ID }
});

export const api = {
  save: (data: string, metadata?: Record<string, unknown>) =>
    client.post('/secure/save', { data, metadata }).then((r) => r.data),

  read: (id: string) =>
    client.get(`/secure/read/${id}`).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/secure/delete/${id}`).then((r) => r.data),

  health: () =>
    client.get('/health').then((r) => r.data),

  benchmark: (iterations = 1000) =>
    client.get(`/benchmark?iterations=${iterations}`).then((r) => r.data),

  audit: (limit = 50) =>
    client.get(`/audit?limit=${limit}`).then((r) => r.data)
};
