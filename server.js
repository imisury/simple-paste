const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('App starting...');
console.log('Current directory:', __dirname);
console.log('Files in current directory:', fs.readdirSync('.'));

let htmlContent = '<h1>Error: index.html not found</h1><p>Check Railway logs for file list.</p>';
try {
  const htmlPath = path.join(__dirname, 'index.html');
  htmlContent = fs.readFileSync(htmlPath, 'utf8');
  console.log('Successfully loaded index.html (size:', htmlContent.length, 'bytes)');
} catch (err) {
  console.error('Failed to load index.html:', err.message);
}

const server = http.createServer((req, res) => {
  console.log('Incoming request:', req.method, req.url);

  if (req.url === '/' || req.url.startsWith('/')) {  // serve HTML for root and paste keys
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`App listening on http://0.0.0.0:${PORT} (using env PORT)`);
});
