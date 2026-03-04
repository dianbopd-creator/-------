const http = require('http');

const payload = JSON.stringify({
    answers: [{ questionId: 'q1', color: 'red', optionText: 'Test' }],
    timings: [{ questionId: 'q1', seconds: 5 }],
    positionSequence: [0]
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/candidates/0a595ad4-0b94-4f48-9ed6-128912a4fa27/personality',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
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

req.write(payload);
req.end();
