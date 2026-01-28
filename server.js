const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { nanoid } = require('nanoid');
const fs = require('fs');

const app = new Hono();
const PASTES = new Map();

app.get('/', (c) => c.html(fs.readFileSync('./index.html', 'utf8')));

app.get('/:key', (c) => {
  if (PASTES.has(c.req.param('key'))) {
    return c.html(fs.readFileSync('./index.html', 'utf8'));
  }
  return c.redirect('/');
});

app.post('/api/save', async (c) => {
  const text = await c.req.text();
  if (!text.trim()) return c.text('Empty', 400);
  const key = nanoid(10);
  PASTES.set(key, text);
  return c.text(key);
});

app.get('/api/get/:key', (c) => {
  const content = PASTES.get(c.req.param('key'));
  return content ? c.text(content) : c.notFound();
});

serve({ fetch: app.fetch, port: process.env.PORT || 3000 }, () => {
  console.log('Server running');
});
