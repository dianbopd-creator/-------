const { getCommentsByCandidate, createComment, deleteComment } = require('../db/repositories/commentRepository');

/**
 * GET /admin/candidates/:id/comments
 * Returns all comments for a candidate
 */
const getComments = async (req, res) => {
    try {
        const comments = await getCommentsByCandidate(req.params.id);
        res.json(comments);
    } catch (err) {
        console.error('getComments error:', err);
        res.status(500).json({ error: '無法取得留言' });
    }
};

/**
 * POST /admin/candidates/:id/comments
 * Body: { content }
 */
const addComment = async (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: '留言內容不可為空' });
    }
    try {
        const adminId = req.user.id;
        const adminName = req.user.full_name || req.user.username;
        const result = await createComment(req.params.id, adminId, adminName, content.trim());
        res.status(201).json({ id: result.id, message: '留言新增成功' });
    } catch (err) {
        console.error('addComment error:', err);
        res.status(500).json({ error: '無法新增留言' });
    }
};

/**
 * DELETE /admin/candidates/:candidateId/comments/:commentId
 * Only the comment owner can delete their own comment
 */
const removeComment = async (req, res) => {
    try {
        const commentId = Number(req.params.commentId);
        const adminId = Number(req.user.id);
        const result = await deleteComment(commentId, adminId);
        if (result.changes === 0) {
            console.log(`Failed to delete comment: commentId=${commentId}, adminId=${adminId}. Changes: 0`);
            return res.status(403).json({ error: '無法刪除：您只能刪除自己的留言' });
        }
        res.json({ message: '留言已刪除' });
    } catch (err) {
        console.error('removeComment error:', err);
        res.status(500).json({ error: '無法刪除留言' });
    }
};

module.exports = { getComments, addComment, removeComment };
