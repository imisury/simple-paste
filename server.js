import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import fsSync from 'fs'; // only for existsSync
import path from 'path';

const app = new Hono();
const DATA_FILE = path.join(process.cwd(), 'pastes.json');

// ✅ Single declaration for pastes
let pastes = {};

// Load pastes from file at startup
if (fsSync.existsSync(DATA_FILE)) {
  try {
    const fileData = await fs.readFile(DATA_FILE, 'utf8');
    pastes = JSON.parse(fileData);
    console.log('Loaded pastes from file');
  } catch (err) {
    console.error('Failed to load pastes.json, starting empty', err);
    pastes = {};
  }
}

// Save pastes helper
const savePastes = async () => {
  await fs.writeFile(DATA_FILE, JSON.stringify(pastes, null, 2));
};

// Load index.html once at startup
let htmlContent;
try {
  htmlContent = await fs.readFile('./index.html', 'utf8');
  console.log('index.html loaded successfully');
} catch (err) {
  console.error('Failed to load index.html:', err);
  htmlContent = '<h1>Error: Could not load page</h1>';
}

// Serve frontend
app.get('/', (c) => c.html(htmlContent));

// Serve CSS
app.get('/style.css', async (c) => {
  const css = await fs.readFile('./style.css', 'utf8');
  return c.text(css, 200, { 'Content-Type': 'text/css' });
});

// Serve dynamic paste pages
app.get('/:key', (c) => {
  const key = c.req.param('key');
  if (pastes[key]) return c.html(htmlContent);
  return c.redirect('/');
});

// Create new paste
app.post('/api', async (c) => {
  const body = await c.req.json();
  const { title = '', content = '', visibility = 'public' } = body;

  const key = nanoid(8);
  const createdAt = Date.now();

  pastes[key] = { title, content, visibility, createdAt };
  await savePastes();

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
    .filter(([_, p]) => p.visibility === 'public')
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, 10)
    .map(([key, p]) => ({ key, title: p.title, createdAt: p.createdAt }));

  return c.json(recent);
});

serve(app, { port: 3000 });
console.log('Server running on http://localhost:3000');
