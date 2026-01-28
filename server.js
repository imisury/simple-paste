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

// Create paste
app.post('/api', async (c) => {
  const text = await c.req.text();
  if (!text.trim()) return c.text('Empty paste', 400);

  const key = nanoid(8);
  pastes.set(key, text);
  return c.text(key);
});

// Get paste content
app.get('/api/:key', (c) => {
  const text = pastes.get(c.req.param('key'));
  return text ? c.text(text) : c.notFound();
});

serve({
  fetch: app.fetch,
  port: process.env.PORT || 3000
});

console.log('Server running on Node.js');

// Example for Express + SQLite/Postgres
app.post("/paste", async (req, res) => {
  const { title, content, visibility } = req.body;
  // Save title + content + visibility in DB
  await db.query("INSERT INTO pastes (title, content, visibility) VALUES ($1, $2, $3)", [title, content, visibility]);
  res.json({ success: true, id: newPasteId });
});

app.get("/paste/:id", async (req, res) => {
  const paste = await db.query("SELECT * FROM pastes WHERE id = $1", [req.params.id]);
  res.json(paste.rows[0]); // include title in response
});


// Example query for recent pastes
const recentPublicPastes = await db.query("SELECT * FROM pastes WHERE visibility='public' ORDER BY created_at DESC LIMIT 10");

app.get("/recent", async (req, res) => {
  const recent = await db.query("SELECT id, title, created_at FROM pastes WHERE visibility='public' ORDER BY created_at DESC LIMIT 10");
  res.json(recent.rows);
});


