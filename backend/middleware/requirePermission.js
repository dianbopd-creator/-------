const AdminRepo = require('../db/repositories/adminRepository');

/**
 * requirePermission(permissionCode)
 * 
 * 中介軟體工廠函式。用法：
 *   router.delete('/...', verifyToken, requirePermission('delete_resumes'), controller);
 * 
 * superadmin 永遠全開，不受任何 permissions 限制。
 * 其他帳號需要在 permissions_json 陣列中包含指定的 permissionCode。
 * 
 * 可用的 permissionCode 清單：
 *   職缺與題庫：  view_jobs, manage_jobs, manage_questions
 *   履歷與甄試：  view_resumes, edit_resumes, change_status, delete_resumes, export_data
 *   系統帳號：    view_system, manage_tags, manage_users
 */
const requirePermission = (permissionCode) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: '未授權：無使用者 Session' });
        }

        // superadmin 永遠全開
        if (req.user.role === 'superadmin') {
            return next();
        }

        try {
            // 從資料庫讀取最新的 permissions（避免 JWT 快取舊資料）
            const user = await AdminRepo.findUserById(req.user.id);
            if (!user || user.is_active === 0) {
                return res.status(403).json({ error: '此帳號已被停用' });
            }

            let permissions = [];
            try {
                permissions = JSON.parse(user.permissions_json || '[]');
            } catch {
                permissions = [];
            }

            if (!permissions.includes(permissionCode)) {
                return res.status(403).json({ 
                    error: `權限不足：需要 [${permissionCode}] 權限才能執行此操作` 
                });
            }

            next();
        } catch (err) {
            res.status(500).json({ error: '權限驗證失敗', details: err.message });
        }
    };
};

module.exports = requirePermission;
