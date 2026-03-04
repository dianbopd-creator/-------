const db = require('../connection');

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
        db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
    });
}
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
}

// Get all evaluators' scores for a candidate
exports.getAllScores = (candidateId) => {
    return all(`SELECT * FROM interview_scores_v2 WHERE candidate_id = ? ORDER BY updated_at DESC`, [candidateId]);
};

// Get ScoreRow for specific evaluator
exports.getMyScore = (candidateId, evaluatorId) => {
    return get(`SELECT * FROM interview_scores_v2 WHERE candidate_id = ? AND evaluator_id = ?`, [candidateId, evaluatorId]);
};

// Upsert: one row per (candidate_id, evaluator_id)
exports.upsertScores = (candidateId, evaluatorId, evaluatorName, data) => {
    const { scores_json, checkboxes_json, strengths, weaknesses, notes, total_score } = data;
    return run(`
        INSERT INTO interview_scores_v2 (candidate_id, evaluator_id, evaluator_name, scores_json, checkboxes_json, strengths, weaknesses, notes, total_score, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(candidate_id, evaluator_id) DO UPDATE SET
            evaluator_name = excluded.evaluator_name,
            scores_json = excluded.scores_json,
            checkboxes_json = excluded.checkboxes_json,
            strengths = excluded.strengths,
            weaknesses = excluded.weaknesses,
            notes = excluded.notes,
            total_score = excluded.total_score,
            updated_at = CURRENT_TIMESTAMP
    `, [candidateId, evaluatorId, evaluatorName, scores_json, checkboxes_json, strengths, weaknesses, notes, total_score]);
};
