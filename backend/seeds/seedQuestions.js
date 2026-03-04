/**
 * Seed script: inserts questions from questions.json into the SQLite DB.
 * Run once: node backend/seeds/seedQuestions.js
 * Safe to re-run — skips questions that already exist.
 */
const path = require('path');
const db = require(path.join(__dirname, '../db/connection'));
const questionsData = require(path.join(__dirname, '../../frontend/src/data/questions.json'));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seed() {
    console.log('Seeding question bank...');
    await delay(500); // wait for DB serialization to finish

    let inserted = 0;
    let skipped = 0;

    for (const cat of questionsData) {
        for (const q of cat.questions) {
            await new Promise((resolve, reject) => {
                db.get('SELECT id FROM questions WHERE question_text = ?', [q.text], (err, row) => {
                    if (err) return reject(err);
                    if (row) {
                        skipped++;
                        return resolve();
                    }
                    db.run(
                        `INSERT INTO questions (question_text, question_type, category, is_required) VALUES (?, ?, ?, ?)`,
                        [q.text, 'textarea', cat.category, 1],
                        function (err2) {
                            if (err2) return reject(err2);
                            inserted++;
                            resolve();
                        }
                    );
                });
            });
        }
    }

    console.log(`✅ Done! Inserted: ${inserted}, Skipped (already exists): ${skipped}`);
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
