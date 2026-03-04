const { v4: uuidv4 } = require('uuid');
const Scoring = require('../utils/scoring');
const { QUESTION_BANK } = require('../utils/questions');
const aiService = require('../services/aiService');
const CandidateRepo = require('../db/repositories/candidateRepository');

exports.createCandidate = async (req, res) => {
    const { work_experiences, ...fields } = req.body;
    const id = uuidv4();

    try {
        await CandidateRepo.createCandidate(id, fields);

        if (work_experiences && Array.isArray(work_experiences) && work_experiences.length > 0) {
            await CandidateRepo.addWorkExperiences(id, work_experiences);
        }

        res.status(201).json({ id, message: 'Candidate created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.submitAnswers = async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
        return res.status(400).json({ error: 'Answers must be an array' });
    }

    try {
        await CandidateRepo.saveAnswers(id, answers);
        res.json({ message: 'Answers saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.submitPersonality = async (req, res) => {
    const { id } = req.params;
    const { answers, timings, positionSequence } = req.body;

    if (!answers || !timings) {
        return res.status(400).json({ error: 'Missing required payload (answers, timings)' });
    }

    try {
        const result = Scoring.calculateCRI(answers, QUESTION_BANK, timings, positionSequence || []);

        await CandidateRepo.savePersonalityScore(id, {
            red: result.scores.red,
            blue: result.scores.blue,
            yellow: result.scores.yellow,
            green: result.scores.green,
            cri: result.cri,
            cri_details: JSON.stringify(result.layers)
        });

        res.json({ message: 'Personality scored and saved successfully', cri_level: result.level });
    } catch (err) {
        res.status(500).json({ error: 'Scoring or save failed: ' + err.message });
    }
};

exports.finalSubmit = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await CandidateRepo.setStatus(id, 'completed');
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        // Trigger async AI report generation (non-blocking)
        aiService.generateAiReport(id).catch(e => console.error('Failed to start AI report generation:', e));

        res.json({ message: 'Submission completed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
