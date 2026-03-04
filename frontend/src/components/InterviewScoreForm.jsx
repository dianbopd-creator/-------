import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, X, Save, Loader2, Check } from 'lucide-react';
import { formatShortDateTime } from '../../utils/dateUtils';

// ─── Config ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
    {
        label: '📌 個人素養',
        sub: '團隊行為',
        color: '#8b5cf6',
        items: [
            { id: 's1', label: '守時出席' },
            { id: 's2', label: '邏輯理解' },
            { id: 's3', label: '表達能力' },
        ]
    },
    {
        label: '🎯 求職意願',
        sub: '態度積極性',
        color: '#2563eb',
        items: [
            { id: 's4', label: '離職原因合理性' },
            { id: 's5', label: '投入時間意願' },
            { id: 's6', label: '就業穩定度' },
        ]
    },
    {
        label: '💼 工作能力',
        sub: '綜合素質',
        color: '#16a34a',
        items: [
            { id: 's7', label: '企圖心' },
            { id: 's8', label: '責任感' },
            { id: 's9', label: '抗壓性' },
            { id: 's10', label: '服務態度' },
        ]
    },
    {
        label: '🌟 性格特質',
        sub: '人格特性',
        color: '#d97706',
        items: [
            { id: 's11', label: '正向積極' },
            { id: 's12', label: '自信心' },
            { id: 's13', label: '禮貌儀態' },
        ]
    },
    {
        label: '🔧 專業技能',
        sub: '職能深度',
        color: '#dc2626',
        items: [
            { id: 's14', label: '相關工作經歷' },
            { id: 's15', label: '技術深度廣度' },
            { id: 's16', label: '學習意願' },
        ]
    },
];

const SCALE_LABELS = ['差', '偏弱', '普通', '良好', '優秀'];
const SCALE_COLORS = ['#dc2626', '#ea580c', '#d97706', '#2563eb', '#16a34a'];

const DEEP_DIVE = [
    { id: 'q1', label: '整體儀態印象', options: ['優秀', '良好', '普通', '偏弱'] },
    { id: 'q2', label: '對公司了解程度', options: ['深入了解', '基本了解', '一般', '不了解'] },
    { id: 'q3', label: '工作熱誠與動力', options: ['非常積極', '積極', '一般', '消極'] },
    { id: 'q4', label: '回答問題清晰度', options: ['非常清晰', '清晰', '普通', '混沌'] },
    { id: 'q5', label: '團隊合作意識', options: ['強', '中等', '弱', '個人傾向'] },
    { id: 'q6', label: '應對壓力能力', options: ['從容', '尚可', '緊張', '難以應對'] },
    { id: 'q7', label: '職涯規劃明確度', options: ['非常明確', '有方向', '模糊', '無規劃'] },
    { id: 'q8', label: '薪資期望合理性', options: ['完全合理', '尚可接受', '稍高', '偏高'] },
    { id: 'q9', label: '學習能力評估', options: ['優秀', '良好', '普通', '待加強'] },
    { id: 'q10', label: '整體面試建議', options: ['強烈推薦', '建議錄取', '保留考慮', '不建議'] },
];

const NOTES = ['有立即可用的能力', '具高度發展潛力', '個性需再觀察', '需要加強培訓', '不符合職位需求'];

