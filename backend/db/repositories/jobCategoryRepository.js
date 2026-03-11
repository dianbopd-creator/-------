const db = require('../connection');

/**
 * jobCategoryRepository.js
 * 所有與 job_categories 相關的 SQL 操作
 */

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

exports.findAll = async () => {
    const rows = await all(`SELECT * FROM job_categories ORDER BY created_at DESC`);
    return rows.map(r => {
        try { r.stages = JSON.parse(r.stages); } catch { r.stages = []; }
        try { r.details = r.details ? JSON.parse(r.details) : {}; } catch { r.details = {}; }
        return r;
    });
};

exports.create = (department, position, stagesArr, detailsObj) => {
    return run(
        `INSERT INTO job_categories (department, position, stages, details) VALUES (?, ?, ?, ?)`,
        [department, position, JSON.stringify(stagesArr), JSON.stringify(detailsObj || {})]
    );
};

exports.update = (id, department, position, stagesArr, detailsObj) => {
    return run(
        `UPDATE job_categories SET department = ?, position = ?, stages = ?, details = ? WHERE id = ?`,
        [department, position, JSON.stringify(stagesArr), JSON.stringify(detailsObj || {}), id]
    );
};

exports.nullifyCandidates = (jobCategoryId) => {
    return run(`UPDATE candidates SET job_category_id = NULL WHERE job_category_id = ?`, [jobCategoryId]);
};

exports.deleteById = async (id) => {

    // Explicitly delete child job_questions rows first to avoid FK constraint
    // failures on Supabase instances where CASCADE may not be set on the
    // existing table (schema init runs CREATE TABLE IF NOT EXISTS, so old tables
    // keep their original constraint definition).
    await run(`DELETE FROM job_questions WHERE job_category_id = ?`, [id]);
    return run(`DELETE FROM job_categories WHERE id = ?`, [id]);
};


exports.getCandidateCount = (jobCategoryId) => {
    return get(`SELECT COUNT(*) as count FROM candidates WHERE job_category_id = ?`, [jobCategoryId]);
};
