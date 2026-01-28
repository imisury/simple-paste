import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = new Hono();
const DATA_FILE = path.join(process.cwd(), "pastes.json");

// Load index.html
let htmlContent;
try {
  htmlContent = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
  console.log('index.html loaded successfully');
} catch (err) {
  console.error('Failed to load index.html:', err);
  htmlContent = '<h1>Error: Could not load page</h1>';
}

// Load pastes
let pastes = {};
try {
  const data = await fs.readFile(DATA_FILE, 'utf8');
  pastes = JSON.parse(data);
} catch {}

// Save helper
const savePastes = async () => {
  await fs.writeFile(DATA_FILE, JSON.stringify(pastes, null, 2));
};

// Routes
app.get("/", (c) => c.html(htmlContent));
app.get("/style.css", async (c) => {
  const css = await fs.readFile(path.join(__dirname, "style.css"), "utf8");
  return c.text(css, 200, { "Content-Type": "text/css" });
});

app.get("/:key", (c) => {
  const key = c.req.param('key');
  if (pastes[key]) return c.html(htmlContent);
  return c.redirect("/");
});

app.post("/api", async (c) => {
  const { title = "", content = "", visibility = "public" } = await c.req.json();
  if (!content.trim()) return c.json({ error: "Empty paste" }, 400);

  const key = nanoid(8);
  const createdAt = Date.now();
  pastes[key] = { title, content, visibility, createdAt };
  await savePastes();

  return c.json({ success: true, key });
});

app.get("/api/:key", (c) => {
  const key = c.req.param('key');
  const paste = pastes[key];
  if (!paste) return c.json({ error: "Paste not found" }, 404);
  return c.json(paste);
});

app.get("/api/recent", (c) => {
  const recent = Object.entries(pastes)
    .filter(([, p]) => p.visibility === "public")
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, 10)
    .map(([key, p]) => ({ key, title: p.title, createdAt: p.createdAt }));
  return c.json(recent);
});

// Serve using native Node HTTP
const PORT = process.env.PORT || 8080;
createServer(app.fetch).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
