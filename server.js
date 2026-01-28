const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('Starting server... Current dir:', __dirname);
console.log('Files in dir:', fs.readdirSync('.'));

let html;
try {
  const htmlPath = path.join(__dirname, 'index.html');
  html = fs.readFileSync(htmlPath, 'utf8');
  console.log('Loaded index.html successfully (length:', html.length, 'chars)');
} catch (err) {
  console.error('ERROR loading index.html:', err.message);
  html = '<h1>Error: index.html not found on server</h1><p>Check Railway logs for details.</p>';
}

const server = http.createServer((req, res) => {
  console.log('Request received:', req.method, req.url);

  if (req.url === '/' || req.url.startsWith('/api/') === false) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} (using env PORT if set)`);
});
