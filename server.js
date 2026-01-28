import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { nanoid } from 'nanoid';
import fs from 'fs/promises'; // Node's promise-based fs


const app = new Hono();
const pastes = new Map();


// Load index.html once at startup (async top-level is ok in ESM with Node 14+)
let htmlContent;
try {
  htmlContent = await fs.readFile('./index.html', 'utf8');
  console.log('index.html loaded successfully');
} catch (err) {
  console.error('Failed to load index.html:', err);
  htmlContent = '<h1>Error: Could not load page</h1>';
}

// Serve the frontend HTML
app.get('/', (c) => c.html(htmlContent));

// Serve CSS FIRST (important!)
app.get('/style.css', async (c) => {
  const css = await fs.readFile('./style.css', 'utf8');
  return c.text(css, 200, {
    'Content-Type': 'text/css',
  });
});

// THEN catch dynamic paste keys
app.get('/:key', (c) => {
  const key = c.req.param('key');
  if (pastes.has(key)) {
    return c.html(htmlContent);
  }
  return c.redirect('/');
});

// Serve CSS file
app.get('/style.css', async (c) => {
  const css = await fs.readFile('./style.css', 'utf8');
  return c.text(css, 200, {
    'Content-Type': 'text/css',
  });
});

// Load pastes from file, or start empty
let pastes = {};
if (fs.existsSync(DATA_FILE)) {
  try {
    pastes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load pastes.json, starting empty', e);
    pastes = {};
  }
}

// Create a new paste
app.post('/api', async (c) => {
  const body = await c.req.json();
  const { title = '', content = '', visibility = 'public' } = body;

  const key = nanoid(8);
  const createdAt = Date.now();

  pastes[key] = { title, content, visibility, createdAt };
  savePastes();

  return c.json({ success: true, key });
});

// Get a paste by key
app.get('/api/:key', (c) => {
  const key = c.req.param('key');
  const paste = pastes[key];

  if (!paste) return c.json({ error: 'Paste not found' }, 404);

  return c.json(paste);
});

// Get recent public pastes
app.get('/api/recent', (c) => {
  const recent = Object.entries(pastes)
    .filter(([_, paste]) => paste.visibility === 'public')
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, 10)
    .map(([key, paste]) => ({ key, title: paste.title, createdAt: paste.createdAt }));

  return c.json(recent);
});

app.fire();
