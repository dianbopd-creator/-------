const db = require('../connection');

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

exports.createTag = async (name, color) => {
    try {
        const result = await run(`INSERT INTO tags (name, color) VALUES (?, ?)`, [name, color]);
        return this.getTagById(result.lastID);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            throw new Error(`Tag with name "${name}" already exists`);
        }
        throw err;
    }
};

exports.updateTag = (id, name, color) => {
    return run(`UPDATE tags SET name = ?, color = ? WHERE id = ?`, [name, color, id]);
};

exports.deleteTag = async (id) => {
    // Delete bindings first is done by CASCADE, but SQLite requires PRAGMA foreign_keys = ON;
    // We'll manually delete just in case depending on config.
    await run(`DELETE FROM candidate_tags WHERE tag_id = ?`, [id]);
    return run(`DELETE FROM tags WHERE id = ?`, [id]);
};

exports.getTagById = (id) => {
    return get(`SELECT * FROM tags WHERE id = ?`, [id]);
};

exports.getAllTags = () => {
    return all(`SELECT * FROM tags ORDER BY name ASC`);
};

exports.getCandidateTags = (candidateId) => {
    return all(`
        SELECT t.* FROM tags t
        JOIN candidate_tags ct ON ct.tag_id = t.id
        WHERE ct.candidate_id = ?
    `, [candidateId]);
};

exports.setCandidateTags = async (candidateId, tagIds) => {
    // First clear existing tags
    await run(`DELETE FROM candidate_tags WHERE candidate_id = ?`, [candidateId]);

    // Then set new ones
    if (tagIds && tagIds.length > 0) {
        const stmt = db.prepare(`INSERT INTO candidate_tags (candidate_id, tag_id) VALUES (?, ?)`);
        let hasError = false;
        await new Promise((resolve) => {
            tagIds.forEach(tagId => {
                stmt.run([candidateId, tagId], (err) => {
                    if (err) hasError = true;
                });
            });
            stmt.finalize(() => resolve());
        });
        if (hasError) throw new Error('Failed to set some tags');
    }
};

exports.getAllCandidateTagsMap = async () => {
    const rows = await all(`
        SELECT ct.candidate_id, t.id, t.name, t.color 
        FROM candidate_tags ct
        JOIN tags t ON ct.tag_id = t.id
    `);

    const map = {};
    for (const row of rows) {
        if (!map[row.candidate_id]) map[row.candidate_id] = [];
        map[row.candidate_id].push({ id: row.id, name: row.name, color: row.color });
    }
    return map;
};
