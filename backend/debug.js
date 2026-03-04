const db = require('./database');

db.serialize(() => {
    db.get("SELECT id, status, name FROM candidates ORDER BY created_at DESC LIMIT 1;", (err, row) => {
        if (err) {
            console.error("Error fetching candidate:", err);
            return;
        }
        console.log("Last Candidate:", row);
        if (row) {
            db.all("SELECT * FROM answers WHERE candidate_id = ?", [row.id], (err, answers) => {
                console.log(`Answers count for ${row.id}:`, answers ? answers.length : 0);
            });
            db.all("SELECT * FROM personality_scores WHERE candidate_id = ?", [row.id], (err, p) => {
                if (err) console.error("Error fetching personality_scores:", err);
                else console.log("Personality Scores:", p);
            });
        }
    });
});
