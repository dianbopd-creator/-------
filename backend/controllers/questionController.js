const repo = require('../db/repositories/questionRepository');

const getAllQuestions = async (req, res) => {
    try {
        const rows = await repo.getAllQuestions();
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const createQuestion = async (req, res) => {
    const { question_text, question_type, category, is_required } = req.body;
    if (!question_text?.trim()) return res.status(400).json({ error: '題目內容不可為空' });
    try {
        const result = await repo.createQuestion({ question_text: question_text.trim(), question_type, category, is_required });
        res.status(201).json({ id: result.lastID });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateQuestion = async (req, res) => {
    const { id } = req.params;
    const { question_text, question_type, category, is_required } = req.body;
    if (!question_text?.trim()) return res.status(400).json({ error: '題目內容不可為空' });
    try {
        await repo.updateQuestion(id, { question_text: question_text.trim(), question_type, category, is_required });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteQuestion = async (req, res) => {
    const { id } = req.params;
    try {
        await repo.deleteQuestion(id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Get questions assigned to a specific job category
const getQuestionsForJob = async (req, res) => {
    const { jobId } = req.params;
    try {
        const rows = await repo.getQuestionsForJob(jobId);
        res.json({ data: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Set (replace) questions assigned to a job
const setQuestionsForJob = async (req, res) => {
    const { jobId } = req.params;
    const { question_ids } = req.body;  // Array of question IDs in order
    if (!Array.isArray(question_ids)) return res.status(400).json({ error: 'question_ids must be an array' });
    try {
        await repo.setQuestionsForJob(jobId, question_ids);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getAllQuestions, createQuestion, updateQuestion, deleteQuestion, getQuestionsForJob, setQuestionsForJob };
