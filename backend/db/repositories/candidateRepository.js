const db = require('../connection');

/**
 * candidateRepository.js
 * 所有與 candidates / work_experiences / answers / personality_scores 相關的 SQL 操作
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Candidates ────────────────────────────────────────────────────────────────

exports.createCandidate = (id, fields) => {
    const {
        name, job_category_id, phone, birth_date, education_school, education_major,
        current_salary_monthly, current_salary_annual, expected_salary_monthly, expected_salary_annual,
        driving_license, certifications, skills, leave_reason, motivation,
        career_plan_short, career_plan_mid, career_plan_long, dream
    } = fields;

    return run(
        `INSERT INTO candidates (
            id, name, job_category_id, department, position, phone, birth_date,
            education_school, education_major,
            current_salary_monthly, current_salary_annual,
            expected_salary_monthly, expected_salary_annual,
            driving_license, certifications, skills, leave_reason, motivation,
            career_plan_short, career_plan_mid, career_plan_long, dream
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id, name, job_category_id, '', '', phone, birth_date,
            education_school, education_major,
            current_salary_monthly, current_salary_annual,
            expected_salary_monthly, expected_salary_annual,
            driving_license, certifications, skills, leave_reason, motivation,
            career_plan_short, career_plan_mid, career_plan_long, dream
        ]
    );
};

exports.addWorkExperiences = async (candidateId, experiences) => {
    await run(`DELETE FROM work_experiences WHERE candidate_id = ?`, [candidateId]);
    const promises = experiences.map(exp =>
        run(`INSERT INTO work_experiences (candidate_id, job_title, years, achievements) VALUES (?, ?, ?, ?)`,
            [candidateId, exp.job_title, exp.years, exp.achievements])
    );
    await Promise.all(promises);
};

exports.saveAnswers = async (candidateId, answers) => {
    await run(`DELETE FROM answers WHERE candidate_id = ?`, [candidateId]);
    const promises = answers.map(ans =>
        run(`INSERT INTO answers (candidate_id, question_code, answer_text) VALUES (?, ?, ?)`,
            [candidateId, ans.question_code, ans.answer_text])
    );
    await Promise.all(promises);
};

exports.savePersonalityScore = (candidateId, scores) => {
    return run(
        `INSERT INTO personality_scores (
            candidate_id, red_score, blue_score, yellow_score, green_score, cri_score, cri_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            candidateId,
            scores.red || 0, scores.blue || 0, scores.yellow || 0,
            scores.green || 0, scores.cri || 0, scores.cri_details || null
        ]
    );
};

exports.setStatus = (candidateId, status, jobCategoryId) => {
    if (jobCategoryId !== undefined) {
        return run(
            `UPDATE candidates SET status = ?, job_category_id = ? WHERE id = ?`,
            [status, jobCategoryId, candidateId]
        );
    }
    return run(`UPDATE candidates SET status = ? WHERE id = ?`, [status, candidateId]);
};

exports.saveAiReport = (candidateId, reportText) => {
    return run(
        `UPDATE candidates SET ai_analysis_report = ? WHERE id = ?`,
        [reportText, candidateId]
    );
};

exports.findById = (candidateId) => {
    return get(`
        SELECT c.*, j.department as jc_department, j.position as jc_position, j.stages, j.details as jc_details
        FROM candidates c
        LEFT JOIN job_categories j ON c.job_category_id = j.id
        WHERE c.id = ?
    `, [candidateId]);
};

exports.findAll = () => {
    return all(`
        SELECT c.*, j.department as jc_department, j.position as jc_position, j.stages
        FROM candidates c
        LEFT JOIN job_categories j ON c.job_category_id = j.id
        WHERE c.status != 'pending' AND c.status IS NOT NULL
        ORDER BY c.created_at DESC
    `);
};

// ── Related data ──────────────────────────────────────────────────────────────

exports.getAnswersByCandidate = (candidateId) => {
    return all(`
        SELECT a.*,
               CASE WHEN a.question_code ~ '^[0-9]+$'
                    THEN q.question_text
                    ELSE NULL
               END AS question_text
        FROM answers a
        LEFT JOIN questions q ON a.question_code ~ '^[0-9]+$' AND q.id = CAST(a.question_code AS INTEGER)
        WHERE a.candidate_id = ?
        ORDER BY a.id ASC
    `, [candidateId]);
};

exports.getPersonalityByCandidate = (candidateId) => {
    return get(`SELECT * FROM personality_scores WHERE candidate_id = ?`, [candidateId]);
};

exports.getWorkExperiencesByCandidate = (candidateId) => {
    return all(`SELECT * FROM work_experiences WHERE candidate_id = ? ORDER BY id ASC`, [candidateId]);
};

exports.saveResumeText = (candidateId, resumeText) => {
    return run(`UPDATE candidates SET resume_text = ? WHERE id = ?`, [resumeText, candidateId]);
};

exports.deleteResumeText = (candidateId) => {
    return run(`UPDATE candidates SET resume_text = NULL WHERE id = ?`, [candidateId]);
};

exports.deleteCandidate = async (candidateId) => {
    // Delete in dependency order
    await run(`DELETE FROM ai_reports WHERE candidate_id = ?`, [candidateId]);
    await run(`DELETE FROM interview_scores_v2 WHERE candidate_id = ?`, [candidateId]);
    await run(`DELETE FROM evaluations WHERE candidate_id = ?`, [candidateId]);
    await run(`DELETE FROM personality_scores WHERE candidate_id = ?`, [candidateId]);
    await run(`DELETE FROM answers WHERE candidate_id = ?`, [candidateId]);
    await run(`DELETE FROM work_experiences WHERE candidate_id = ?`, [candidateId]);
    return run(`DELETE FROM candidates WHERE id = ?`, [candidateId]);
};
