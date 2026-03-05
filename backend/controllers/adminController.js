const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CandidateRepo = require('../db/repositories/candidateRepository');
const AdminRepo = require('../db/repositories/adminRepository');
const TagRepo = require('../db/repositories/tagRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await AdminRepo.findUserByUsername(username);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // === 2FA Check ===
        if (user.totp_enabled) {
            // Issue a short-lived "pending" token (5 min) — not usable as a real JWT
            const tempToken = jwt.sign(
                { id: user.id },
                JWT_SECRET + '_2fa_pending',
                { expiresIn: '5m' }
            );
            return res.status(200).json({
                require2FA: true,
                tempToken,
                message: '請輸入 Google Authenticator 驗證碼',
            });
        }

        // === No 2FA — issue real JWT (with totp_enabled flag) ===
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, totp_enabled: !!user.totp_enabled },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id, username: user.username, role: user.role,
                full_name: user.full_name, avatar_b64: user.avatar_b64,
                department: user.department, position: user.position
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.getCandidates = async (req, res) => {
    try {
        const rows = await CandidateRepo.findAll();
        const tagsMap = await TagRepo.getAllCandidateTagsMap();
        const mappedRows = rows.map(r => {
            if (r.jc_department) r.department = r.jc_department;
            if (r.jc_position) r.position = r.jc_position;
            try { r.stages = r.stages ? JSON.parse(r.stages) : []; } catch { r.stages = []; }
            delete r.jc_department;
            delete r.jc_position;
            r.tags = tagsMap[r.id] || [];
            return r;
        });
        res.json({ data: mappedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCandidateById = async (req, res) => {
    const { id } = req.params;

    try {
        const candidate = await CandidateRepo.findById(id);
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        if (candidate.jc_department) candidate.department = candidate.jc_department;
        if (candidate.jc_position) candidate.position = candidate.jc_position;
        try { candidate.stages = candidate.stages ? JSON.parse(candidate.stages) : []; } catch { candidate.stages = []; }
        delete candidate.jc_department;
        delete candidate.jc_position;
        delete candidate.jc_details;

        // Each sub-query is independently fault-tolerant
        const [answers, personality, evaluations, workExperiences, tags] = await Promise.all([
            CandidateRepo.getAnswersByCandidate(id).catch(e => { console.error('[getCandidateById] answers error:', e.message); return []; }),
            CandidateRepo.getPersonalityByCandidate(id).catch(e => { console.error('[getCandidateById] personality error:', e.message); return null; }),
            AdminRepo.getEvaluationsByCandidate(id).catch(e => { console.error('[getCandidateById] evaluations error:', e.message); return []; }),
            CandidateRepo.getWorkExperiencesByCandidate(id).catch(e => { console.error('[getCandidateById] workExp error:', e.message); return []; }),
            TagRepo.getCandidateTags(id).catch(e => { console.error('[getCandidateById] tags error:', e.message); return []; }),
        ]);

        res.json({
            candidate,
            workExperiences: workExperiences || [],
            answers: answers || [],
            personality,
            tags: tags || [],
            aiReport: candidate.ai_analysis_report ? { raw_analysis: candidate.ai_analysis_report } : null,
            evaluations: evaluations || []
        });
    } catch (err) {
        console.error('[getCandidateById] top-level error:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
};

exports.batchUpdateCandidateStatus = async (req, res) => {
    const { ids, status, job_category_id } = req.body;

    if (!status || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'IDs array and status are required' });
    }

    try {
        let changedCount = 0;
        for (const id of ids) {
            const result = await CandidateRepo.setStatus(id, status, job_category_id !== undefined ? job_category_id : undefined);
            if (result.changes > 0) changedCount++;
        }
        res.json({ message: `Successfully updated ${changedCount} candidates`, updated_count: changedCount, status, job_category_id });
    } catch (err) {
        console.error('batchUpdateCandidateStatus error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.updateCandidateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, job_category_id } = req.body;

    console.log('>>> UPDATE CANDIDATE STATUS CALLED:', { id, status, job_category_id });

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        const result = await CandidateRepo.setStatus(id, status, job_category_id);
        if (result.changes === 0) return res.status(404).json({ error: 'Candidate not found' });
        res.json({ message: 'Candidate status updated successfully', status, job_category_id });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.addEvaluation = async (req, res) => {
    const { id } = req.params;
    const { comments } = req.body;
    const evaluatorId = req.user.id;

    if (!comments || comments.trim() === '') {
        return res.status(400).json({ error: 'Comments are required' });
    }

    try {
        const evaluation = await AdminRepo.addEvaluation(id, evaluatorId, comments);
        res.status(201).json({ message: 'Evaluation added successfully', evaluation });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.exportPDF = (req, res) => {
    const { id } = req.params;
    res.json({ message: `PDF export service triggered for ${id}, functionality pending integration.` });
};

exports.analyzeCandidate = async (req, res) => {
    const { id } = req.params;
    try {
        const aiService = require('../services/aiService');
        await aiService.generateAiReport(id);
        res.json({ message: 'AI report generation completed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCandidate = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await CandidateRepo.deleteCandidate(id);
        if (result.changes === 0) return res.status(404).json({ error: '找不到此求職者' });
        res.json({ message: '求職者資料已成功刪除' });
    } catch (err) {
        res.status(500).json({ error: '刪除失敗: ' + err.message });
    }
};
