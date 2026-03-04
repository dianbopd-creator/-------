const bcrypt = require('bcrypt');
const AdminRepo = require('../db/repositories/adminRepository');

const SALT_ROUNDS = 10;

exports.getUsers = async (req, res) => {
    try {
        const rows = await AdminRepo.getAllUsers();
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.createUser = async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password and role are required' });
    }

    if ((role === 'admin' || role === 'superadmin') && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: '只有超級管理員 (Super Admin) 可以建立管理員帳號' });
    }

    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await AdminRepo.createUser(username, hash, role);
        res.status(201).json({ message: 'User created successfully', id: result.lastID });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { password, role } = req.body;

    if (!password && !role) {
        return res.status(400).json({ error: 'Nothing to update' });
    }

    if (role && (role === 'admin' || role === 'superadmin') && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: '只有超級管理員 (Super Admin) 可以指派管理員權限' });
    }

    try {
        const targetUser = await AdminRepo.findUserById(id);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if ((targetUser.role === 'admin' || targetUser.role === 'superadmin') && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: '只有超級管理員 (Super Admin) 可以修改管理員帳號' });
        }

        if (password) {
            const hash = await bcrypt.hash(password, SALT_ROUNDS);
            await AdminRepo.updateUserPassword(id, hash, role);
        } else {
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
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        const targetUser = await AdminRepo.findUserById(id);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if ((targetUser.role === 'admin' || targetUser.role === 'superadmin') && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: '只有超級管理員 (Super Admin) 可以刪除管理員帳號' });
        }

        await AdminRepo.deleteUser(id);
        res.json({ message: 'User deleted successfully' });
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
