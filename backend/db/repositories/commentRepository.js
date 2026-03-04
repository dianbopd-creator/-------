const db = require('../connection');

/**
 * Get all comments for a candidate, newest first
 */
const getCommentsByCandidate = (candidateId) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT cc.*, au.full_name, au.username, au.avatar_b64, au.department, au.position
             FROM candidate_comments cc
             LEFT JOIN admin_users au ON cc.admin_id = au.id
             WHERE cc.candidate_id = ?
             ORDER BY cc.created_at DESC`,
            [candidateId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
};

/**
 * Create a new comment
 */
const createComment = (candidateId, adminId, adminName, content) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO candidate_comments (candidate_id, admin_id, admin_name, content) VALUES (?, ?, ?, ?)`,
            [candidateId, adminId, adminName, content],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            }
        );
    });
};

/**
 * Delete a comment (only allowed by the comment owner)
 */
const deleteComment = (commentId, adminId) => {
    return new Promise((resolve, reject) => {
        db.run(
            `DELETE FROM candidate_comments WHERE id = ? AND admin_id = ?`,
            [commentId, adminId],
            function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            }
        );
    });
};

module.exports = { getCommentsByCandidate, createComment, deleteComment };
