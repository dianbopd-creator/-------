import React, { useState, useEffect } from 'react';
import { Search, Filter, UserCircle, Briefcase, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

const ResumeManagement = () => {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    const [candidates, setCandidates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [jobFilter, setJobFilter] = useState('ALL');
    const [selectedTagFilters, setSelectedTagFilters] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const [candRes, catRes, tagRes] = await Promise.all([
                fetch(`${apiUrl}/admin/candidates`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
                fetch(`${apiUrl}/categories`, { cache: 'no-store' }),
                fetch(`${apiUrl}/admin/tags`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
            ]);
            if (!candRes.ok) throw new Error('無法載入履歷資料');
            const candData = await candRes.json();

            let catData = { data: [] };
            if (catRes.ok) catData = await catRes.json();

            let tData = { data: [] };
            if (tagRes && tagRes.ok) tData = await tagRes.json();

            setCandidates(candData.data || []);
            setCategories(catData.data || []);
            setAllTags(tData.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCandidate = async (e, candidateId, candidateName) => {
        e.stopPropagation();
        if (!window.confirm(`確定要刪除「${candidateName}」的所有資料嗎？\n此操作無法復原，問答、評分、AI 報告等資料都將一併刪除。`)) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${apiUrl}/admin/candidates/${candidateId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) { const j = await res.json(); throw new Error(j.error || '刪除失敗'); }
            setCandidates(prev => prev.filter(c => c.id !== candidateId));
        } catch (err) {
            alert('錯誤：' + err.message);
        }
    };

    const getJobName = (categoryId) => {
        if (!categoryId) return '未指派職缺';
        const cat = categories.find(c => c.id === categoryId);
        return cat ? `${cat.department} - ${cat.position}` : '未知職缺';
    };

    const filteredCandidates = candidates.filter(c => {
        const matchSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm);
        const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
        const matchJob = jobFilter === 'ALL' || (c.job_category_id ? c.job_category_id.toString() === jobFilter : jobFilter === 'UNASSIGNED');

        let matchTags = true;
        if (selectedTagFilters.length > 0) {
            matchTags = selectedTagFilters.every(tId => c.tags && c.tags.some(ct => ct.id === tId));
        }

        return matchSearch && matchStatus && matchJob && matchTags;
    });

    const getAvailableStatuses = () => {
        if (jobFilter === 'ALL' || jobFilter === 'UNASSIGNED') {
            const allStages = categories.flatMap(c => {
                try {
                    const stages = Array.isArray(c.stages) ? c.stages : JSON.parse(c.stages || '[]');
                    return stages.flatMap(phase => (typeof phase === 'string' ? [phase] : (phase.stages || [])));
                } catch { return []; }
            });
            return [...new Set([...allStages, '待處理', '不適任', '婉拒'])];
        } else {
            const cat = categories.find(c => c.id.toString() === jobFilter);
            if (!cat) return ['待處理', '不適任', '婉拒'];
            try {
                const stages = Array.isArray(cat.stages) ? cat.stages : JSON.parse(cat.stages || '[]');
                const catStages = stages.flatMap(phase => (typeof phase === 'string' ? [phase] : (phase.stages || [])));
                return [...new Set([...catStages, '待處理', '不適任', '婉拒'])];
            } catch {
                return ['待處理', '不適任', '婉拒'];
            }
        }
    };

    const uniqueStatuses = getAvailableStatuses();

    const toggleTagFilter = (tagId) => {
        setSelectedTagFilters(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(45,34,28,0.5)' }}>Loading Candidates...</div>;

    return (
        <div style={{ padding: '3rem', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid rgba(45, 34, 28, 0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div>
                    <h1 className="step-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>履歷總管</h1>
                    <p className="step-desc" style={{ margin: 0 }}>管理所有求職者的履歷資料與應徵紀錄。</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(45,34,28,0.4)' }} />
                        <input
                            type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            placeholder="搜尋姓名、Email、或電話..." className="form-input" style={{ paddingLeft: '2.5rem', margin: 0 }}
                        />
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: isFilterOpen ? 'var(--color-primary)' : 'var(--bg-card)', color: isFilterOpen ? '#fff' : 'var(--color-structural)', border: '1px solid var(--border-structural)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                    >
                        <Filter size={18} /> 進階篩選 {selectedTagFilters.length > 0 || statusFilter !== 'ALL' || jobFilter !== 'ALL' ? '(已啟用)' : ''}
                    </button>
                </div>

                {isFilterOpen && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-structural)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'rgba(45,34,28,0.6)', marginBottom: '0.4rem' }}>應徵職缺</label>
                                <select className="form-input" style={{ margin: 0, width: '100%' }} value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
                                    <option value="ALL">所有職缺</option>
                                    <option value="UNASSIGNED">未指派職缺</option>
                                    {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.department} - {cat.position}</option>))}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'rgba(45,34,28,0.6)', marginBottom: '0.4rem' }}>流程狀態</label>
                                <select className="form-input" style={{ margin: 0, width: '100%' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="ALL">所有狀態</option>
                                    {uniqueStatuses.map(status => (<option key={status} value={status}>{status}</option>))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'rgba(45,34,28,0.6)', marginBottom: '0.6rem' }}>標籤篩選 (需同時符合)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {allTags.length === 0 && <span style={{ fontSize: '0.85rem', color: 'rgba(45,34,28,0.4)', fontStyle: 'italic' }}>目前系統中無標籤</span>}
                                {allTags.map(tag => {
                                    const isSelected = selectedTagFilters.includes(tag.id);
                                    return (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleTagFilter(tag.id)}
                                            style={{
                                                padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
                                                border: `1px solid ${isSelected ? tag.color : 'rgba(45,34,28,0.15)'}`,
                                                background: isSelected ? tag.color : 'transparent',
                                                color: isSelected ? '#fff' : 'rgba(45,34,28,0.6)',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {tag.name}
                                        </button>
                                    );
                                })}
                                {selectedTagFilters.length > 0 && (
                                    <button onClick={() => setSelectedTagFilters([])} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 8px', textDecoration: 'underline' }}>清除標籤過濾</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '1rem' }}>
                {error && <div style={{ color: 'var(--color-error)', background: 'rgba(224, 49, 49, 0.1)', padding: '1rem', borderRadius: '4px' }}>{error}</div>}

                {filteredCandidates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(45,34,28,0.4)', background: 'var(--bg-card)', borderRadius: '8px' }}>
                        找不到符合條件的履歷。
                    </div>
                ) : (
                    filteredCandidates.map(candidate => {
                        let resultScores = null;
                        try { resultScores = candidate.result_scores ? JSON.parse(candidate.result_scores) : null; } catch (e) { }
                        const hasTests = !!resultScores;

                        return (
                            <div key={candidate.id}
                                onClick={() => navigate(`/admin/candidates/${candidate.id}`)}
                                style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border-structural)', borderRadius: '12px',
                                    padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(14, 165, 233, 0.12)'; e.currentTarget.style.borderColor = 'var(--color-accent-blue)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--border-structural)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(30, 58, 138, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                        {candidate.name?.charAt(0) || <UserCircle size={28} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>{candidate.name}</h3>
                                            <span style={{ background: 'rgba(45,34,28,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'rgba(45,34,28,0.7)', fontWeight: 'bold' }}>
                                                {candidate.status || 'Pending'}
                                            </span>
                                            {candidate.tags && candidate.tags.map(t => (
                                                <span key={t.id} style={{ fontSize: '0.72rem', background: t.color + '20', color: t.color, padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', border: `1px solid ${t.color}40` }}>
                                                    {t.name}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'rgba(45,34,28,0.6)', fontSize: '0.85rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> {getJobName(candidate.job_category_id)}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {formatDate(candidate.created_at)}</span>
                                            {hasTests && <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>✨ 測驗已完成</span>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button
                                        onClick={(e) => handleDeleteCandidate(e, candidate.id, candidate.name)}
                                        title="刪除此履歷"
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '6px', background: 'rgba(220,38,38,0.05)', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.12)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.5)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.05)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'; }}
                                    >
                                        <Trash2 size={14} /> 刪除
                                    </button>
                                    <div style={{ color: 'var(--color-primary)' }}>
                                        <ChevronRight size={24} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ResumeManagement;
