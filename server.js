const http = require('http');
const fs = require('fs');

console.log('=== APP START ===');
console.log('Current dir files:', fs.readdirSync('.').join(', '));

let html = '<h1>TEST PAGE - index.html NOT FOUND</h1><p>If you see this, server works but file is missing.</p>';
try {
  html = fs.readFileSync('./index.html', 'utf8');
  console.log('index.html LOADED OK (length: ' + html.length + ' bytes)');
} catch (e) {
  console.log('index.html ERROR: ' + e.message);
}

const server = http.createServer((req, res) => {
  console.log('Request: ' + req.method + ' ' + req.url);
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(html);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('=== LISTENING ON PORT ' + PORT + ' ===');
});
