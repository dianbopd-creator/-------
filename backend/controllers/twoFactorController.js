const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const AdminRepo = require('../db/repositories/adminRepository');

const APP_NAME = 'DIANBOPOPO 面試系統';

/**
 * POST /admin/2fa/setup
 * 產生一組新的 TOTP 金鑰，並回傳 QR Code（尚未啟用）
 * 需要已登入（verifyToken）
 */
exports.setup = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await AdminRepo.findUserById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Generate a new secret
        const secret = speakeasy.generateSecret({
            name: `${APP_NAME} (${user.username})`,
            length: 20,
        });

        // Save secret in DB (not yet enabled)
        await AdminRepo.setTotpSecret(userId, secret.base32);

        // Generate QR Code as data URL
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        res.json({
            secret: secret.base32,  // For manual entry
            qrCode: qrCodeUrl,       // Base64 image for frontend
        });
    } catch (err) {
        console.error('2FA setup error:', err);
        res.status(500).json({ error: 'Failed to generate 2FA secret' });
    }
};

/**
 * POST /admin/2fa/enable
 * 用 OTP 驗證碼確認後，正式啟用 2FA
 * Body: { token }
 */
exports.enable = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        if (!token) return res.status(400).json({ error: '請輸入驗證碼' });

        const user = await AdminRepo.findUserById(userId);
        if (!user || !user.totp_secret) {
            return res.status(400).json({ error: '請先執行設定步驟' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.totp_secret,
            encoding: 'base32',
            token: token.replace(/\s/g, ''),
            window: 1, // Allow 30s window on either side
        });

        if (!verified) {
            return res.status(400).json({ error: '驗證碼錯誤，請重試' });
        }

        await AdminRepo.setTotpEnabled(userId, true);
        res.json({ message: '雙因素驗證已成功啟用！' });
    } catch (err) {
        console.error('2FA enable error:', err);
        res.status(500).json({ error: '啟用失敗' });
    }
};

/**
 * POST /admin/2fa/disable
 * 停用 2FA（需提供目前的 OTP 驗證碼確認）
 * Body: { token }
 */
exports.disable = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        if (!token) return res.status(400).json({ error: '請輸入驗證碼以確認停用' });

        const user = await AdminRepo.findUserById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.totp_enabled) {
            return res.status(400).json({ error: '目前並未啟用雙因素驗證' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.totp_secret,
            encoding: 'base32',
            token: token.replace(/\s/g, ''),
            window: 1,
        });

        if (!verified) {
            return res.status(400).json({ error: '驗證碼錯誤' });
        }

        await AdminRepo.setTotpEnabled(userId, false);
        await AdminRepo.setTotpSecret(userId, null);
        res.json({ message: '雙因素驗證已停用' });
    } catch (err) {
        console.error('2FA disable error:', err);
        res.status(500).json({ error: '停用失敗' });
    }
};

/**
 * GET /admin/2fa/status
 * 查詢目前用戶的 2FA 狀態
 */
exports.getStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await AdminRepo.findUserById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            enabled: !!user.totp_enabled,
            hasSecret: !!user.totp_secret,
        });
    } catch (err) {
        res.status(500).json({ error: '查詢失敗' });
    }
};

/**
 * POST /admin/2fa/verify-login
 * 登入第二步驟：驗證 TOTP 碼並核發 JWT
 * Body: { tempToken, otpToken }
 */
exports.verifyLogin = async (req, res) => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';

    try {
        const { tempToken, otpToken } = req.body;

        if (!tempToken || !otpToken) {
            return res.status(400).json({ error: '參數不完整' });
        }

        // Verify the temporary token (short-lived)
        let payload;
        try {
            payload = jwt.verify(tempToken, JWT_SECRET + '_2fa_pending');
        } catch {
            return res.status(401).json({ error: '暫時憑證已過期，請重新登入' });
        }

        const user = await AdminRepo.findUserById(payload.id);
        if (!user || !user.totp_secret) {
            return res.status(401).json({ error: '用戶不存在或未設定 2FA' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.totp_secret,
            encoding: 'base32',
            token: otpToken.replace(/\s/g, ''),
            window: 1,
        });

        if (!verified) {
            return res.status(401).json({ error: '驗證碼錯誤或已過期，請重試' });
        }

        // Issue the real JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id, username: user.username, role: user.role,
                full_name: user.full_name, avatar_b64: user.avatar_b64,
                department: user.department, position: user.position,
                totp_enabled: true,
                permissions: (() => {
                    try { return JSON.parse(user.permissions_json || '[]'); } catch { return []; }
                })()
            }
        });
    } catch (err) {
        console.error('2FA verify-login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
