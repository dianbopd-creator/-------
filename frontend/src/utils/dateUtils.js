/**
 * dateUtils.js
 * 全站統一日期時間格式化工具 — 所有時間以台北時間 (UTC+8 / Asia/Taipei) 顯示
 */

const TAIPEI_TZ = 'Asia/Taipei';

/**
 * 格式化為台北時間的完整日期時間字串
 * 例：2024年3月4日 下午3:45
 */
export function formatDateTime(dateInput) {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d)) return '—';
    return d.toLocaleString('zh-TW', {
        timeZone: TAIPEI_TZ,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * 格式化為台北時間的簡短日期（無時分）
 * 例：2024/3/4
 */
export function formatDate(dateInput) {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('zh-TW', {
        timeZone: TAIPEI_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * 格式化為台北時間的簡短日期+時分（用於 inline 卡片）
 * 例：3月4日 15:45
 */
export function formatShortDateTime(dateInput) {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d)) return '—';
    return d.toLocaleString('zh-TW', {
        timeZone: TAIPEI_TZ,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * 計算距今天數（以台北時間午夜為基準）
 */
export function daysSince(dateInput) {
    if (!dateInput) return Infinity;
    const now = new Date();
    const then = new Date(dateInput);
    return (now - then) / (1000 * 60 * 60 * 24);
}

/**
 * 取得今天台北時間的 YYYY-MM-DD 字串（用於下載檔名）
 */
export function todayDateString() {
    return new Date().toLocaleDateString('zh-TW', {
        timeZone: TAIPEI_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\//g, '-');
}
