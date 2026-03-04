import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Save, X, BookOpen, Tag, AlignLeft, CheckSquare, Loader2, Search } from 'lucide-react';

const QUESTION_TYPES = [
    { value: 'text', label: '📝 簡答（文字輸入）' },
    { value: 'textarea', label: '📄 長文（多行輸入）' },
    { value: 'radio', label: '🔘 單選題' },
];

const QuestionBank = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [newCategoryInput, setNewCategoryInput] = useState('');

    // Modal state
    const [modal, setModal] = useState(null); // null | 'create' | { ...editing question }
    const [form, setForm] = useState({ question_text: '', question_type: 'textarea', category: '一般印象', is_required: true });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    const authHeaders = { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` };

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/admin/questions`, { headers: authHeaders });
            if (res.ok) {
                const json = await res.json();
                setQuestions(json.data || []);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    const openCreate = () => {
        const defaultCat = questions.length > 0 ? questions[0].category : '通用';
        setForm({ question_text: '', question_type: 'textarea', category: defaultCat, is_required: true });
        setModal('create');
    };

    const openEdit = (q) => {
        setForm({ question_text: q.question_text, question_type: q.question_type, category: q.category, is_required: q.is_required !== 0 });
        setModal(q);
    };

    const handleSave = async () => {
        if (!form.question_text.trim()) return alert('題目內容不可為空');
        setSaving(true);
        try {
            const isCreate = modal === 'create';
            const url = isCreate ? `${apiUrl}/admin/questions` : `${apiUrl}/admin/questions/${modal.id}`;
            const method = isCreate ? 'POST' : 'PUT';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify(form)
            });
            if (res.ok) { setModal(null); fetchQuestions(); }
            else { const j = await res.json(); alert(j.error || '儲存失敗'); }
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此題目？此操作無法還原，且會從所有職缺中移除此題。')) return;
        try {
            const res = await fetch(`${apiUrl}/admin/questions/${id}`, { method: 'DELETE', headers: authHeaders });
            if (res.ok) fetchQuestions();
            else alert('刪除失敗');
        } catch (err) { alert(err.message); }
    };

    const filtered = questions.filter(q => {
        const matchSearch = !search || q.question_text.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'ALL' || q.category === filterCategory;
        return matchSearch && matchCat;
    });

    // Derive unique categories dynamically from loaded questions
    const dynamicCategories = [...new Set(questions.map(q => q.category).filter(Boolean))];
    const allCategories = ['ALL', ...dynamicCategories];
    const typeLabel = (t) => QUESTION_TYPES.find(x => x.value === t)?.label || t;

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ borderBottom: '2px solid rgba(15,23,42,0.08)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="step-title" style={{ fontSize: '2rem', margin: 0 }}>📚 題庫中心</h1>
                    <p className="step-desc" style={{ margin: '0.5rem 0 0' }}>管理所有面試題目，並在「職缺管理」中為各職缺指派題目。</p>
                </div>
                <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }}>
                    <Plus size={18} /> 新增題目
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,23,42,0.4)' }} />
                    <input type="text" placeholder="搜尋題目..." value={search} onChange={e => setSearch(e.target.value)}
                        className="form-input" style={{ paddingLeft: '2.2rem', margin: 0, width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {allCategories.map(cat => (
                        <button key={cat} onClick={() => setFilterCategory(cat)} style={{
                            padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', transition: 'all 0.15s',
                            background: filterCategory === cat ? 'var(--color-primary)' : 'var(--bg-card)',
                            color: filterCategory === cat ? '#fff' : 'var(--color-structural)',
                            borderColor: filterCategory === cat ? 'var(--color-primary)' : 'var(--border-structural)',
                        }}>{cat === 'ALL' ? '所有分類' : cat}</button>
                    ))}
                </div>
            </div>

            {/* Summary bar */}
            <div style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)', fontFamily: 'var(--font-tech)' }}>
                共 {filtered.length} 道題目 {questions.length !== filtered.length ? `（已篩選）` : ''}
            </div>

            {/* Question List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', gap: '12px', color: 'var(--color-primary)' }}>
                    <Loader2 size={24} className="animate-spin" /> 載入題庫中...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'rgba(15,23,42,0.4)' }}>
                    <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <div>尚無題目，點擊「新增題目」開始建立題庫。</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map((q, i) => (
                        <div key={q.id} style={{
                            background: '#fff', border: '1px solid rgba(15,23,42,0.07)', borderRadius: '12px',
                            padding: '1.1rem 1.4rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                            transition: 'box-shadow 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)'}
                        >
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0, marginTop: '1px' }}>
                                {i + 1}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-structural)', lineHeight: '1.5', marginBottom: '0.4rem' }}>
                                    {q.question_text}
                                    {q.is_required ? <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#ef4444', fontWeight: '700' }}>*必填</span> : null}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(37,99,235,0.08)', color: '#2563eb', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>{q.category}</span>
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.04)', color: 'rgba(15,23,42,0.5)', padding: '2px 8px', borderRadius: '6px' }}>{typeLabel(q.question_type)}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button onClick={() => openEdit(q)} style={{ background: 'transparent', border: '1px solid var(--border-structural)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--color-structural)', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-structural)'; e.currentTarget.style.borderColor = 'var(--border-structural)'; }}>
                                    <Pencil size={15} />
                                </button>
                                <button onClick={() => handleDelete(q.id)} style={{ background: 'transparent', border: '1px solid var(--border-structural)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'rgba(15,23,42,0.4)', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(15,23,42,0.4)'; e.currentTarget.style.borderColor = 'var(--border-structural)'; }}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modal !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
                    <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(15,23,42,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                                {modal === 'create' ? '新增題目' : '編輯題目'}
                            </h2>
                            <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.4)', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {/* Question Text */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'rgba(15,23,42,0.6)', marginBottom: '0.5rem' }}>題目內容 <span style={{ color: '#ef4444' }}>*</span></label>
                                <textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })}
                                    className="form-input" rows={3} placeholder="輸入題目內容..."
                                    style={{ margin: 0, resize: 'vertical', minHeight: '80px', width: '100%' }} />
                            </div>

                            {/* Row: type + category */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'rgba(15,23,42,0.6)', marginBottom: '0.5rem' }}>題目類型</label>
                                    <select value={form.question_type} onChange={e => setForm({ ...form, question_type: e.target.value })} className="form-input" style={{ margin: 0, width: '100%' }}>
                                        {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'rgba(15,23,42,0.6)', marginBottom: '0.5rem' }}>分類</label>
                                    <select value={form.category} onChange={e => {
                                        if (e.target.value === '__new__') {
                                            const custom = window.prompt('輸入新分類名稱：');
                                            if (custom?.trim()) setForm({ ...form, category: custom.trim() });
                                        } else {
                                            setForm({ ...form, category: e.target.value });
                                        }
                                    }} className="form-input" style={{ margin: 0, width: '100%' }}>
                                        {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="__new__">＋ 新增分類...</option>
                                    </select>
                                </div>
                            </div>

                            {/* Required toggle */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                <input type="checkbox" checked={form.is_required} onChange={e => setForm({ ...form, is_required: e.target.checked })}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                                <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-structural)' }}>必填題目</span>
                                <span style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.4)' }}>（候選人不可跳過此題）</span>
                            </label>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '1rem 2rem', borderTop: '1px solid rgba(15,23,42,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={() => setModal(null)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-structural)', color: 'var(--color-structural)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>取消</button>
                            <button onClick={handleSave} disabled={saving || !form.question_text.trim()} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: saving || !form.question_text.trim() ? 0.6 : 1 }}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 储存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionBank;
