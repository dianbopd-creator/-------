async function test() {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3001/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Aa880213!?' }) // Or whatever the pw is.
    });

    if (!loginRes.ok) {
        console.log('Login failed', await loginRes.text());
        return;
    }
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log('Fetching candidates...');
    const candRes = await fetch('http://localhost:3001/api/v1/admin/candidates', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const candidates = await candRes.json();
    console.log('First candidate:', candidates.data[0]);

    if (!candidates.data[0]) return;
    const cid = candidates.data[0].id;

    console.log('Updating candidate', cid);
    const updateRes = await fetch(`http://localhost:3001/api/v1/admin/candidates/${cid}/status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: '初篩合格', job_category_id: 4 })
    });

    console.log('Update res:', updateRes.status, await updateRes.text());

    console.log('Fetching again...');
    const candRes2 = await fetch('http://localhost:3001/api/v1/admin/candidates', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const candidates2 = await candRes2.json();
    const updated = candidates2.data.find(c => c.id === cid);
    console.log('Candidate after update:', updated);
}

test();
