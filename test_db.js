const db = require('./backend/database.js');

db.all('SELECT id, name, status, job_category_id FROM candidates', [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.table(rows);
    }
});
