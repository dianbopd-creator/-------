const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create tables
        db.serialize(() => {
            // Enhanced candidates table - v2 schema
            db.run(`CREATE TABLE IF NOT EXISTS candidates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                department TEXT,
                position TEXT,
                phone TEXT NOT NULL,
                birth_date TEXT,
                education_school TEXT,
                education_major TEXT,
                current_salary_monthly TEXT,
                current_salary_annual TEXT,
                expected_salary_monthly TEXT,
                expected_salary_annual TEXT,
                driving_license TEXT,
                certifications TEXT,
                skills TEXT,
                leave_reason TEXT,
                motivation TEXT,
                career_plan_short TEXT,
                career_plan_mid TEXT,
                career_plan_long TEXT,
                dream TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Try to alter table if exists (for SQLite since we changed columns)
            // SQLite ALTER TABLE is limited, so we might need a fresh DB if it fails.
            // For this local prototype, we will just rely on the existing schema if columns exist, 
            // but we'll try to add the new ones to prevent errors.
            const newCols = [
                'education_school', 'education_major',
                'current_salary_monthly', 'current_salary_annual',
                'expected_salary_monthly', 'expected_salary_annual'
            ];
            newCols.forEach(col => {
                db.run(`ALTER TABLE candidates ADD COLUMN ${col} TEXT`, (err) => {
                    // Ignore error if column already exists
                });
            });

            // Table for work experience since there can be multiple entries
            db.run(`CREATE TABLE IF NOT EXISTS work_experiences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                job_title TEXT,
                years TEXT,
                achievements TEXT,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                question_code TEXT NOT NULL,
                answer_text TEXT,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS personality_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                red_score INTEGER DEFAULT 0,
                blue_score INTEGER DEFAULT 0,
                yellow_score INTEGER DEFAULT 0,
                green_score INTEGER DEFAULT 0,
                orange_score INTEGER DEFAULT 0,
                gold_score INTEGER DEFAULT 0,
                cri_score INTEGER DEFAULT 0,
                cri_details TEXT,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )`);

            // Alter logic for new columns in personality_scores
            const newScoreCols = ['red_score', 'yellow_score', 'cri_score'];
            newScoreCols.forEach(col => {
                db.run(`ALTER TABLE personality_scores ADD COLUMN ${col} INTEGER DEFAULT 0`, (err) => { });
            });
            db.run(`ALTER TABLE personality_scores ADD COLUMN cri_details TEXT`, (err) => { });

            db.run(`CREATE TABLE IF NOT EXISTS ai_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                raw_analysis TEXT,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'interviewer',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Alter logic for new columns in admin_users
            const newAdminCols = ['role', 'created_at', 'full_name', 'email', 'avatar_b64', 'department', 'position'];
            newAdminCols.forEach(col => {
                let defaultVal = "NULL";
                if (col === 'role') defaultVal = "'interviewer'";
                if (col === 'created_at') defaultVal = "CURRENT_TIMESTAMP";
                db.run(`ALTER TABLE admin_users ADD COLUMN ${col} TEXT DEFAULT ${defaultVal}`, (err) => {
                    // Ignore error if column already exists
                });
            });

            db.run(`CREATE TABLE IF NOT EXISTS evaluations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                evaluator_id INTEGER NOT NULL,
                comments TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(evaluator_id) REFERENCES admin_users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS job_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                department TEXT NOT NULL,
                position TEXT NOT NULL,
                stages TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES admin_users(id)
            )`);

            db.run(`ALTER TABLE candidates ADD COLUMN job_category_id INTEGER`, (err) => { });

            db.run(`ALTER TABLE job_categories ADD COLUMN details TEXT`, (err) => { });
            db.run(`ALTER TABLE candidates ADD COLUMN ai_analysis_report TEXT`, (err) => { });

            // Upgrade default admin to superadmin if necessary
            db.run(`UPDATE admin_users SET role = 'superadmin' WHERE username = 'admin' AND role = 'admin'`, (err) => { });
        });

        // Seed initial admin user if none exists
        db.get(`SELECT COUNT(*) as count FROM admin_users`, [], (err, row) => {
            if (!err && row.count === 0) {
                const bcrypt = require('bcrypt');
                const saltRounds = 10;
                bcrypt.hash('Aa880213!?', saltRounds, (err, hash) => {
                    if (!err) {
                        db.run(
                            `INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)`,
                            ['admin', hash, 'superadmin'],
                            (err) => {
                                if (err) console.error('Failed to seed admin user:', err.message);
                                else console.log('Successfully seeded default superadmin user logic.');
                            }
                        );
                    }
                });
            }
        });
    }
});

module.exports = db;
