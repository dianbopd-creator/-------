const db = require('../connection');

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
});
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); });
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
});

// ── Questions CRUD ──────────────────────────────────────────────────────────
const getAllQuestions = () => dbAll(`SELECT * FROM questions ORDER BY created_at DESC`);

const getQuestionById = (id) => dbGet(`SELECT * FROM questions WHERE id = ?`, [id]);

const createQuestion = ({ question_text, question_type = 'text', category = '通用', is_required = 1 }) =>
    dbRun(`INSERT INTO questions (question_text, question_type, category, is_required) VALUES (?, ?, ?, ?)`,
        [question_text, question_type, category, is_required ? 1 : 0]);

const updateQuestion = (id, { question_text, question_type, category, is_required }) =>
    dbRun(`UPDATE questions SET question_text = ?, question_type = ?, category = ?, is_required = ? WHERE id = ?`,
        [question_text, question_type, category, is_required ? 1 : 0, id]);

const deleteQuestion = (id) => dbRun(`DELETE FROM questions WHERE id = ?`, [id]);

// ── Job-Question Assignments ────────────────────────────────────────────────
const getQuestionsForJob = (jobCategoryId) => dbAll(`
    SELECT q.*, jq.order_index
    FROM job_questions jq
    JOIN questions q ON q.id = jq.question_id
    WHERE jq.job_category_id = ?
    ORDER BY jq.order_index ASC, q.id ASC
`, [jobCategoryId]);

const setQuestionsForJob = async (jobCategoryId, questionIds) => {
    // Replace all assignments for this job
    await dbRun(`DELETE FROM job_questions WHERE job_category_id = ?`, [jobCategoryId]);
    for (let i = 0; i < questionIds.length; i++) {
        await dbRun(`INSERT OR IGNORE INTO job_questions (job_category_id, question_id, order_index) VALUES (?, ?, ?)`,
            [jobCategoryId, questionIds[i], i]);
    }
};

module.exports = {
    getAllQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsForJob,
    setQuestionsForJob,
};
