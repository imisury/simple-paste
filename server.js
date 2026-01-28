import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Hono();
const DATA_FILE = path.join(__dirname, "pastes.json");

// --- Helper to read JSON file safely ---
async function loadPastes() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// --- Helper to save pastes ---
async function savePastes(pastes) {
  await fs.writeFile(DATA_FILE, JSON.stringify(pastes, null, 2));
}

// --- Serve index.html ---
app.get("/", async (c) => {
  try {
    const html = await fs.readFile(path.join(__dirname, "index.html"), "utf8");
    return c.html(html);
  } catch (err) {
    return c.html("<h1>Error loading page</h1>");
  }
});

// --- Serve style.css ---
app.get("/style.css", async (c) => {
  try {
    const css = await fs.readFile(path.join(__dirname, "style.css"), "utf8");
    return c.text(css, 200, { "Content-Type": "text/css" });
  } catch {
    return c.text("/* CSS not found */", 404);
  }
});

// --- API Routes ---
app.get("/api/recent", async (c) => {
  const pastes = await loadPastes();
  const recent = Object.entries(pastes)
    .filter(([, p]) => p.visibility === "public")
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, 10)
    .map(([key, p]) => ({ key, title: p.title, createdAt: p.createdAt }));
  return c.json(recent);
});

app.get("/api/:key", async (c) => {
  const pastes = await loadPastes();
  const { key } = c.req.param();
  const paste = pastes[key];
  if (!paste) return c.json({ error: "Paste not found" }, 404);
  return c.json(paste);
});

app.post("/api", async (c) => {
  const pastes = await loadPastes();
  const { title = "", content = "", visibility = "public" } = await c.req.json();

  if (!content.trim()) return c.json({ error: "Empty paste" }, 400);

  const key = nanoid(8);
  const createdAt = Date.now();
  pastes[key] = { title, content, visibility, createdAt };

  await savePastes(pastes);
  return c.json({ success: true, key });
});

// --- Paste view route ---
app.get("/:key", async (c) => {
  const pastes = await loadPastes();
  const { key } = c.req.param();
  if (!pastes[key]) return c.redirect("/");

  try {
    const html = await fs.readFile(path.join(__dirname, "index.html"), "utf8");
    return c.html(html);
  } catch {
    return c.html("<h1>Error loading paste page</h1>");
  }
});

// --- Start server using native Node HTTP ---
const PORT = process.env.PORT || 8080;
createServer(app.fetch).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
