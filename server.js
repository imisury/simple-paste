import { Hono } from "hono";
import { createServer } from "http";
import { nanoid } from "nanoid";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const app = new Hono();
const DATA_FILE = path.join(process.cwd(), "pastes.json");

// Load pastes from file
let pastes = {};
if (fsSync.existsSync(DATA_FILE)) {
  try {
    pastes = JSON.parse(fsSync.readFileSync(DATA_FILE, "utf8"));
  } catch {
    pastes = {};
  }
}

// Save helper
const savePastes = async () => {
  await fs.writeFile(DATA_FILE, JSON.stringify(pastes, null, 2));
};

// Load HTML once
let htmlContent;
try {
  htmlContent = await fs.readFile("./index.html", "utf8");
} catch {
  htmlContent = "<h1>Error: Could not load page</h1>";
}

// Routes
app.get("/", (c) => c.html(htmlContent));
app.get("/style.css", async (c) => {
  const css = await fs.readFile("./style.css", "utf8");
  return c.text(css, 200, { "Content-Type": "text/css" });
});

// Serve UI for specific paste
app.get("/:key", (c) => {
  const { key } = c.req.param();
  if (pastes[key]) return c.html(htmlContent);
  return c.redirect("/");
});

// Create paste (JSON expected)
app.post("/api", async (c) => {
  const { title = "", content = "", visibility = "public" } =
    await c.req.json();

  if (!content.trim()) return c.json({ error: "Empty paste" }, 400);

  const key = nanoid(8);
  const createdAt = Date.now();

  pastes[key] = { title, content, visibility, createdAt };
  await savePastes();

  return c.json({ success: true, key });
});

// Get paste details
app.get("/api/:key", (c) => {
  const { key } = c.req.param();
  const paste = pastes[key];
  if (!paste) return c.json({ error: "Paste not found" }, 404);
  return c.json(paste);
});

// Recent public pastes
app.get("/api/recent", (c) => {
  const recent = Object.entries(pastes)
    .filter(([, p]) => p.visibility === "public")
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, 10)
    .map(([key, p]) => ({ key, title: p.title, createdAt: p.createdAt }));

  return c.json(recent);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
