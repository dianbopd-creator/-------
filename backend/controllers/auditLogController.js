const AuditLogRepo = require('../db/repositories/auditLogRepository');

exports.getAuditLogs = async (req, res) => {
    try {
        const rows = await AuditLogRepo.getLogs(500);
        res.json({ data: rows || [] });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.logAction = (adminId, action, targetEntity, targetId, details) => {
    return AuditLogRepo.logAction(adminId, action, targetEntity, targetId, details);
};
