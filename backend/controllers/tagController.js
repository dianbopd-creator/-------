const TagRepo = require('../db/repositories/tagRepository');

exports.getAllTags = async (req, res) => {
    try {
        const tags = await TagRepo.getAllTags();
        res.json({ data: tags });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.createTag = async (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Tag name is required' });

    try {
        const tag = await TagRepo.createTag(name, color || '#3b82f6');
        res.status(201).json({ message: 'Tag created', data: tag });
    } catch (err) {
        if (err.message.includes('already exists')) {
            return res.status(409).json({ error: err.message });
        }
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.updateTag = async (req, res) => {
    const { id } = req.params;
    const { name, color } = req.body;
    if (!name || !color) return res.status(400).json({ error: 'Name and color are required' });

    try {
        await TagRepo.updateTag(id, name, color);
        res.json({ message: 'Tag updated' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.deleteTag = async (req, res) => {
    const { id } = req.params;
    try {
        await TagRepo.deleteTag(id);
        res.json({ message: 'Tag deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.getCandidateTags = async (req, res) => {
    const { id } = req.params;
    try {
        const tags = await TagRepo.getCandidateTags(id);
        res.json({ data: tags });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.setCandidateTags = async (req, res) => {
    const { id } = req.params; // candidate_id
    const { tagIds } = req.body;

    if (!Array.isArray(tagIds)) return res.status(400).json({ error: 'tagIds must be an array' });

    try {
        await TagRepo.setCandidateTags(id, tagIds);
        res.json({ message: 'Candidate tags updated' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};
