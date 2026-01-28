import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { nanoid } from 'nanoid'

const app = new Hono()

const PASTES = new Map() // ← in-memory only (Railway will restart → data gone)

app.get('/', serveStatic({ path: './index.html' }))

app.post('/paste', async (c) => {
  const text = await c.req.text()
  if (!text.trim()) return c.text('empty', 400)

  const key = nanoid(10)   // or 8 or 12 chars
  PASTES.set(key, text)

  return c.text(key)
})

app.get('/paste/:key', (c) => {
  const key = c.req.param('key')
  const content = PASTES.get(key)

  if (!content) return c.notFound()

  return c.text(content, 200, {
    'Content-Type': 'text/plain; charset=utf-8'
  })
})

// Catch-all → serve the paste page for short urls
app.get('/:key', (c) => {
  const key = c.req.param('key')
  if (PASTES.has(key)) {
    return c.html(Bun.file('./index.html').stream())
  }
  return c.redirect('/')
})

serve(app, {
  port: process.env.PORT || 3000
})
console.log('neonshard running...')
