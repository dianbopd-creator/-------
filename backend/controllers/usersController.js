const bcrypt = require('bcryptjs');
const AdminRepo = require('../db/repositories/adminRepository');

const SALT_ROUNDS = 10;

// 合法的 12 permission codes 清單（防止不合法的字串被寫入）
const VALID_PERMISSIONS = [
    'view_jobs', 'manage_jobs', 'manage_questions',
    'view_resumes', 'edit_resumes', 'change_status', 'delete_resumes', 'export_data',
    'view_system', 'manage_tags', 'manage_users'
];

function sanitizePermissions(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(p => VALID_PERMISSIONS.includes(p));
}

exports.getUsers = async (req, res) => {
    try {
        const rows = await AdminRepo.getAllUsers();
        // 將 permissions_json 字串解析為陣列回傳給前端
        const parsed = rows.map(r => ({
            ...r,
            permissions: (() => { try { return JSON.parse(r.permissions_json || '[]'); } catch { return []; } })()
        }));
        res.json({ data: parsed });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.createUser = async (req, res) => {
    const { username, password, role, permissions } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // superadmin 不允許從這裡建立
    if (role === 'superadmin') {
        return res.status(403).json({ error: '無法從介面建立超級管理員帳號' });
    }

    // 只有擁有 manage_users 或 superadmin 才能建立帳號
    if (req.user.role !== 'superadmin') {
        let callerPerms = [];
        try {
            const callerUser = await AdminRepo.findUserById(req.user.id);
            callerPerms = JSON.parse(callerUser.permissions_json || '[]');
        } catch { callerPerms = []; }
        if (!callerPerms.includes('manage_users')) {
            return res.status(403).json({ error: '只有擁有「系統人員授權」權限的管理員才能建立帳號' });
        }
    }

    const sanitized = sanitizePermissions(permissions);

    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await AdminRepo.createUser(username, hash, role || 'user', sanitized);
        res.status(201).json({ message: 'User created successfully', id: result.lastID });
    } catch (err) {
        if (err.message && err.message.includes('unique')) {
            return res.status(409).json({ error: '此使用者名稱已被使用' });
        }
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { password, role, permissions } = req.body;

    try {
        const targetUser = await AdminRepo.findUserById(id);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        // 不能修改 superadmin 帳號（除非自己也是 superadmin）
        if (targetUser.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: '無法修改超級管理員帳號' });
        }

        // 驗證呼叫者的操作權限
        if (req.user.role !== 'superadmin') {
            let callerPerms = [];
            try {
                const callerUser = await AdminRepo.findUserById(req.user.id);
                callerPerms = JSON.parse(callerUser.permissions_json || '[]');
            } catch { callerPerms = []; }
            if (!callerPerms.includes('manage_users')) {
                return res.status(403).json({ error: '只有擁有「系統人員授權」權限的管理員才能修改帳號' });
            }
        }

        const sanitized = permissions !== undefined ? sanitizePermissions(permissions) : undefined;

        if (password) {
            const hash = await bcrypt.hash(password, SALT_ROUNDS);
            await AdminRepo.updateUserPassword(id, hash, role);
        }

        if (sanitized !== undefined) {
            await AdminRepo.updateUserRoleAndPermissions(id, role || targetUser.role, sanitized);
        } else if (role) {
            await AdminRepo.updateUserRole(id, role);
        }

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: '無法停用自己的帳號' });
    }

    try {
        const targetUser = await AdminRepo.findUserById(id);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if (targetUser.role === 'superadmin') {
            return res.status(403).json({ error: '無法停用超級管理員帳號' });
        }

        // 驗證呼叫者的操作權限
        if (req.user.role !== 'superadmin') {
            let callerPerms = [];
            try {
                const callerUser = await AdminRepo.findUserById(req.user.id);
                callerPerms = JSON.parse(callerUser.permissions_json || '[]');
            } catch { callerPerms = []; }
            if (!callerPerms.includes('manage_users')) {
                return res.status(403).json({ error: '只有擁有「系統人員授權」權限的管理員才能停用帳號' });
            }
        }

        await AdminRepo.deleteUser(id);
        res.json({ message: 'User deactivated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { full_name, email, avatar_b64, department, position } = req.body;

    try {
        await AdminRepo.updateProfile(userId, { full_name, email, avatar_b64, department, position });
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error updating profile', details: err.message });
    }
};

exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    try {
        const user = await AdminRepo.findUserById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Incorrect current password' });

        const hash = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS || 10));
        await AdminRepo.updateUserPassword(userId, hash);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};
