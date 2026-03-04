const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/candidates/0a595ad4-0b94-4f48-9ed6-128912a4fa27/submit',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`BODY: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