const getResultBadge = (total) => {
    if (total >= 65) return { label: '建議錄取 ✓', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    if (total >= 45) return { label: '保留考慮 ◐', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    return { label: '不建議錄取 ✗', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
};

// ─── Main Component ──────────────────────────────────────────────────────────
const InterviewScoreForm = ({ candidateId, apiUrl }) => {
    const [open, setOpen] = useState(false);
    const [allScores, setAllScores] = useState([]);
    const [loadingAll, setLoadingAll] = useState(false);

    const [scores, setScores] = useState({});
    const [checkboxes, setCheckboxes] = useState({});
    const [strengths, setStrengths] = useState('');
    const [weaknesses, setWeaknesses] = useState('');
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [viewingRecordId, setViewingRecordId] = useState(null);

    const token = localStorage.getItem('adminToken');
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const activeView = viewingRecordId ? allScores.find(r => r.id === viewingRecordId) : null;
    const isReadOnly = !!activeView && !activeView.isMine;

    const displayScores = activeView ? (activeView.scores || {}) : scores;
    const displayCheckboxes = activeView ? (activeView.checkboxes || {}) : checkboxes;
    const displayStrengths = activeView ? (activeView.strengths || '') : strengths;
    const displayWeaknesses = activeView ? (activeView.weaknesses || '') : weaknesses;
    const displayNotes = activeView ? (Array.isArray(activeView.notes) ? activeView.notes : []) : selectedNotes;

    const totalScore = Object.values(displayScores).reduce((s, v) => s + (parseInt(v) || 0), 0);
    const maxScore = CATEGORIES.reduce((s, c) => s + c.items.length * 5, 0);

    const loadScores = async () => {
        setLoadingAll(true);
        try {
            const res = await fetch(`${apiUrl}/admin/candidates/${candidateId}/interview-score`, { headers: authHeaders });
            const json = await res.json();
            if (json.data) {
                setAllScores(json.data);
                const mine = json.data.find(r => r.isMine);
                if (mine) {
                    setScores(mine.scores || {});
                    setCheckboxes(mine.checkboxes || {});
                    setStrengths(mine.strengths || '');
                    setWeaknesses(mine.weaknesses || '');
                    setSelectedNotes(Array.isArray(mine.notes) ? mine.notes : []);
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoadingAll(false); }
    };

    useEffect(() => {
        loadScores();
    }, [candidateId]);

    useEffect(() => {
        if (!open) setViewingRecordId(null);
    }, [open]);

    const handleSave = async () => {
        setSaving(true); setSaveMsg('');
        try {
            const res = await fetch(`${apiUrl}/admin/candidates/${candidateId}/interview-score`, {
                method: 'POST', headers: authHeaders,
                body: JSON.stringify({ scores, checkboxes, strengths, weaknesses, notes: selectedNotes })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setSaveMsg(`✅ 已儲存（總分 ${json.total_score} 分）`);
            await loadScores();
        } catch (e) { setSaveMsg('❌ ' + e.message); }
        finally { setSaving(false); }
    };

    const getCatScore = (cat) => cat.items.reduce((s, item) => s + (parseInt(displayScores[item.id]) || 0), 0);

    // ── Sidebar trigger (collapsed view) ─────────────────────────────────────
    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {allScores.length > 0 && !open && (
                        <span style={{ fontSize: '0.78rem', color: 'rgba(45,34,28,0.4)', fontWeight: 'bold' }}> {allScores.length} 位已提供評分</span>
                    )}
                </div>

                {/* Evaluator summary pills (collapsed) */}
                {!open && allScores.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {allScores.map(ev => {
                            const b = getResultBadge(ev.total_score);
                            return (
                                <div key={ev.id}
                                    onClick={() => { setViewingRecordId(ev.id); setOpen(true); }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem 0.85rem', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-structural)', borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = '#ffffff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-structural)'; e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; }}
                                >
                                    {/* Header: Name and Score */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--color-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                {(ev.evaluator_name || '?')[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ev.evaluator_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-tech)', color: 'var(--color-structural)' }}>{ev.total_score}</span>
                                            <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontWeight: 'bold' }}>{b.label}</span>
                                        </div>
                                    </div>
                                    {/* Details: Strengths and Weaknesses */}
                                    {(ev.strengths || ev.weaknesses) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(45,34,28,0.1)' }}>
                                            {ev.strengths && (
                                                <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                                    <span style={{ color: '#16a34a', fontWeight: 'bold', marginRight: '4px' }}>👍</span>
                                                    <span style={{ color: 'var(--color-structural)' }}>{ev.strengths}</span>
                                                </div>
                                            )}
                                            {ev.weaknesses && (
                                                <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                                    <span style={{ color: '#dc2626', fontWeight: 'bold', marginRight: '4px' }}>👎</span>
                                                    <span style={{ color: 'var(--color-structural)' }}>{ev.weaknesses}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {allScores.length > 1 && (() => {
                            const avg = Math.round(allScores.reduce((s, r) => s + r.total_score, 0) / allScores.length);
                            const b = getResultBadge(avg);
                            return (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.8rem', background: 'rgba(45,34,28,0.04)', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'rgba(45,34,28,0.6)', fontWeight: 'bold' }}>團隊平均</span>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-tech)', color: 'var(--color-structural)' }}>{avg}</span>
                                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '8px', background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontWeight: 'bold' }}>{b.label}</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                <button
                    onClick={() => setOpen(true)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.5rem', padding: '0.75rem',
                        background: '#ffffff',
                        color: 'var(--color-structural)',
                        border: '1px solid var(--border-dark)',
                        cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600',
                        borderRadius: '8px', transition: 'all 0.15s',
                        fontFamily: 'var(--font-body)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
                >
                    <ClipboardList size={16} />
                    {allScores.find(r => r.isMine) ? '編輯我的評分' : '填寫面試評分'}
                </button>
            </div>

            {/* ── Full-Screen Modal via createPortal ── */}
            {open && createPortal(
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(20,15,10,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem 1rem' }}
                    onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                    <div style={{ background: '#f9f7f4', width: '100%', maxWidth: '1100px', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', background: 'var(--color-structural)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <ClipboardList size={22} color="var(--color-primary)" />
                                <span style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 'bold' }}>面試評分表</span>
                                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>滿分 {maxScore} 分</span>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '4px', display: 'flex' }}>
                                <X size={22} />
                            </button>
                        </div>

                        {/* Body: Left form + Right summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: '500px' }}>

                            {/* ─ Left: Scrollable Form ─ */}
                            <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '82vh' }}>

                                {/* Score Categories */}
                                {CATEGORIES.map(cat => {
                                    const catScore = getCatScore(cat);
                                    const catMax = cat.items.length * 5;
                                    return (
                                        <div key={cat.label} style={{ marginBottom: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${cat.color}33` }}>
                                                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>{cat.label}</h3>
                                                <span style={{ fontSize: '0.78rem', color: 'rgba(45,34,28,0.45)' }}>{cat.sub}</span>
                                                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-tech)', fontWeight: 'bold', fontSize: '0.85rem', color: cat.color }}>{catScore}/{catMax}</span>
                                            </div>

                                            {cat.items.map(item => (
                                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' }}>
                                                    <span style={{ minWidth: '110px', fontSize: '0.9rem', color: 'var(--color-structural)', fontWeight: 500 }}>{item.label}</span>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                                        {[1, 2, 3, 4, 5].map(val => {
                                                            const selected = parseInt(displayScores[item.id]) === val;
                                                            return (
                                                                <label key={val} style={{ flex: 1, cursor: isReadOnly ? 'default' : 'pointer' }}>
                                                                    <input type="radio" name={`s_${item.id}`} value={val} checked={selected} disabled={isReadOnly} onChange={() => setScores(p => ({ ...p, [item.id]: val }))} style={{ display: 'none' }} />
                                                                    <div style={{
                                                                        textAlign: 'center',
                                                                        padding: '0.5rem 0.2rem',
                                                                        border: `2px solid ${selected ? SCALE_COLORS[val - 1] : 'rgba(45,34,28,0.15)'}`,
                                                                        borderRadius: '8px',
                                                                        background: selected ? SCALE_COLORS[val - 1] : '#fff',
                                                                        color: selected ? '#fff' : 'rgba(45,34,28,0.45)',
                                                                        transition: 'all 0.12s',
                                                                        userSelect: 'none',
                                                                    }}>
                                                                        <div style={{ fontSize: '1rem', fontWeight: 'bold', lineHeight: 1.1 }}>{val}</div>
                                                                        <div style={{ fontSize: '0.65rem', marginTop: '2px', lineHeight: 1 }}>{SCALE_LABELS[val - 1]}</div>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}

                                {/* Deep Dive */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', borderBottom: '2px solid rgba(45,34,28,0.1)', paddingBottom: '0.5rem' }}>🔍 深度面試評估</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        {DEEP_DIVE.map(q => (
                                            <div key={q.id} style={{ background: '#fff', border: '1px solid rgba(45,34,28,0.1)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-structural)', marginBottom: '0.5rem' }}>{q.label}</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                    {q.options.map(opt => {
                                                        const sel = displayCheckboxes[q.id] === opt;
                                                        return (
                                                            <label key={opt} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                                                                <input type="radio" name={`cb_${q.id}`} value={opt} checked={sel} disabled={isReadOnly} onChange={() => setCheckboxes(p => ({ ...p, [q.id]: opt }))} style={{ display: 'none' }} />
                                                                <span style={{
                                                                    display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem',
                                                                    border: `1.5px solid ${sel ? 'var(--color-primary)' : 'rgba(45,34,28,0.18)'}`,
                                                                    background: sel ? 'rgba(228,179,89,0.18)' : 'transparent',
                                                                    color: sel ? 'var(--color-structural)' : 'rgba(45,34,28,0.5)',
                                                                    fontWeight: sel ? 'bold' : 'normal',
                                                                    transition: 'all 0.12s',
                                                                }}>
                                                                    {opt}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Strengths / Weaknesses */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    {[
                                        { key: 'str', label: '✅ 候選人優點', value: displayStrengths, set: setStrengths, placeholder: '亮點、核心優勢...' },
                                        { key: 'wk', label: '⚠️ 候選人缺點', value: displayWeaknesses, set: setWeaknesses, placeholder: '待改進、潛在風險...' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-structural)', marginBottom: '0.4rem' }}>{f.label}</label>
                                            <textarea
                                                value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} disabled={isReadOnly}
                                                style={{ width: '100%', minHeight: '90px', padding: '0.7rem', border: '1px solid rgba(45,34,28,0.18)', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit', background: isReadOnly ? 'transparent' : '#fff', boxSizing: 'border-box', outline: 'none' }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Notes */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-structural)', marginBottom: '0.5rem' }}>📝 補充備注（可複選）</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {NOTES.map((note, i) => {
                                            const chk = displayNotes.includes(i);
                                            return (
                                                <label key={i} style={{ cursor: isReadOnly ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.9rem', border: `1.5px solid ${chk ? 'var(--color-structural)' : 'rgba(45,34,28,0.18)'}`, borderRadius: '20px', background: chk ? 'rgba(45,34,28,0.07)' : (isReadOnly ? 'transparent' : '#fff'), fontSize: '0.82rem', transition: 'all 0.12s' }}>
                                                    <input type="checkbox" checked={chk} disabled={isReadOnly} onChange={() => setSelectedNotes(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])} style={{ display: 'none' }} />
                                                    {chk && <Check size={11} color="var(--color-structural)" />}
                                                    {note}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Save */}
                                {!isReadOnly ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '2px solid rgba(45,34,28,0.08)' }}>
                                            {saveMsg && <span style={{ fontSize: '0.88rem', color: saveMsg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{saveMsg}</span>}
                                            <button
                                                onClick={handleSave} disabled={saving}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem', background: saving ? 'rgba(45,34,28,0.2)' : 'var(--color-structural)', color: saving ? 'rgba(45,34,28,0.5)' : '#ffffff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 'bold', borderRadius: '8px', transition: 'all 0.2s' }}
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                儲存我的評分
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(45,34,28,0.05)', borderRadius: '8px', textAlign: 'center', color: 'rgba(45,34,28,0.5)', fontSize: '0.88rem', fontWeight: 'bold' }}>
                                        🔴 目前為唯讀模式（正在查看 {activeView?.evaluator_name} 的評分表）
                                        <button
                                            onClick={() => setViewingRecordId(null)}
                                            style={{ display: 'block', margin: '0.6rem auto 0', padding: '0.4rem 1.2rem', background: '#fff', border: '1px solid rgba(45,34,28,0.2)', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-structural)' }}
                                        >
                                            返回我的評分表
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ─ Right: Score Summary ─ */}
                            <div style={{ borderLeft: '1px solid rgba(45,34,28,0.12)', background: 'rgba(255,255,255,0.6)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', maxHeight: '82vh' }}>

                                {/* Selected total */}
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-tech)', color: 'rgba(45,34,28,0.45)', marginBottom: '0.6rem', letterSpacing: '0.5px' }}>
                                        {isReadOnly ? `// ${activeView.evaluator_name} 的評分` : '// 我的評分'}
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: '#fff', border: '1px solid rgba(45,34,28,0.1)', borderRadius: '10px', marginBottom: '0.75rem' }}>
                                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-structural)', fontFamily: 'var(--font-tech)', lineHeight: 1 }}>{totalScore}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'rgba(45,34,28,0.4)' }}>/ {maxScore} 分</div>
                                        {totalScore > 0 && (() => {
                                            const b = getResultBadge(totalScore);
                                            return <div style={{ marginTop: '0.5rem', display: 'inline-block', padding: '4px 14px', background: b.bg, color: b.color, borderRadius: '12px', fontSize: '0.82rem', fontWeight: 'bold', border: `1px solid ${b.border}` }}>{b.label}</div>;
                                        })()}
                                    </div>

                                    {/* Category bars */}
                                    {CATEGORIES.map(cat => {
                                        const cs = getCatScore(cat);
                                        const cm = cat.items.length * 5;
                                        const pct = cm > 0 ? (cs / cm) * 100 : 0;
                                        return (
                                            <div key={cat.label} style={{ marginBottom: '0.55rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(45,34,28,0.55)', marginBottom: '0.2rem' }}>
                                                    <span>{cat.label}</span><span style={{ fontFamily: 'var(--font-tech)' }}>{cs}/{cm}</span>
                                                </div>
                                                <div style={{ height: '6px', background: 'rgba(45,34,28,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: '3px', transition: 'width 0.3s' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* All evaluators */}
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-tech)', color: 'rgba(45,34,28,0.45)', marginBottom: '0.6rem', letterSpacing: '0.5px' }}>// 所有評分員</div>
                                    {loadingAll ? (
                                        <div style={{ textAlign: 'center', color: 'rgba(45,34,28,0.35)', fontSize: '0.82rem' }}><Loader2 size={14} className="animate-spin" style={{ display: 'inline' }} /></div>
                                    ) : allScores.length === 0 ? (
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(45,34,28,0.35)', textAlign: 'center' }}>尚無評分記錄</div>
                                    ) : allScores.map(ev => {
                                        const b = getResultBadge(ev.total_score);
                                        const isViewing = viewingRecordId ? ev.id === viewingRecordId : ev.isMine;
                                        return (
                                            <div
                                                key={ev.id}
                                                onClick={() => setViewingRecordId(ev.isMine ? null : ev.id)}
                                                style={{ cursor: 'pointer', background: isViewing ? 'rgba(228,179,89,0.12)' : '#fff', border: `1px solid ${isViewing ? 'rgba(228,179,89,0.6)' : 'rgba(45,34,28,0.1)'}`, borderRadius: '8px', padding: '0.75rem', marginBottom: '0.6rem', transition: 'all 0.2s' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 'bold', flexShrink: 0 }}>
                                                        {(ev.evaluator_name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>{ev.evaluator_name}{ev.isMine && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: '4px' }}>(我)</span>}</span>
                                                    <span style={{ fontFamily: 'var(--font-tech)', fontWeight: 'bold', color: 'var(--color-structural)' }}>{ev.total_score}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'rgba(45,34,28,0.38)' }}>{formatShortDateTime(ev.updated_at)}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '1px 7px', borderRadius: '8px', background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontWeight: 'bold' }}>{b.label}</span>
                                                </div>
                                                {isViewing && !ev.isMine && <div style={{ fontSize: '0.68rem', color: 'var(--color-primary)', marginTop: '0.4rem', fontWeight: 'bold', textAlign: 'right' }}>👁️ 查看中</div>}
                                            </div>
                                        );
                                    })}

                                    {/* Team average */}
                                    {allScores.length > 1 && (() => {
                                        const avg = Math.round(allScores.reduce((s, r) => s + r.total_score, 0) / allScores.length);
                                        const b = getResultBadge(avg);
                                        return (
                                            <div style={{ borderTop: '1px solid rgba(45,34,28,0.1)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-structural)' }}>團隊平均</span>
                                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                    <span style={{ fontFamily: 'var(--font-tech)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-structural)' }}>{avg}</span>
                                                    <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '8px', background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontWeight: 'bold' }}>{b.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default InterviewScoreForm;
