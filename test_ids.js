async function test() {
    const loginRes = await fetch('http://localhost:3001/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Aa880213!?' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const candRes = await fetch('http://localhost:3001/api/v1/admin/candidates', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const candidates = await candRes.json();
    console.log(candidates.data);
}

test();
