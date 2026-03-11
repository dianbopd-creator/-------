require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Helper to convert SQLite syntax to PostgreSQL
function convertSql(sql) {
    let result = sql;

    // Convert ? to $1, $2, etc.
    let i = 1;
    result = result.replace(/\?/g, () => `$${i++}`);

    // SQLite uses datetime('now'), Postgres uses CURRENT_TIMESTAMP
    result = result.replace(/datetime\('now'\)/ig, 'CURRENT_TIMESTAMP');

    // Handle RETURNING id for lastID simulation
    if (/^\s*INSERT\s/i.test(result) && !/RETURNING/i.test(result)) {
        // Exclude junction tables that lack a single 'id' column
        if (!/candidate_tags|job_questions/.test(result)) {
            result += ' RETURNING id';
        }
    }
    return result;
}

const db = {
    pool,
    run: function (sql, params = [], callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        pool.query(convertSql(sql), params, (err, res) => {
            if (callback) {
                const ctx = {
                    lastID: res && res.rows && res.rows.length ? res.rows[0].id : null,
                    changes: res ? res.rowCount : 0
                };
                callback.call(ctx, err);
            }
        });
    },
    get: function (sql, params = [], callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        pool.query(convertSql(sql), params, (err, res) => {
            if (err) return callback(err);
            callback(null, res.rows && res.rows.length > 0 ? res.rows[0] : undefined);
        });
    },
    all: function (sql, params = [], callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        pool.query(convertSql(sql), params, (err, res) => {
            if (err) return callback(err);
            callback(null, res.rows || []);
        });
    },
    prepare: function (sql) {
        return {
            run: function (params, callback) {
                db.run(sql, params, callback);
            },
            finalize: function (callback) {
                if (callback) callback();
            }
        };
    },
    serialize: function (callback) {
        callback();
    }
};

// Database Schema Initialization for PostgreSQL
async function initDB() {
    try {
        console.log('Connected to Supabase PostgreSQL Database.');

        const schemaSql = `
            CREATE TABLE IF NOT EXISTS candidates (
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
                job_category_id INTEGER,
                ai_analysis_report TEXT,
                resume_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS work_experiences (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                job_title TEXT,
                years TEXT,
                achievements TEXT
            );

            CREATE TABLE IF NOT EXISTS answers (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                question_code TEXT NOT NULL,
                answer_text TEXT
            );

            CREATE TABLE IF NOT EXISTS personality_scores (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                red_score INTEGER DEFAULT 0,
                blue_score INTEGER DEFAULT 0,
                yellow_score INTEGER DEFAULT 0,
                green_score INTEGER DEFAULT 0,
                orange_score INTEGER DEFAULT 0,
                gold_score INTEGER DEFAULT 0,
                cri_score INTEGER DEFAULT 0,
                cri_details TEXT
            );

            CREATE TABLE IF NOT EXISTS ai_reports (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                raw_analysis TEXT,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'interviewer',
                full_name TEXT,
                email TEXT,
                avatar_b64 TEXT,
                department TEXT,
                position TEXT,
                totp_secret TEXT,
                totp_enabled INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                permissions_json TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS evaluations (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                evaluator_id INTEGER NOT NULL REFERENCES admin_users(id),
                comments TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS job_categories (
                id SERIAL PRIMARY KEY,
                department TEXT NOT NULL,
                position TEXT NOT NULL,
                stages TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS interview_scores_v2 (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                evaluator_id INTEGER NOT NULL REFERENCES admin_users(id),
                evaluator_name TEXT,
                scores_json TEXT,
                checkboxes_json TEXT,
                strengths TEXT,
                weaknesses TEXT,
                notes TEXT,
                total_score INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(candidate_id, evaluator_id)
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES admin_users(id),
                action TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS candidate_comments (
                id SERIAL PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                admin_id INTEGER NOT NULL REFERENCES admin_users(id),
                admin_name TEXT,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tags (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT DEFAULT '#3b82f6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS candidate_tags (
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (candidate_id, tag_id)
            );

            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                question_text TEXT NOT NULL,
                question_type TEXT DEFAULT 'text',
                category TEXT DEFAULT '通用',
                is_required INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS job_questions (
                id SERIAL PRIMARY KEY,
                job_category_id INTEGER NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
                question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
                order_index INTEGER DEFAULT 0,
                UNIQUE(job_category_id, question_id)
            );
        `;

        await pool.query(schemaSql);

        // Seed initial admin user if none exists
        const countRes = await pool.query('SELECT COUNT(*) as count FROM admin_users');
        if (parseInt(countRes.rows[0].count) === 0) {
            const bcrypt = require('bcryptjs');
            const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'ChangeMe@2024!';
            const hash = await bcrypt.hash(initialPassword, 10);
            await pool.query(
                'INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, $3)',
                ['admin', hash, 'superadmin']
            );
            console.log('Seeded default superadmin user.');
        }

    } catch (err) {
        console.error('Error initializing PostgreSQL schema:', err.message);
    }
}

initDB();

module.exports = db;
