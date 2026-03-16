const fs = require('fs');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/doctors/profile',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => { fs.writeFileSync('test-out.txt', 'STATUS: ' + res.statusCode + '\n' + data); });
});

req.on('error', e => { fs.writeFileSync('test-out.txt', 'REQ_ERROR: ' + e.message); });
req.end();
