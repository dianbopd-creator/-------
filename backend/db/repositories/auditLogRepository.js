const db = require('../connection');

/**
 * auditLogRepository.js
 * 所有與 audit_logs 相關的 SQL 操作
 */

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
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

exports.logAction = (adminId, action, targetEntity, targetId, details) => {
    return run(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)`,
        [adminId, action, JSON.stringify({ target_entity: targetEntity, target_id: targetId, details })]
    );
};

exports.getLogs = (limit = 500) => {
    return all(`
        SELECT a.id, a.action, a.details, a.created_at, u.username as admin_username
        FROM audit_logs a
        LEFT JOIN admin_users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT ?
    `, [limit]);
};
