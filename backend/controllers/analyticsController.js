const db = require('../db/connection');

// Helper: promisify db.all
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

const getDashboardAnalytics = async (req, res) => {
    try {
        // 1. Total candidates
        const [totalRow] = await dbAll(`SELECT COUNT(*) as total FROM candidates`);
        const total = totalRow.total;

        // 2. Job category distribution (which jobs get the most applicants)
        const jobDist = await dbAll(`
            SELECT jc.department, jc.position, COUNT(c.id) as count
            FROM job_categories jc
            LEFT JOIN candidates c ON c.job_category_id = jc.id
            GROUP BY jc.id
            ORDER BY count DESC
        `);

        // 3. Status distribution — count candidates per status
        const statusDist = await dbAll(`
            SELECT status, COUNT(*) as count
            FROM candidates
            GROUP BY status
            ORDER BY count DESC
        `);

        // 4. Recruitment funnel:
        //    We define funnel stages as logical groups of statuses.
        //    "投遞" = all candidates (total)
        //    "進入面試" = candidates in any '面試' related status
        //    "核定/錄用" = candidates in '錄用' or '即將到職' or '核定中'
        const interviewStatuses = await dbAll(`
            SELECT COUNT(*) as count FROM candidates
            WHERE status LIKE '%面試%' OR status LIKE '%邀約%' OR status LIKE '%已面試%' OR status LIKE '%面試%'
        `);
        const hiredStatuses = await dbAll(`
            SELECT COUNT(*) as count FROM candidates
            WHERE status LIKE '%錄用%' OR status LIKE '%到職%' OR status LIKE '%核定%'
        `);

        const funnel = [
            { stage: '投遞履歷', count: total },
            { stage: '進入面試', count: interviewStatuses[0]?.count || 0 },
            { stage: '核定/錄用', count: hiredStatuses[0]?.count || 0 },
        ];

        // 5. Recent 30-day trend: candidates created per day
        const trend30 = await dbAll(`
            SELECT date(created_at) as day, COUNT(*) as count
            FROM candidates
            WHERE created_at >= date('now', '-30 days')
            GROUP BY date(created_at)
            ORDER BY day ASC
        `);

        // 6. Average days per stage:
        //    This is approximate — we look at candidates grouped by status and compute
        //    average days since creation as a rough proxy.
        const stageDays = await dbAll(`
            SELECT status,
                   COUNT(*) as count,
                   ROUND(AVG(julianday('now') - julianday(created_at)), 1) as avg_days
            FROM candidates
            WHERE status IS NOT NULL AND status != '' AND status != 'pending' AND status != 'completed'
            GROUP BY status
            ORDER BY avg_days DESC
        `);

        // 7. Unread (pending) candidates
        const [pendingRow] = await dbAll(`
            SELECT COUNT(*) as count FROM candidates WHERE status IS NULL OR status = 'pending' OR status = '待處理' OR status = 'completed'
        `);

        res.json({
            total,
            pending: pendingRow.count,
            jobDistribution: jobDist,
            statusDistribution: statusDist,
            funnel,
            trend30: trend30,
            stageDays: stageDays.slice(0, 8), // top 8 stages
        });
    } catch (err) {
        console.error('[Analytics] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getDashboardAnalytics };
