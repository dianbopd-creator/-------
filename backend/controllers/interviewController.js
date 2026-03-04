const InterviewRepo = require('../db/repositories/interviewRepository');
const AdminRepo = require('../db/repositories/adminRepository');

// GET /admin/candidates/:id/interview-score
// Returns: all evaluators' scores + isMine flag
exports.getInterviewScore = async (req, res) => {
    const { id } = req.params;
    const myId = req.user.id;
    try {
        const allScores = await InterviewRepo.getAllScores(id);
        const parsed = allScores.map(row => ({
            ...row,
            isMine: row.evaluator_id === myId,
            scores: (() => { try { return JSON.parse(row.scores_json || '{}'); } catch { return {}; } })(),
            checkboxes: (() => { try { return JSON.parse(row.checkboxes_json || '{}'); } catch { return {}; } })(),
            notes: (() => { try { return JSON.parse(row.notes || '[]'); } catch { return []; } })(),
        }));
        res.json({ data: parsed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// POST /admin/candidates/:id/interview-score
exports.saveInterviewScore = async (req, res) => {
    const { id } = req.params;
    const evaluatorId = req.user.id;
    const evaluatorName = req.user.username || '匿名評分員';
    const { scores, checkboxes, strengths, weaknesses, notes } = req.body;

    const total_score = Object.values(scores || {}).reduce((sum, v) => sum + (parseInt(v) || 0), 0);

    try {
        await InterviewRepo.upsertScores(id, evaluatorId, evaluatorName, {
            scores_json: JSON.stringify(scores || {}),
            checkboxes_json: JSON.stringify(checkboxes || {}),
            strengths: strengths || '',
            weaknesses: weaknesses || '',
            notes: JSON.stringify(notes || []),
            total_score
        });
        res.json({ message: '評分儲存成功', total_score, evaluator: evaluatorName });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
