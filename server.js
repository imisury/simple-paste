import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { nanoid } from 'nanoid';

const app = new Hono();
const pastes = new Map(); // key → text

// Serve frontend
app.get('/', (c) => c.html(Bun ? await Bun.file('./index.html').text() : await fetch('./index.html').then(r => r.text())));

// Serve frontend for paste URLs too (frontend will fetch content)
app.get('/:key', async (c) => {
  const key = c.req.param('key');
  if (pastes.has(key)) {
    return c.html(Bun ? await Bun.file('./index.html').text() : await fetch('./index.html').then(r => r.text()));
  }
  return c.redirect('/');
});

// API: create paste
app.post('/api', async (c) => {
  const text = await c.req.text();
  if (!text.trim()) return c.text('Empty', 400);

  const key = nanoid(8);
  pastes.set(key, text);
  return c.text(key);
});

// API: get paste
app.get('/api/:key', (c) => {
  const text = pastes.get(c.req.param('key'));
  return text ? c.text(text) : c.notFound();
});

serve({
  fetch: app.fetch,
  port: process.env.PORT || 3000
});

console.log('Server started');
