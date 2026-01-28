const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');

const app = new Hono();
const PASTES = new Map();

console.log('Current directory files:', fs.readdirSync('.'));  // ← this logs your files!

let htmlContent;
try {
  const htmlPath = path.join(__dirname, 'index.html');
  htmlContent = fs.readFileSync(htmlPath, 'utf8');
  console.log('index.html loaded successfully from:', htmlPath);
} catch (err) {
  console.error('Failed to load index.html:', err.message);
  htmlContent = '<h1>Error: index.html missing on server</h1>';
}

app.get('/', (c) => c.html(htmlContent));

app.get('/:key', (c) => {
  const key = c.req.param('key');
  if (PASTES.has(key)) {
    return c.html(htmlContent);
  }
  return c.redirect('/');
});

app.post('/api/save', async (c) => {
  const text = await c.req.text();
  if (!text.trim()) return c.text('Empty', 400);
  const key = nanoid(10);
  PASTES.set(key, text);
  console.log('Paste created:', key);
  return c.text(key);
});

app.get('/api/get/:key', (c) => {
  const content = PASTES.get(c.req.param('key'));
  return content ? c.text(content) : c.notFound();
});

app.get('/debug', (c) => c.text('Server is alive! Files in dir: ' + fs.readdirSync('.').join(', ')));

const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port,
}, () => {
  console.log(`Server listening on port ${port}`);
});
