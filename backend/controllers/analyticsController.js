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
        const { startDate, endDate, jobCategoryId } = req.query;

        // Build base condition
        let conditions = ["1=1"];
        let params = [];

        if (startDate && startDate !== 'undefined') {
            conditions.push(`created_at >= $${params.length + 1}`);
            params.push(startDate + ' 00:00:00');
        }
        if (endDate && endDate !== 'undefined') {
            conditions.push(`created_at <= $${params.length + 1}`);
            params.push(endDate + ' 23:59:59');
        }
        if (jobCategoryId && jobCategoryId !== 'all' && jobCategoryId !== 'undefined') {
            conditions.push(`job_category_id = $${params.length + 1}`);
            params.push(jobCategoryId);
        }

        const baseWhere = conditions.join(' AND ');

        // 1. Total completed candidates (filtered)
        const [totalRow] = await dbAll(`SELECT COUNT(*) as total FROM candidates WHERE status = 'completed' AND ${baseWhere}`, params);
        const total = parseInt(totalRow.total) || 0;

        // 2. Job category distribution (unaffected by job filter if we want to see distribution, but let's apply date filter)
        let jobDistParams = [];
        let jobDistCondition = "1=1";
        if (startDate && startDate !== 'undefined') { jobDistCondition += ` AND c.created_at >= $${jobDistParams.length + 1}`; jobDistParams.push(startDate + ' 00:00:00'); }
        if (endDate && endDate !== 'undefined') { jobDistCondition += ` AND c.created_at <= $${jobDistParams.length + 1}`; jobDistParams.push(endDate + ' 23:59:59'); }

        const jobDist = await dbAll(`
            SELECT jc.department, jc.position, COUNT(c.id) as count
            FROM job_categories jc
            LEFT JOIN candidates c ON c.job_category_id = jc.id AND c.status = 'completed' AND ${jobDistCondition}
            GROUP BY jc.id, jc.department, jc.position
            ORDER BY count DESC
        `, jobDistParams);

        // 3. Status distribution
        const statusDist = await dbAll(`
            SELECT status, COUNT(*) as count
            FROM candidates
            WHERE status IS NOT NULL AND status != '' AND status != 'pending' AND ${baseWhere}
            GROUP BY status
            ORDER BY count DESC
        `, params);

        // 4. Recruitment funnel
        const [interviewRow] = await dbAll(`
            SELECT COUNT(*) as count FROM candidates
            WHERE (status LIKE '%面試%' OR status LIKE '%邀約%' OR status LIKE '%已面試%') AND ${baseWhere}
        `, params);
        const [hiredRow] = await dbAll(`
            SELECT COUNT(*) as count FROM candidates
            WHERE (status LIKE '%錄用%' OR status LIKE '%到職%' OR status LIKE '%核定%') AND ${baseWhere}
        `, params);

        const funnel = [
            { stage: '投遞履歷', count: total },
            { stage: '進入面試', count: parseInt(interviewRow.count) || 0 },
            { stage: '核定/錄用', count: parseInt(hiredRow.count) || 0 },
        ];

        // 5. Trend (always last 30 days of the selected end date or now)
        let trendEnd = endDate && endDate !== 'undefined' ? new Date(endDate) : new Date();
        // Since PostgreSQL NOW() might differ, we pass the bounds explicitly
        const trendStart = new Date(trendEnd);
        trendStart.setDate(trendStart.getDate() - 30);

        let trendParams = [trendStart.toISOString(), trendEnd.toISOString()];
        let trendJobCondition = "";
        if (jobCategoryId && jobCategoryId !== 'all' && jobCategoryId !== 'undefined') {
            trendJobCondition = ` AND job_category_id = $3`;
            trendParams.push(jobCategoryId);
        }

        const trend30 = await dbAll(`
            SELECT DATE(created_at) as day, COUNT(*) as count
            FROM candidates
            WHERE created_at >= $1 AND created_at <= $2 ${trendJobCondition}
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        `, trendParams);

        // 6. Average days per stage
        const stageDays = await dbAll(`
            SELECT status,
                   COUNT(*) as count,
                   ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::numeric, 1) as avg_days
            FROM candidates
            WHERE status IS NOT NULL AND status != '' AND status != 'pending' AND status != 'completed' AND ${baseWhere}
            GROUP BY status
            ORDER BY avg_days DESC
        `, params);

        // 7. Pending/new count
        const [pendingRow] = await dbAll(`
            SELECT COUNT(*) as count FROM candidates WHERE status = 'completed' AND ${baseWhere}
        `, params);

        res.json({
            total,
            pending: parseInt(pendingRow.count) || 0,
            jobDistribution: jobDist,
            statusDistribution: statusDist,
            funnel,
            trend30,
            stageDays: stageDays.slice(0, 8),
        });
    } catch (err) {
        console.error('[Analytics] Error:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getDashboardAnalytics };
