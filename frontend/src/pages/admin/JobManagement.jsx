import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Save, X, Briefcase, MapPin, DollarSign, Clock, Users, Building, FileText, CheckCircle, Library, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const JobManagement = () => {
    const { user } = useAuth();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const defaultFormData = {
        department: '',
        position: '',
        stages: [
            { name: '新進履歷', stages: ['待處理'] },
            { name: '初篩階段', stages: ['初篩合格'] },
            { name: '面試階段', stages: ['邀約面試', '已面試'] },
            { name: '錄取作業', stages: ['錄用作業中', '已報到', '未報到', '未錄取'] }
        ],
        details: {
            jobCategory: '',
            jobType: '全職', // 全職, 兼職, 實習
            location: '',
            salary: '',
            workingHours: '',
            vacationPolicy: '週休二日',
            dateToStart: '不限',
            headcount: '1',
            description: '',
            requirements: '',
            contactInfo: ''
        }
    };
    const [formData, setFormData] = useState(defaultFormData);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Question Assignment State
    const [allQuestions, setAllQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

    const fetchAllQuestions = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/admin/questions`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
            if (res.ok) {
                const json = await res.json();
                setAllQuestions(json.data || []);
            }
        } catch { }
    }, [apiUrl]);

    const fetchJobQuestions = useCallback(async (jobId) => {
        try {
            const res = await fetch(`${apiUrl}/admin/jobs/${jobId}/questions`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
            if (res.ok) {
                const json = await res.json();
                setSelectedQuestionIds((json.data || []).map(q => q.id));
            }
        } catch { }
    }, [apiUrl]);

    useEffect(() => {
        fetchCategories();
        fetchAllQuestions();
    }, [fetchAllQuestions]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${apiUrl}/categories`, { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to fetch jobs');
            const data = await response.json();
            setCategories(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (job = null) => {
        if (job) {
            setEditingId(job.id);
            setFormData({
                department: job.department || '',
                position: job.position || '',
                stages: job.stages && job.stages.length > 0 ? job.stages : defaultFormData.stages,
                details: {
                    ...defaultFormData.details,
                    ...(job.details || {})
                }
            });
            fetchJobQuestions(job.id);
        } else {
            setEditingId(null);
            setFormData(defaultFormData);
            setSelectedQuestionIds([]);
        }
        setIsModalOpen(true);
    };

    const handleDetailChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            details: { ...prev.details, [field]: value }
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const url = editingId ? `${apiUrl}/admin/job-categories/${editingId}` : `${apiUrl}/admin/job-categories`;
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '儲存失敗');
            }

            // Save question assignments if editing an existing job
            const savedId = editingId || (await response.json().catch(() => null))?.id;
            if (savedId || editingId) {
                const jobId = editingId;
                if (jobId) {
                    await fetch(`${apiUrl}/admin/jobs/${jobId}/questions`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                        body: JSON.stringify({ question_ids: selectedQuestionIds })
                    });
                }
            }

            setIsModalOpen(false);
            fetchCategories();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此職缺嗎？若該職缺下有求職者將無法刪除。')) return;
        try {
            const response = await fetch(`${apiUrl}/admin/job-categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '刪除失敗');
            }
            fetchCategories();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(45,34,28,0.5)' }}>Loading Jobs...</div>;

    return (
        <div style={{ padding: '3rem', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-structural)', paddingBottom: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div>
                    <h1 className="step-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>職缺管理中心</h1>
                    <p className="step-desc" style={{ margin: 0 }}>管理對外招募的職缺需求設定與詳細招募條件。</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-wizard-next" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', marginBottom: '0', fontSize: '0.95rem' }}>
                    <Plus size={18} /> 新增職缺
                </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '1rem' }}>
                {error && <div style={{ color: 'var(--color-error)', background: 'rgba(224, 49, 49, 0.1)', padding: '1rem', borderRadius: '4px' }}>{error}</div>}

                {categories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(45,34,28,0.4)', background: 'var(--bg-card)', borderRadius: '8px' }}>
                        尚未建立任何職缺，請點擊右上角新增。
                    </div>
                ) : (
                    categories.map(job => (
                        <div key={job.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-structural)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>{job.position}</h3>
                                    <span style={{ background: '#EAF6F6', color: 'var(--color-accent-mint)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        {job.department}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', color: 'rgba(24,24,27,0.6)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> {job.details?.jobType || '全職'}</span>
                                    {job.details?.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {job.details.location}</span>}
                                    {job.details?.salary && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} /> {job.details.salary}</span>}
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> 需求 {job.details?.headcount || '1'} 人</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem', paddingLeft: '2rem' }}>
                                <button onClick={() => handleOpenModal(job)} className="btn-secondary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Edit size={16} /> 編輯
                                </button>
                                <button onClick={() => handleDelete(job.id)} style={{ background: 'transparent', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,49,49,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(9, 27, 49, 0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '860px', maxHeight: '92vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(9,27,49,0.2)', border: '1px solid rgba(15,23,42,0.06)' }}>

                        {/* Modal Header */}
                        <div style={{ padding: '1.75rem 2.5rem', borderBottom: '1px solid var(--border-structural)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: '0 0 0.2rem', fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-structural)' }}>{editingId ? '編輯職缺' : '新增職缺'}</h2>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-structural-light)' }}>填寫待招職缺的基本資訊與詳細條件</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(15,23,42,0.05)', border: 'none', cursor: 'pointer', color: 'var(--color-structural)', width: '36px', height: '36px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.05)'}><X size={18} /></button>
                        </div>

                        <div style={{ overflowY: 'auto', padding: '2rem 2.5rem', flex: 1 }}>
                            <form id="jobForm" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                {/* Basic Info */}
                                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.25rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label"><span style={{ color: '#ef4444' }}>*</span> 所屬部門</label>
                                        <input type="text" className="form-input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="例如: 業務部" required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label"><span style={{ color: '#ef4444' }}>*</span> 職務名稱 (職缺標題)</label>
                                        <input type="text" className="form-input" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="例如: 資深前端工程師" required />
                                    </div>
                                </div>

                                {/* Details Left Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                    <div>
                                        <label className="form-label">職務類別</label>
                                        <input type="text" className="form-input" value={formData.details.jobCategory} onChange={e => handleDetailChange('jobCategory', e.target.value)} placeholder="例如: 軟體工程師、行銷人員" />
                                    </div>
                                    <div>
                                        <label className="form-label">工作性質</label>
                                        <select className="form-input" value={formData.details.jobType} onChange={e => handleDetailChange('jobType', e.target.value)}>
                                            <option value="全職">全職</option>
                                            <option value="冈職">冈職</option>
                                            <option value="實習">實習</option>
                                            <option value="接案">接案</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">上班地點</label>
                                        <input type="text" className="form-input" value={formData.details.location} onChange={e => handleDetailChange('location', e.target.value)} placeholder="工作地點地址或區域" />
                                    </div>
                                    <div>
                                        <label className="form-label">薪資待遇</label>
                                        <input type="text" className="form-input" value={formData.details.salary} onChange={e => handleDetailChange('salary', e.target.value)} placeholder="例如: 月薪 40,000 ~ 60,000 元" />
                                    </div>
                                    <div>
                                        <label className="form-label">需求人數</label>
                                        <input type="text" className="form-input" value={formData.details.headcount} onChange={e => handleDetailChange('headcount', e.target.value)} placeholder="例如: 1 ~ 2 人" />
                                    </div>
                                </div>

                                {/* Details Right Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                    <div>
                                        <label className="form-label">上班時段</label>
                                        <input type="text" className="form-input" value={formData.details.workingHours} onChange={e => handleDetailChange('workingHours', e.target.value)} placeholder="例如: 白班 09:00~18:00" />
                                    </div>
                                    <div>
                                        <label className="form-label">休假制度</label>
                                        <input type="text" className="form-input" value={formData.details.vacationPolicy} onChange={e => handleDetailChange('vacationPolicy', e.target.value)} placeholder="例如: 週休二日" />
                                    </div>
                                    <div>
                                        <label className="form-label">可上班日</label>
                                        <input type="text" className="form-input" value={formData.details.dateToStart} onChange={e => handleDetailChange('dateToStart', e.target.value)} placeholder="例如: 一個月內、隨時" />
                                    </div>
                                    <div>
                                        <label className="form-label">聯絡資訊</label>
                                        <input type="text" className="form-input" value={formData.details.contactInfo} onChange={e => handleDetailChange('contactInfo', e.target.value)} placeholder="聯絡人姓名與信筱" />
                                    </div>
                                </div>

                                {/* Textareas */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">職務說明書 (Job Description)</label>
                                    <textarea className="form-input" rows={4} value={formData.details.description} onChange={e => handleDetailChange('description', e.target.value)} placeholder="描述工作內容、日常職責等..." style={{ resize: 'vertical' }}></textarea>
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">條件要求 (Requirements)</label>
                                    <textarea className="form-input" rows={4} value={formData.details.requirements} onChange={e => handleDetailChange('requirements', e.target.value)} placeholder="描述技能需求、學經歷限制、語文條件等..." style={{ resize: 'vertical' }}></textarea>
                                </div>

                                {/* Question Assignment Section */}
                                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                        <Library size={16} color="var(--color-primary)" />
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-structural)' }}>指派面試題目</h3>
                                        <span style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.4)', marginLeft: '4px' }}>（從題庫選取此職缺專屬題目）</span>
                                    </div>
                                    {allQuestions.length === 0 ? (
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.4)', padding: '1rem', background: 'rgba(15,23,42,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                                            題庫尚無題目，請先至「題庫中心」新增題目。
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
                                            {allQuestions.map(q => {
                                                const isSelected = selectedQuestionIds.includes(q.id);
                                                return (
                                                    <div key={q.id} onClick={() => setSelectedQuestionIds(prev => isSelected ? prev.filter(id => id !== q.id) : [...prev, q.id])}
                                                        style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '0.6rem 0.8rem', borderRadius: '8px', border: `1px solid ${isSelected ? 'var(--color-primary)' : 'rgba(15,23,42,0.08)'}`, background: isSelected ? 'rgba(30,58,138,0.05)' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                        {isSelected ? <CheckSquare size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} /> : <Square size={16} color="rgba(15,23,42,0.25)" style={{ flexShrink: 0, marginTop: '2px' }} />}
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-structural)', lineHeight: '1.4' }}>{q.question_text}</div>
                                                            <div style={{ fontSize: '0.72rem', color: 'rgba(15,23,42,0.4)', marginTop: '2px' }}>{q.category}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {selectedQuestionIds.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600' }}>已選取 {selectedQuestionIds.length} 道題目</div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '1.25rem 2.5rem', borderTop: '1px solid var(--border-structural)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '0 0 20px 20px' }}>
                            <p style={{ margin: 0, color: 'var(--color-structural-light)', fontSize: '0.82rem' }}>* 簽試流程預設為標準模板，可至「簽試」看板的行內編輯器修改流程階段。</p>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border-structural)', color: 'var(--color-structural)', padding: '0.65rem 1.5rem', borderRadius: '9999px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>取消</button>
                                <button type="submit" form="jobForm" disabled={submitLoading} className="btn-wizard btn-wizard-next" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
                                    <Save size={16} /> {submitLoading ? '儲存中...' : '儲存職缺'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobManagement;
