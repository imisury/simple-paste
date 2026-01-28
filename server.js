const http = require('http');
const fs = require('fs');

console.log('1. App code starting execution...');
console.log('2. Environment PORT:', process.env.PORT || '(not set - will use 3000)');

let html = '<h1>TEST: index.html not loaded</h1><p>If you see this, server works but file missing.</p>';
try {
  html = fs.readFileSync('./index.html', 'utf8');
  console.log('3. Successfully read index.html (length:', html.length, 'bytes)');
} catch (e) {
  console.log('3. ERROR reading index.html:', e.message);
}

const server = http.createServer((req, res) => {
  console.log('4. Request received:', req.method, req.url);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`5. Server successfully listening on port ${port}`);
});
