import { QUESTION_BANK } from '../data/colortest_questions';

/**
 * 隨機抽題引擎
 * 從 100 題中按規則抽出 30 題，並打亂選項順序
 */
export const QuestionPicker = (() => {
    /**
     * 從陣列中隨機取 n 個元素
     */
    function sample(arr, n) {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(n, arr.length));
    }

    /**
     * Fisher-Yates 洗牌
     */
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * 打亂單題選項順序，保留原始色彩對應
     */
    function shuffleOptions(question) {
        const letters = ['A', 'B', 'C', 'D'];
        const shuffledOpts = shuffle(question.options);
        return {
            ...question,
            options: shuffledOpts.map((opt, i) => ({
                ...opt,
                letter: letters[i]
            }))
        };
    }

    /**
     * 主要抽題函數
     * @returns {Array} 30 題（含打亂選項）
     */
    function pick() {
        const regular = QUESTION_BANK.filter(q => q.type === 'regular');
        const paired = QUESTION_BANK.filter(q => q.type === 'paired');
        const social = QUESTION_BANK.filter(q => q.type === 'social');

        // 1) 抽配對題：隨機挑 4 組 pairId，取出 8 題
        const allPairIds = [...new Set(paired.map(q => q.pairId))];
        const selectedPairIds = sample(allPairIds, 4);
        const pickedPaired = paired.filter(q => selectedPairIds.includes(q.pairId));

        // 2) 抽社會期望題：隨機 3 題
        const pickedSocial = sample(social, 3);

        // 3) 從正規題中補足至 30 題
        const remaining = 30 - pickedPaired.length - pickedSocial.length;
        const pickedRegular = sample(regular, remaining);

        // 4) 合併後打亂題目順序
        const allPicked = shuffle([...pickedRegular, ...pickedPaired, ...pickedSocial]);

        // 5) 每題的選項順序也打亂
        return allPicked.map(q => shuffleOptions(q));
    }

    /**
     * 取得本次測驗中所有配對題的 pairId 列表
     */
    function getPairIds(questions) {
        return [...new Set(
            questions.filter(q => q.type === 'paired').map(q => q.pairId)
        )];
    }

    return { pick, getPairIds, shuffle };
})();
