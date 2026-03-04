/**
 * 計分引擎 + 五層測謊檢測
 */
const Scoring = (() => {
    const COLOR_NAMES = { red: '紅色', blue: '藍色', yellow: '黃色', green: '綠色' };
    const COLORS = ['red', 'blue', 'yellow', 'green'];

    /**
     * 計算各色彩分數
     * @param {Array} answers - [{questionId, color, ...}, ...]
     * @returns {Object} {red: N, blue: N, yellow: N, green: N}
     */
    function tallyScores(answers) {
        const scores = { red: 0, blue: 0, yellow: 0, green: 0 };
        answers.forEach(a => {
            if (a.color && scores.hasOwnProperty(a.color)) {
                scores[a.color]++;
            }
        });
        return scores;
    }

    /**
     * 判斷主色 & 次色
     */
    function getPrimarySecondary(scores) {
        const sorted = COLORS.slice().sort((a, b) => scores[b] - scores[a]);
        return { primary: sorted[0], secondary: sorted[1], sorted };
    }

    // ===== 五層測謊 =====

    /**
     * L1：配對一致性檢測
     * @returns {{ score: number, pairs: Array, inconsistentCount: number }}
     */
    function checkPairConsistency(answers, questions) {
        const pairIds = [...new Set(questions.filter(q => q.type === 'paired').map(q => q.pairId))];
        const pairs = [];
        let inconsistentCount = 0;

        pairIds.forEach(pid => {
            const pairQs = questions.filter(q => q.pairId === pid);
            if (pairQs.length !== 2) return;

            const a1 = answers.find(a => a.questionId === pairQs[0].id);
            const a2 = answers.find(a => a.questionId === pairQs[1].id);
            if (!a1 || !a2) return;

            const consistent = a1.color === a2.color;
            if (!consistent) inconsistentCount++;
            pairs.push({
                pairId: pid,
                q1: pairQs[0].id, q1Color: a1.color,
                q2: pairQs[1].id, q2Color: a2.color,
                consistent
            });
        });

        const deduction = inconsistentCount * 8;
        return { score: Math.max(0, 100 - deduction), pairs, inconsistentCount, deduction };
    }

    /**
     * L2：社會期望檢測
     */
    function checkSocialDesirability(answers, questions) {
        const socialQs = questions.filter(q => q.type === 'social');
        let sdCount = 0;

        socialQs.forEach(q => {
            const ans = answers.find(a => a.questionId === q.id);
            if (!ans) return;
            // 找到被選中的選項
            const selectedOpt = q.options.find(o => o.text === ans.optionText);
            if (selectedOpt && selectedOpt.sd) sdCount++;
        });

        // 第 1 題不扣分，之後每題扣 6 分
        const deduction = Math.max(0, sdCount - 1) * 6;
        return { sdCount, total: socialQs.length, deduction };
    }

    /**
     * L3：極端一致性檢測
     */
    function checkExtremeUniformity(scores, total) {
        const max = Math.max(...Object.values(scores));
        const triggered = max >= total * 0.83; // 25/30
        return { triggered, maxColor: COLORS.find(c => scores[c] === max), maxCount: max, deduction: triggered ? 20 : 0 };
    }

    /**
     * L4：作答時間異常檢測
     * @param {Array} timings - 每題作答秒數 [{questionId, seconds}, ...]
     */
    function checkTimingAnomalies(timings) {
        if (!timings || timings.length === 0) return { triggered: false, deduction: 0, anomalyCount: 0, avgTime: 0 };

        let anomalyCount = 0;
        const total = timings.length;

        timings.forEach(t => {
            if (t.seconds < 2 || t.seconds > 60) anomalyCount++;
        });

        const avgTime = timings.reduce((sum, t) => sum + t.seconds, 0) / total;
        const anomalyRate = anomalyCount / total;
        const triggered = anomalyRate > 0.4;
        return { triggered, anomalyCount, anomalyRate, avgTime: Math.round(avgTime * 10) / 10, deduction: triggered ? 15 : 0 };
    }

    /**
     * L5：模式偵測
     * 檢查選項位置是否呈現規律模式
     * @param {Array} positionSequence - 每題選擇的選項位置 [0,1,2,3,...]
     */
    function checkPatternDetection(positionSequence) {
        if (!positionSequence || positionSequence.length < 8) return { triggered: false, deduction: 0 };

        const seq = positionSequence;

        // 檢查全部選同一位置
        const allSame = seq.every(p => p === seq[0]);
        if (allSame) return { triggered: true, pattern: 'ALL_SAME', deduction: 15 };

        // 檢查交替模式 (如 0,1,0,1 或 0,1,2,3,0,1,2,3)
        for (let period = 2; period <= 4; period++) {
            let matchCount = 0;
            for (let i = period; i < seq.length; i++) {
                if (seq[i] === seq[i % period]) matchCount++;
            }
            if (matchCount / (seq.length - period) > 0.8) {
                return { triggered: true, pattern: `REPEAT_${period}`, deduction: 15 };
            }
        }

        return { triggered: false, deduction: 0 };
    }

    /**
     * 計算綜合誠信度 (CRI)
     */
    function calculateCRI(answers, questions, timings, positionSequence) {
        const scores = tallyScores(answers);
        const l1 = checkPairConsistency(answers, questions);
        const l2 = checkSocialDesirability(answers, questions);
        const l3 = checkExtremeUniformity(scores, answers.length);
        const l4 = checkTimingAnomalies(timings);
        const l5 = checkPatternDetection(positionSequence);

        const totalDeduction = l1.deduction + l2.deduction + l3.deduction + l4.deduction + l5.deduction;
        const cri = Math.max(0, Math.min(100, 100 - totalDeduction));

        let level;
        if (cri >= 75) level = 'green';
        else if (cri >= 50) level = 'yellow';
        else level = 'red';

        return {
            cri, level,
            layers: { l1, l2, l3, l4, l5 },
            scores,
            ...getPrimarySecondary(scores)
        };
    }

    return { tallyScores, getPrimarySecondary, calculateCRI, COLOR_NAMES, COLORS };
})();

module.exports = Scoring;
