const JobCategoryRepo = require('../db/repositories/jobCategoryRepository');
const { logAction } = require('./auditLogController');

exports.getCategories = async (req, res) => {
    try {
        const rows = await JobCategoryRepo.findAll();
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.createCategory = async (req, res) => {
    const { department, position, stages, details } = req.body;

    if (!department || !position || !stages || !Array.isArray(stages)) {
        return res.status(400).json({ error: 'Department, position and stages array are required' });
    }

    try {
        const result = await JobCategoryRepo.create(department, position, stages, details);

        logAction(req.user?.id || 0, 'CREATE_JOB_CATEGORY', 'job_category', result.lastID, { department, position, stages, details })
            .catch(e => console.error('Audit Log Error:', e));

        res.status(201).json({ message: 'Category created successfully', id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { department, position, stages, details } = req.body;

    if (!department || !position || !stages || !Array.isArray(stages)) {
        return res.status(400).json({ error: 'Department, position and stages array are required' });
    }

    try {
        const result = await JobCategoryRepo.update(id, department, position, stages, details);
        if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });

        logAction(req.user?.id || 0, 'UPDATE_JOB_CATEGORY', 'job_category', id, { department, position, stages, details })
            .catch(e => console.error('Audit Log Error:', e));

        res.json({ message: 'Category updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const { count } = await JobCategoryRepo.getCandidateCount(id);
        if (count > 0) {
            return res.status(400).json({ error: 'Cannot delete this category because there are candidates associated with it.' });
        }

        const result = await JobCategoryRepo.deleteById(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });

        logAction(req.user?.id || 0, 'DELETE_JOB_CATEGORY', 'job_category', id, {})
            .catch(e => console.error('Audit Log Error:', e));

        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};
