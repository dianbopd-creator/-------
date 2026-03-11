const db = require('../connection');

/**
 * adminRepository.js
 * 所有與 admin_users / evaluations 相關的 SQL 操作
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

// ── Admin Users ───────────────────────────────────────────────────────────────

exports.findUserByUsername = (username) => {
    return get(`SELECT * FROM admin_users WHERE username = ?`, [username]);
};

exports.findUserById = (id) => {
    return get(`SELECT * FROM admin_users WHERE id = ?`, [id]);
};

exports.getAllUsers = () => {
    return all(`SELECT id, username, role, full_name, department, position, is_active, permissions_json, created_at FROM admin_users WHERE is_active = 1 ORDER BY created_at DESC`);
};

exports.createUser = (username, passwordHash, role, permissions = []) => {
    return run(
        `INSERT INTO admin_users (username, password_hash, role, permissions_json) VALUES (?, ?, ?, ?)`,
        [username, passwordHash, role, JSON.stringify(permissions)]
    );
};

exports.updateUserPassword = (id, passwordHash, role) => {
    if (role !== undefined) {
        return run(
            `UPDATE admin_users SET password_hash = ?, role = ? WHERE id = ?`,
            [passwordHash, role, id]
        );
    }
    return run(`UPDATE admin_users SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
};

exports.updateUserRole = (id, role) => {
    return run(`UPDATE admin_users SET role = ? WHERE id = ?`, [role, id]);
};

exports.updateUserPermissions = (id, permissions) => {
    return run(`UPDATE admin_users SET permissions_json = ? WHERE id = ?`, [JSON.stringify(permissions), id]);
};

exports.updateUserRoleAndPermissions = (id, role, permissions) => {
    return run(`UPDATE admin_users SET role = ?, permissions_json = ? WHERE id = ?`, [role, JSON.stringify(permissions), id]);
};

exports.updateProfile = (id, { full_name, email, avatar_b64, department, position }) => {
    return run(
        `UPDATE admin_users SET full_name = ?, email = ?, avatar_b64 = ?, department = ?, position = ? WHERE id = ?`,
        [full_name || null, email || null, avatar_b64 || null, department || null, position || null, id]
    );
};

exports.deleteUser = (id) => {
    return run(`UPDATE admin_users SET is_active = 0 WHERE id = ?`, [id]);
};

// ── 2FA (TOTP) ────────────────────────────────────────────────────────────────

exports.setTotpSecret = (id, secret) => {
    return run(`UPDATE admin_users SET totp_secret = ? WHERE id = ?`, [secret, id]);
};

exports.setTotpEnabled = (id, enabled) => {
    return run(`UPDATE admin_users SET totp_enabled = ? WHERE id = ?`, [enabled ? 1 : 0, id]);
};

// ── Evaluations ───────────────────────────────────────────────────────────────

exports.addEvaluation = async (candidateId, evaluatorId, comments) => {
    const result = await run(
        `INSERT INTO evaluations (candidate_id, evaluator_id, comments) VALUES (?, ?, ?)`,
        [candidateId, evaluatorId, comments]
    );
    // Return the full evaluation row with evaluator name
    return get(`
        SELECT e.id, e.comments, e.created_at, a.username as evaluator_name
        FROM evaluations e
        JOIN admin_users a ON e.evaluator_id = a.id
        WHERE e.id = ?
    `, [result.lastID]);
};

exports.getEvaluationsByCandidate = (candidateId) => {
    return all(`
        SELECT e.id, e.comments, e.created_at, a.username as evaluator_name
        FROM evaluations e
        LEFT JOIN admin_users a ON e.evaluator_id = a.id
        WHERE e.candidate_id = $1
        ORDER BY e.created_at DESC
    `, [candidateId]);
};
