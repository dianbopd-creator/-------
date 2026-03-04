const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// In production (Fly.io), DB lives on the persistent Volume at /data/database.sqlite
// In development, it falls back to backend/db/database.sqlite
const isProduction = process.env.NODE_ENV === 'production';
const defaultDbPath = isProduction ? '/data/database.sqlite' : path.resolve(__dirname, 'database.sqlite');
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : defaultDbPath;


const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log(`Connected to the SQLite database at: ${dbPath}`);

        db.serialize(() => {
            // Enhanced candidates table
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

            const newCandidateCols = [
                'education_school', 'education_major',
                'current_salary_monthly', 'current_salary_annual',
                'expected_salary_monthly', 'expected_salary_annual',
                'job_category_id', 'ai_analysis_report', 'resume_text'
            ];
            newCandidateCols.forEach(col => {
                let def = 'TEXT';
                if (col === 'job_category_id') def = 'INTEGER';
                db.run(`ALTER TABLE candidates ADD COLUMN ${col} ${def}`, () => { });
            });

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

            const newScoreCols = ['red_score', 'yellow_score', 'cri_score'];
            newScoreCols.forEach(col => {
                db.run(`ALTER TABLE personality_scores ADD COLUMN ${col} INTEGER DEFAULT 0`, () => { });
            });
            db.run(`ALTER TABLE personality_scores ADD COLUMN cri_details TEXT`, () => { });

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

            const newAdminCols = ['role', 'created_at', 'full_name', 'email', 'avatar_b64', 'department', 'position'];
            newAdminCols.forEach(col => {
                let defaultVal = 'NULL';
                if (col === 'role') defaultVal = "'interviewer'";
                if (col === 'created_at') defaultVal = 'CURRENT_TIMESTAMP';
                db.run(`ALTER TABLE admin_users ADD COLUMN ${col} TEXT DEFAULT ${defaultVal}`, () => { });
            });

            // 2FA columns
            db.run(`ALTER TABLE admin_users ADD COLUMN totp_secret TEXT DEFAULT NULL`, () => { });
            db.run(`ALTER TABLE admin_users ADD COLUMN totp_enabled INTEGER DEFAULT 0`, () => { });

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

            db.run(`ALTER TABLE job_categories ADD COLUMN details TEXT`, () => { });


            // Interview evaluation scores table (multi-evaluator support)
            // DROP old single-evaluator table if it has the wrong schema, then recreate
            db.run(`CREATE TABLE IF NOT EXISTS interview_scores_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                evaluator_id INTEGER NOT NULL,
                evaluator_name TEXT,
                scores_json TEXT,
                checkboxes_json TEXT,
                strengths TEXT,
                weaknesses TEXT,
                notes TEXT,
                total_score INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(candidate_id, evaluator_id),
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(evaluator_id) REFERENCES admin_users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES admin_users(id)
            )`);

            // Internal collaboration comments — standalone notes, no score required
            db.run(`CREATE TABLE IF NOT EXISTS candidate_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                admin_id INTEGER NOT NULL,
                admin_name TEXT,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(admin_id) REFERENCES admin_users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                color TEXT DEFAULT '#3b82f6',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS candidate_tags (
                candidate_id TEXT NOT NULL,
                tag_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (candidate_id, tag_id),
                FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
                FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )`);

            // Dynamic Question Bank
            db.run(`CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT NOT NULL,
                question_type TEXT DEFAULT 'text',
                category TEXT DEFAULT '通用',
                is_required INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS job_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_category_id INTEGER NOT NULL,
                question_id INTEGER NOT NULL,
                order_index INTEGER DEFAULT 0,
                UNIQUE(job_category_id, question_id),
                FOREIGN KEY(job_category_id) REFERENCES job_categories(id) ON DELETE CASCADE,
                FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
            )`);

            db.run(`UPDATE admin_users SET role = 'superadmin' WHERE username = 'admin' AND role = 'admin'`, () => { });
        });

        // Seed initial admin user if none exists
        db.get(`SELECT COUNT(*) as count FROM admin_users`, [], (err, row) => {
            if (!err && row.count === 0) {
                const bcrypt = require('bcrypt');
                const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'ChangeMe@2024!';
                bcrypt.hash(initialPassword, 10, (err, hash) => {
                    if (!err) {
                        db.run(
                            `INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)`,
                            ['admin', hash, 'superadmin'],
                            (err) => {
                                if (err) console.error('Failed to seed admin user:', err.message);
                                else console.log('Seeded default superadmin user.');
                            }
                        );
                    }
                });
            }
        });
    }
});

module.exports = db;
