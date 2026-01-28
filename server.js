import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { nanoid } from 'nanoid'

const app = new Hono()

const PASTES = new Map() // in-memory storage (temporary)

app.use('/static/*', serveStatic({ root: './' })) // optional if you add /static later

// Serve the main HTML page on root and short URLs
app.get('/', (c) => c.html(Bun ? Bun.file('./index.html').text() : await fetch('./index.html').then(r => r.text()))) // fallback for Node

// For short paste URLs like /abc123 → show index.html (frontend will load the paste)
app.get('/:key', async (c) => {
  const key = c.req.param('key')
  if (PASTES.has(key)) {
    // Serve index.html so JS can fetch the paste content
    return c.html(await (Bun ? Bun.file('./index.html').text() : fetch('./index.html').then(r => r.text())))
  }
  return c.redirect('/')
})

// API: Create paste
app.post('/paste', async (c) => {
  try {
    const text = await c.req.text()
    if (!text.trim()) return c.text('Empty paste', 400)

    const key = nanoid(10)
    PASTES.set(key, text)

    const url = `${c.req.header('host') ? 'https://' + c.req.header('host') : ''}/${key}`
    return c.text(key)  // frontend expects just the key, appends origin itself
  } catch (err) {
    console.error(err)
    return c.text('Server error', 500)
  }
})

// API: Get paste content
app.get('/paste/:key', (c) => {
  const key = c.req.param('key')
  const content = PASTES.get(key)
  if (!content) return c.notFound()
  return c.text(content)
})

const port = process.env.PORT || 3000
serve({
  fetch: app.fetch,
  port,
})
console.log(`NEONSHARD listening on port ${port}`)
