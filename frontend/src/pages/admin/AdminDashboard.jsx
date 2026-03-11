import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Loader2, Eye, GripVertical, FileSpreadsheet, Plus, Edit, Trash2, Save, X, Library, CheckSquare, Square } from 'lucide-react';
import { formatDate, daysSince, todayDateString } from '../../utils/dateUtils';
import { useCandidates, useCategories } from '../../hooks/useApi';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { candidates, isLoading: cLoading, isError: cError, mutateCandidates } = useCandidates();
    const { categories, isLoading: catLoading, mutateCategories } = useCategories();

    const loading = cLoading || catLoading;
    const error = cError ? cError.message : null;

    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [isEditingStages, setIsEditingStages] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Job Category Management State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ department: '', position: '', stages: [] });

    // JD + Question Assignment State (merged from JobManagement)
    const [jobDetails, setJobDetails] = useState({ description: '', requirements: '', location: '', salary: '', headcount: '1' });
    const [allQuestions, setAllQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
    const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
    const [modalTab, setModalTab] = useState('stages'); // 'stages' | 'jd' | 'questions'
    const [qFilter, setQFilter] = useState(''); // category filter in 指派題目 tab

    // Hiring flow phases — matches real-world process after pre-screening
    const FIXED_PHASES = ['邀約面試', '現場面談', '確認意願', '錄取作業'];

    const parseStages = (stagesData) => {
        if (!stagesData || !stagesData.length) {
            return [
                { name: '邀約面試', stages: ['已邀約', '待確認時間'] },
                { name: '現場面談', stages: ['面試中', '已面試'] },
                { name: '確認意願', stages: ['求職者確認意願', '已回覆'] },
                { name: '錄取作業', stages: ['發錄取通知', '等待報到', '已報到', '未錄取'] }
            ];
        }
        if (typeof stagesData[0] === 'string') {
            const bucketSize = Math.ceil(stagesData.length / 4) || 1;
            return [
                { name: '邀約面試', stages: stagesData.slice(0, bucketSize) },
                { name: '現場面談', stages: stagesData.slice(bucketSize, bucketSize * 2) },
                { name: '確認意願', stages: stagesData.slice(bucketSize * 2, bucketSize * 3) },
                { name: '錄取作業', stages: stagesData.slice(bucketSize * 3) }
            ];
        }
        return stagesData;
    };

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';



    const handleDragStart = (e, candidateId) => {
        e.dataTransfer.setData('text/plain', candidateId.toString());
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetStage) => {
        e.preventDefault();
        const candidateId = e.dataTransfer.getData('text/plain');

        if (!candidateId || !targetStage) return;

        const updatedCandidates = candidates.map(c =>
            c.id.toString() === candidateId ? { ...c, status: targetStage, job_category_id: selectedCategoryId ? parseInt(selectedCategoryId, 10) : c.job_category_id } : c
        );
        mutateCandidates(updatedCandidates, false);

        try {
            const bodyPayload = { status: targetStage };
            if (selectedCategoryId) {
                bodyPayload.job_category_id = parseInt(selectedCategoryId, 10);
            }

            const response = await fetch(`${apiUrl}/admin/candidates/${candidateId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(bodyPayload)
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            mutateCandidates(); // Hard sync with DB
        } catch (err) {
            mutateCandidates();
            alert(err.message);
        }
    };

    const handlePendingPoolDrop = async (e) => {
        e.preventDefault();
        const candidateId = e.dataTransfer.getData('text/plain');
        if (!candidateId) return;

        const updatedCandidates = candidates.map(c =>
            c.id.toString() === candidateId ? { ...c, status: '待處理', job_category_id: null } : c
        );
        mutateCandidates(updatedCandidates, false);

        try {
            const bodyPayload = { status: '待處理', job_category_id: null };
            const response = await fetch(`${apiUrl}/admin/candidates/${candidateId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(bodyPayload)
            });

            if (!response.ok) {
                throw new Error('Failed to revert status');
            }
            mutateCandidates();
        } catch (err) {
            mutateCandidates();
            alert(err.message);
        }
    };

    const handleExportCSV = () => {
        if (!candidates.length) return alert('目前沒有資料可匯出');

        let targetCandidates = candidates;
        if (selectedCategoryId) {
            targetCandidates = candidates.filter(c => c.job_category_id?.toString() === selectedCategoryId);
        }

        const headers = ['姓名', '聯絡電話', '應徵職缺', '狀態', '申請日期'];
        const csvContent = [
            headers.join(','),
            ...targetCandidates.map(c => [
                `"${c.name}"`,
                `"${c.phone || ''}"`,
                `"${c.department || ''} - ${c.position || ''}"`,
                `"${c.status || '待處理'}"`,
                `"${new Date(c.created_at).toLocaleDateString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `candidates_export_${todayDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchAllQuestions = async () => {
        try {
            const res = await fetch(`${apiUrl}/admin/questions`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
            if (res.ok) { const j = await res.json(); setAllQuestions(j.data || []); }
        } catch { }
    };

    const fetchJobQuestions = async (jobId) => {
        try {
            const res = await fetch(`${apiUrl}/admin/jobs/${jobId}/questions`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
            if (res.ok) { const j = await res.json(); setSelectedQuestionIds((j.data || []).map(q => q.id)); }
        } catch { }
    };

    const handleOpenCategoryModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat.id);
            const catDetails = cat.details ? (typeof cat.details === 'string' ? JSON.parse(cat.details) : cat.details) : {};
            setFormData({ department: cat.department, position: cat.position, stages: parseStages(cat.stages) });
            setJobDetails({ description: catDetails.description || '', requirements: catDetails.requirements || '', location: catDetails.location || '', salary: catDetails.salary || '', headcount: catDetails.headcount || '1' });
            setSelectedQuestionIds([]);
            fetchJobQuestions(cat.id);
            fetchAllQuestions();
            setIsEditingStages(true);
            setSelectedCategoryId(cat.id.toString());
        } else {
            setEditingCategory(null);
            setFormData({ department: '', position: '', stages: parseStages([]) });
            setIsCategoryModalOpen(true); // Only open modal for NEW categories
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCategory ? `${apiUrl}/admin/job-categories/${editingCategory}` : `${apiUrl}/admin/job-categories`;
            const method = editingCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            setIsCategoryModalOpen(false);
            setIsEditingStages(false);
            mutateCategories();
            mutateCandidates();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('確定要刪除此職缺分類嗎？若該分類下有求職者將無法刪除。')) return;
        try {
            const response = await fetch(`${apiUrl}/admin/job-categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            if (selectedCategoryId === id.toString()) setSelectedCategoryId('');
            mutateCategories();
            mutateCandidates();
        } catch (err) {
            alert(err.message);
        }
    };

    const updateStageName = (phaseIndex, stageIndex, newName) => {
        const newPhases = [...formData.stages];
        newPhases[phaseIndex].stages[stageIndex] = newName;
        setFormData({ ...formData, stages: newPhases });
    };

    const addStage = (phaseIndex) => {
        const newPhases = [...formData.stages];
        newPhases[phaseIndex].stages.push('新流程狀態');
        setFormData({ ...formData, stages: newPhases });
    };

    const removeStage = (phaseIndex, stageIndex) => {
        const newPhases = [...formData.stages];
        newPhases[phaseIndex].stages.splice(stageIndex, 1);
        setFormData({ ...formData, stages: newPhases });
    };

    const handleStageEditorDragStart = (e, phaseIndex, stageIndex) => {
        e.dataTransfer.setData('sourcePhaseIndex', phaseIndex.toString());
        e.dataTransfer.setData('sourceStageIndex', stageIndex.toString());
    };

    const handleStageEditorDrop = (e, targetPhaseIndex, targetStageIndex) => {
        e.preventDefault();
        const sourcePhaseIndex = parseInt(e.dataTransfer.getData('sourcePhaseIndex'), 10);
        const sourceStageIndex = parseInt(e.dataTransfer.getData('sourceStageIndex'), 10);

        if (isNaN(sourcePhaseIndex) || isNaN(sourceStageIndex)) return;

        const newPhases = [...formData.stages];
        const [movedStage] = newPhases[sourcePhaseIndex].stages.splice(sourceStageIndex, 1);

        // If targetStageIndex is undefined, just append to the phase
        if (targetStageIndex === undefined) {
            newPhases[targetPhaseIndex].stages.push(movedStage);
        } else {
            newPhases[targetPhaseIndex].stages.splice(targetStageIndex, 0, movedStage);
        }

        setFormData({ ...formData, stages: newPhases });
    };

    if (loading) return <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)', fontFamily: 'var(--font-tech)', fontSize: '1.2rem', justifyContent: 'center' }}><Loader2 className="animate-spin" /> 讀取系統資料中...</div>;

    const selectedCategory = categories.find(c => c.id.toString() === selectedCategoryId);
    const categoryCandidates = candidates.filter(c => {
        const isMatchCategory = selectedCategoryId ? (c.job_category_id?.toString() === selectedCategoryId) : true;
        const isMatchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        return isMatchCategory && isMatchSearch;
    });

    // Save inline stages
    const handleSaveStages = async () => {
        if (!selectedCategory) return;
        try {
            const url = `${apiUrl}/admin/job-categories/${selectedCategory.id}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: JSON.stringify({
                    department: formData.department,
                    position: formData.position,
                    stages: formData.stages,
                    details: jobDetails
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Save question assignments
            const qRes = await fetch(`${apiUrl}/admin/jobs/${selectedCategory.id}/questions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: JSON.stringify({ question_ids: selectedQuestionIds })
            });
            if (!qRes.ok) {
                const qData = await qRes.json();
                throw new Error(`無法儲存指派題目: ${qData.error || '未知的錯誤'}`);
            }

            setIsEditingStages(false);
            mutateCategories();
            mutateCandidates();
        } catch (err) {
            alert(err.message);
        }
    };

    const renderKanban = () => {
        if (!selectedCategory) return null;
        const parsedPhases = parseStages(selectedCategory.stages);

        return (
            <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0, overflowX: 'auto', paddingBottom: '1rem' }}>
                {parsedPhases.map((phase, phaseIndex) => (
                    phase.stages.map((stage, stageIndex) => {
                        const allStagesFlat = parsedPhases.flatMap(p => p.stages);
                        const stageCandidates = categoryCandidates.filter(c => c.status === stage || (!c.status && allStagesFlat.indexOf(stage) === 0));

                        return (
                            <div key={`${phaseIndex}-${stageIndex}`} className="kanban-sub-stage-col"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage)}
                                style={{ background: phaseIndex === 0 ? '#EAF6F6' : phaseIndex === 1 ? '#EAF6DF' : phaseIndex === 2 ? '#FCF6E3' : '#E8F4F8', padding: '1rem', borderRadius: '8px' }}
                            >
                                <div style={{ marginBottom: '0.8rem' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'rgba(24,24,27,0.45)', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{phase.name}</div>
                                    <div className="kanban-sub-stage-header" style={{ marginBottom: '0.6rem', borderBottom: '2px solid rgba(15,23,42,0.08)', paddingBottom: '0.4rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-structural)' }}>{stage}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-structural-light)', background: '#eff3f8', padding: '2px 8px', borderRadius: '9999px' }}>{stageCandidates.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', flex: 1, minHeight: '80px', paddingRight: '4px' }}>
                                    {stageCandidates.length === 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60px', fontSize: '0.8rem', color: 'rgba(24,24,27,0.35)', fontStyle: 'italic' }}>
                                            此階段目前為空
                                        </div>
                                    ) : (
                                        stageCandidates.map(candidate => (
                                            <div key={candidate.id} draggable onDragStart={(e) => handleDragStart(e, candidate.id)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => { e.stopPropagation(); handleDrop(e, stage); }}
                                                style={{
                                                    background: 'white', padding: '1rem', borderRadius: '10px',
                                                    border: '1px solid rgba(15,23,42,0.08)', cursor: 'grab',
                                                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(9, 27, 49, 0.1)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)'; }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--color-structural)' }}>
                                                            {candidate.name}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/admin/candidates/${candidate.id}`)}
                                                        style={{ background: 'rgba(15, 23, 42, 0.05)', border: 'none', cursor: 'pointer', color: 'var(--color-structural)', padding: '5px', borderRadius: '6px' }}
                                                        title="查看資料"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--color-structural-light)', fontFamily: 'var(--font-tech)' }}>
                                                    {candidate.department || '未指定部門'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })
                ))}
            </div>
        );
    };

    // Show candidates in the pending pool if they have no kanban stage assigned yet.
    // A candidate is "pending" if:
    //   (a) they have no job_category_id assigned, OR
    //   (b) their status is not one of the kanban stages of their category
    // The form submission result statuses: 'pending', 'completed', '待處理', '新進履歷', ''
    const KANBAN_STAGE_STATUSES = categories.flatMap(c => {
        try {
            const stages = Array.isArray(c.stages) ? c.stages : JSON.parse(c.stages || '[]');
            return stages.flatMap(phase => (typeof phase === 'string' ? [phase] : (phase.stages || [])));
        } catch { return []; }
    });

    const pendingCandidates = candidates.filter(c => {
        const status = (c.status || '').toLowerCase();
        const hasNoCategory = !c.job_category_id;
        const isInKanban = KANBAN_STAGE_STATUSES.includes(c.status);
        const isMatchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        // Show in pending pool: has no category assigned, OR is not yet in any kanban stage
        return (hasNoCategory || !isInKanban) && isMatchSearch;
    });

    const renderPendingPool = () => {
        return (
            <div
                style={{ width: '380px', flexShrink: 0, borderRight: '1px solid var(--border-structural)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}
                onDragOver={handleDragOver}
                onDrop={handlePendingPoolDrop}
            >
                <div style={{ padding: '1rem', borderBottom: '2px solid var(--border-structural)', background: '#F8FAFC', borderRadius: '12px 12px 0 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="kanban-stage-title" style={{ margin: 0 }}>待處理 / 未分配 ({pendingCandidates.length})</h3>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-error)' }} />
                    </div>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'rgba(24,24,27,0.6)' }}>請將未分配的履歷拖拉至右側流程，或反向拖拉回這裡取消分配。</p>
                </div>
                <div className="kanban-list" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                    {pendingCandidates.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'rgba(24,24,27,0.4)', padding: '2rem 1rem', fontSize: '0.9rem' }}>目前無新進未分配的履歷</div>
                    ) : pendingCandidates.map(candidate => (
                        <div key={candidate.id} draggable onDragStart={(e) => handleDragStart(e, candidate.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => { e.stopPropagation(); handlePendingPoolDrop(e); }}
                            style={{
                                background: 'white', padding: '1rem', borderRadius: '8px', cursor: 'grab', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                border: '1px solid var(--border-structural)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)', transition: 'all 0.2s', position: 'relative'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(236, 72, 153, 0.12)'; e.currentTarget.style.borderColor = 'var(--color-accent-magenta)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)'; e.currentTarget.style.borderColor = 'var(--border-structural)'; }}
                        >
                            <GripVertical size={16} style={{ position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(24,24,27,0.2)', opacity: 0 }} className="drag-handle" />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--color-structural)' }}>
                                        {candidate.name}
                                    </div>
                                </div>
                                <button onClick={() => navigate(`/admin/candidates/${candidate.id}`)} style={{ background: 'rgba(30, 58, 138, 0.1)', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }} title="查看資料">
                                    <Eye size={14} />
                                </button>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(24,24,27,0.6)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{formatDate(candidate.created_at)}</span>
                                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>未分配</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '3rem', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-structural)', paddingBottom: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div>
                    <h1 className="step-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>甄試管理</h1>
                    <p className="step-desc" style={{ margin: 0 }}>歡迎回來，{user?.username}。在這裡管理所有的職缺與候選人流程。</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-structural)', opacity: 0.5 }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="搜尋求職者姓名..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '3rem', width: '220px', marginBottom: 0, paddingBottom: '0.6rem', paddingTop: '0.6rem' }}
                        />
                    </div>
                    <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.9rem' }}>
                        <FileSpreadsheet size={18} /> 匯出清單
                    </button>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <button onClick={() => handleOpenCategoryModal()} style={{ background: 'var(--color-structural)', color: 'white', border: 'none', padding: '0.65rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                            <Plus size={18} /> 新增職缺
                        </button>
                    )}
                </div>
            </div>

            {/* View Selector (Categories Tabs) */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', flexShrink: 0 }}>
                {categories.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <button
                            onClick={() => setSelectedCategoryId(c.id.toString())}
                            style={{
                                padding: '0.6rem 2.5rem 0.6rem 1.2rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                                background: selectedCategoryId === c.id.toString() ? 'var(--color-structural)' : 'var(--bg-card)',
                                color: selectedCategoryId === c.id.toString() ? 'white' : 'var(--color-structural)',
                                border: selectedCategoryId === c.id.toString() ? '1px solid var(--color-structural)' : '1px solid rgba(24,24,27,0.2)'
                            }}
                        >
                            {c.department} - {c.position}
                        </button>
                        {(user?.role === 'admin' || user?.role === 'superadmin') && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleOpenCategoryModal(c); }}
                                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: selectedCategoryId === c.id.toString() ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.4)', cursor: 'pointer', padding: '4px' }}
                                title="編輯分類"
                            >
                                <Edit size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Analytics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div style={{ padding: '1.2rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-structural)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', color: 'rgba(24,24,27,0.6)', fontSize: '0.9rem', fontWeight: 'bold' }}>當前檢視名單人數</div>
                    <div style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-structural)', fontSize: '1.8rem', fontWeight: 'bold' }}>{categoryCandidates.length}</div>
                </div>
                <div style={{ padding: '1.2rem 1.5rem', background: 'rgba(30, 58, 138, 0.1)', border: '1px solid rgba(30, 58, 138, 0.4)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>近期新進 (7天內)</div>
                    <div style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-primary)', fontSize: '1.8rem', fontWeight: 'bold' }}>
                        {categoryCandidates.filter(c => daysSince(c.created_at) <= 7).length}
                    </div>
                </div>
            </div>

            {error ? (
                <div style={{ background: 'rgba(224, 49, 49, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '1.5rem', fontFamily: 'var(--font-tech)', fontSize: '1rem' }}>
                    [SYSTEM_ERROR] 無法載入資料: {error}
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '1.5rem' }}>
                    {renderPendingPool()}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {selectedCategoryId === '' ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border-structural)', borderRadius: '4px' }}>
                                <div style={{ textAlign: 'center', color: 'rgba(24,24,27,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <FileSpreadsheet size={48} />
                                    <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>請選擇上方職缺以檢視甄試流程看板</div>
                                    <div style={{ fontSize: '0.9rem' }}>您可以直接將左側的履歷拖拉至特定職缺流程中</div>
                                </div>
                            </div>
                        ) : renderKanban()}
                    </div>
                </div>
            )}

            {/* ══ STAGE EDITOR — FULL-SCREEN MODAL ══ */}
            {isEditingStages && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,27,49,0.55)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '2rem' }}
                    onClick={e => { if (e.target === e.currentTarget) { setIsEditingStages(false); setModalTab('stages'); } }}>
                    <div style={{ background: '#f8fafc', borderRadius: '20px', width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(9,27,49,0.25)' }}>

                        {/* Modal Header */}
                        <div style={{ padding: '1.25rem 2rem', background: '#fff', borderBottom: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(15,23,42,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-tech)', marginBottom: '0.2rem' }}>甄試看板 / 編輯流程</div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>
                                    {formData.department} — {formData.position || '新增職缺'}
                                </h2>
                            </div>
                            <button onClick={() => { setIsEditingStages(false); setModalTab('stages'); }} style={{ background: 'rgba(15,23,42,0.06)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-structural)', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.12)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.06)'}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Department / Position row (always visible) */}
                        <div style={{ padding: '1rem 2rem', background: '#fff', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexShrink: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(15,23,42,0.45)', letterSpacing: '0.04em' }}>部門名稱</label>
                                <input type="text" className="form-input" value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="業務部" style={{ margin: 0, fontWeight: '600' }} required />
                            </div>
                            <span style={{ color: 'rgba(15,23,42,0.25)', fontSize: '1.5rem', lineHeight: '2.4rem' }}>–</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '2 1 200px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(15,23,42,0.45)', letterSpacing: '0.04em' }}>職缺名稱</label>
                                <input type="text" className="form-input" value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="業務助理" style={{ margin: 0, fontWeight: '600' }} required />
                            </div>
                        </div>

                        {/* Tab Bar */}
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(15,23,42,0.08)', background: '#fff', flexShrink: 0 }}>
                            {[
                                { key: 'stages', label: '流程階段' },
                                { key: 'jd', label: '職位資訊 (JD)' },
                                { key: 'questions', label: `指派題目${selectedQuestionIds.length > 0 ? ` (${selectedQuestionIds.length})` : ''}` },
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setModalTab(tab.key)}
                                    style={{
                                        padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: modalTab === tab.key ? '700' : '500',
                                        color: modalTab === tab.key ? 'var(--color-primary)' : 'rgba(15,23,42,0.5)',
                                        background: 'transparent',
                                        borderBottom: modalTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                                        transition: 'all 0.15s',
                                    }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab: 流程階段 */}
                        {modalTab === 'stages' && (
                            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                {formData.stages.map((phase, pIndex) => {
                                    const pastelBg = pIndex === 0 ? '#EAF6F6' : pIndex === 1 ? '#EAF6DF' : pIndex === 2 ? '#FCF6E3' : '#E8F4F8';
                                    const accentColor = pIndex === 0 ? '#0d9488' : pIndex === 1 ? '#65a30d' : pIndex === 2 ? '#ca8a04' : '#0369a1';
                                    return (
                                        <div key={pIndex}
                                            style={{ background: pastelBg, borderRadius: '12px', minWidth: '200px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={e => { if (e.target === e.currentTarget || e.currentTarget.contains(e.target)) handleStageEditorDrop(e, pIndex); }}>
                                            <div style={{ padding: '0.9rem 1rem', fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '0.95rem', color: accentColor, borderBottom: `2px solid ${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                                                <span>{phase.name}</span>
                                                <span style={{ fontSize: '0.75rem', background: `${accentColor}18`, color: accentColor, borderRadius: '9999px', padding: '2px 10px', fontFamily: 'var(--font-tech)' }}>{phase.stages.length} 個</span>
                                            </div>
                                            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflowY: 'auto', minHeight: '120px' }}>
                                                {phase.stages.map((stage, sIndex) => (
                                                    <div key={sIndex}
                                                        draggable
                                                        onDragStart={e => handleStageEditorDragStart(e, pIndex, sIndex)}
                                                        onDragOver={e => e.preventDefault()}
                                                        onDrop={e => { e.stopPropagation(); handleStageEditorDrop(e, pIndex, sIndex); }}
                                                        style={{ background: 'white', borderRadius: '10px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'grab' }}
                                                        className="stage-editor-pill">
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                                                        <input type="text"
                                                            style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-structural)', minWidth: 0 }}
                                                            value={stage}
                                                            onChange={e => updateStageName(pIndex, sIndex, e.target.value)}
                                                            placeholder="流程名稱" />
                                                        <button type="button" onClick={() => removeStage(pIndex, sIndex)}
                                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px', opacity: 0.4, flexShrink: 0, transition: 'opacity 0.15s' }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addStage(pIndex)}
                                                    style={{ background: 'transparent', border: `1.5px dashed ${accentColor}50`, color: accentColor, borderRadius: '10px', padding: '0.55rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = `${accentColor}10`}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <Plus size={15} /> 新增子流程
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tab: 職位資訊 (JD) */}
                        {modalTab === 'jd' && (
                            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(15,23,42,0.5)', display: 'block', marginBottom: '4px' }}>上班地點</label>
                                            <input type="text" className="form-input" value={jobDetails.location} onChange={e => setJobDetails(p => ({ ...p, location: e.target.value }))} placeholder="例如: 台北市信義區" style={{ margin: 0 }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(15,23,42,0.5)', display: 'block', marginBottom: '4px' }}>薪資待遇</label>
                                            <input type="text" className="form-input" value={jobDetails.salary} onChange={e => setJobDetails(p => ({ ...p, salary: e.target.value }))} placeholder="例如: 月薪 40K+" style={{ margin: 0 }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(15,23,42,0.5)', display: 'block', marginBottom: '4px' }}>職務說明 (JD)</label>
                                        <textarea className="form-input" rows={5} value={jobDetails.description} onChange={e => setJobDetails(p => ({ ...p, description: e.target.value }))} placeholder="描述工作內容、日常職責..." style={{ resize: 'vertical', margin: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(15,23,42,0.5)', display: 'block', marginBottom: '4px' }}>條件要求</label>
                                        <textarea className="form-input" rows={4} value={jobDetails.requirements} onChange={e => setJobDetails(p => ({ ...p, requirements: e.target.value }))} placeholder="技能需求、學歷、語文條件等..." style={{ resize: 'vertical', margin: 0 }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: 指派題目 */}
                        {modalTab === 'questions' && (() => {
                            const allCats = [...new Set(allQuestions.map(q => q.category || '通用'))];
                            const visible = qFilter ? allQuestions.filter(q => (q.category || '通用') === qFilter) : allQuestions;
                            const visibleIds = visible.map(q => q.id);
                            const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedQuestionIds.includes(id));

                            const handleDragStart = (e, index) => {
                                setDraggedQuestionIndex(index);
                                e.dataTransfer.effectAllowed = 'move';
                            };

                            const handleDragOver = (e, index) => {
                                e.preventDefault();
                                if (draggedQuestionIndex === null || draggedQuestionIndex === index) return;

                                const newIds = [...selectedQuestionIds];
                                const draggedId = newIds[draggedQuestionIndex];
                                newIds.splice(draggedQuestionIndex, 1);
                                newIds.splice(index, 0, draggedId);

                                setSelectedQuestionIds(newIds);
                                setDraggedQuestionIndex(index);
                            };

                            const handleDragEnd = () => {
                                setDraggedQuestionIndex(null);
                            };

                            return (
                                <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
                                    {/* Toolbar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        <button onClick={() => {
                                            if (allVisibleSelected) {
                                                setSelectedQuestionIds(prev => prev.filter(id => !visibleIds.includes(id)));
                                            } else {
                                                // Append new ones to the end
                                                setSelectedQuestionIds(prev => [...new Set([...prev, ...visibleIds])]);
                                            }
                                        }} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: '1.5px solid var(--color-primary)', background: allVisibleSelected ? 'var(--color-primary)' : 'transparent', color: allVisibleSelected ? '#fff' : 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
                                            {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                            {allVisibleSelected ? '取消全選' : '全選'}
                                            {qFilter && ` (${qFilter})`}
                                        </button>
                                        <div style={{ width: '1px', height: '20px', background: 'rgba(15,23,42,0.12)' }} />
                                        <button onClick={() => setQFilter('')} style={{ padding: '0.35rem 0.8rem', borderRadius: '999px', border: `1.5px solid ${!qFilter ? 'var(--color-primary)' : 'rgba(15,23,42,0.15)'}`, background: !qFilter ? 'rgba(30,58,138,0.06)' : 'transparent', color: !qFilter ? 'var(--color-primary)' : 'rgba(15,23,42,0.5)', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' }}>全部</button>
                                        {allCats.map(cat => (
                                            <button key={cat} onClick={() => setQFilter(cat === qFilter ? '' : cat)} style={{ padding: '0.35rem 0.8rem', borderRadius: '999px', border: `1.5px solid ${qFilter === cat ? 'var(--color-primary)' : 'rgba(15,23,42,0.15)'}`, background: qFilter === cat ? 'rgba(30,58,138,0.06)' : 'transparent', color: qFilter === cat ? 'var(--color-primary)' : 'rgba(15,23,42,0.5)', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' }}>{cat}</button>
                                        ))}
                                        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'rgba(15,23,42,0.4)' }}>{selectedQuestionIds.length}/{allQuestions.length} 已選</span>
                                    </div>
                                    {allQuestions.length === 0 ? (
                                        <div style={{ padding: '2rem', background: 'rgba(15,23,42,0.03)', borderRadius: '12px', textAlign: 'center', color: 'rgba(15,23,42,0.4)' }}>題庫尚無題目，請先至「題庫中心」新增題目。</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                            {/* Selected & Ordered Questions */}
                                            {selectedQuestionIds.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-structural)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        已選題目 (上下拖曳排序)
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {selectedQuestionIds.map((id, index) => {
                                                            const q = allQuestions.find(aq => aq.id === id);
                                                            if (!q) return null;
                                                            return (
                                                                <div
                                                                    key={`sel-${id}`}
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                                    onDragOver={(e) => handleDragOver(e, index)}
                                                                    onDragEnd={handleDragEnd}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1rem',
                                                                        borderRadius: '8px', border: '1.5px solid var(--color-primary)',
                                                                        background: 'rgba(30,58,138,0.04)', cursor: 'grab',
                                                                        opacity: draggedQuestionIndex === index ? 0.5 : 1
                                                                    }}>
                                                                    <GripVertical size={16} color="rgba(15,23,42,0.25)" style={{ cursor: 'grab' }} />
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)', background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(30,58,138,0.2)' }}>{index + 1}</span>
                                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-structural)', lineHeight: '1.4' }}>{q.question_text}</div>
                                                                    </div>
                                                                    <button onClick={() => setSelectedQuestionIds(prev => prev.filter(pid => pid !== id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-error)' }}><X size={16} /></button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unselected Questions Pool */}
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'rgba(15,23,42,0.5)', marginBottom: '8px', borderTop: selectedQuestionIds.length > 0 ? '1px solid rgba(15,23,42,0.08)' : 'none', paddingTop: selectedQuestionIds.length > 0 ? '1rem' : '0' }}>
                                                    待選題庫
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {visible.filter(q => !selectedQuestionIds.includes(q.id)).map(q => {
                                                        return (
                                                            <div key={q.id} onClick={() => setSelectedQuestionIds(prev => [...prev, q.id])}
                                                                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '0.6rem 1rem', borderRadius: '8px', border: '1.5px solid rgba(15,23,42,0.08)', background: '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                                <Square size={16} color="rgba(15,23,42,0.25)" style={{ flexShrink: 0, marginTop: '1px' }} />
                                                                <div style={{ minWidth: 0 }}>
                                                                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'rgba(15,23,42,0.7)', lineHeight: '1.4' }}>{q.question_text}</div>
                                                                    <div style={{ fontSize: '0.72rem', color: 'rgba(15,23,42,0.4)', marginTop: '2px' }}>{q.category}{q.is_required ? ' · 必填' : ''}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Modal Footer */}
                        <div style={{ padding: '1.25rem 2rem', background: '#fff', borderTop: '1px solid rgba(15,23,42,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div>
                                {selectedCategoryId && (
                                    <button onClick={() => handleDeleteCategory(selectedCategoryId)}
                                        style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.2s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; }}>
                                        <Trash2 size={15} /> 刪除整個職缺
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={() => { setIsEditingStages(false); setModalTab('stages'); }} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>取消</button>
                                <button onClick={handleSaveStages} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                    <Save size={16} /> 儲存修改
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ NEW JOB CATEGORY MODAL ══ */}
            {isCategoryModalOpen && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal-content" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 className="step-title" style={{ fontSize: '1.5rem', margin: 0 }}>新增職缺</h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--color-structural)" /></button>
                        </div>

                        <form onSubmit={handleCategorySubmit}>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(24,24,27,0.6)', marginBottom: '1.5rem' }}>請建立職位名稱。建立後您可以在儀表板中即時自訂專屬的甄試流程狀態。</p>
                            <div className="grid-2">
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label required">部門 (Department)</label>
                                    <input
                                        type="text" className="form-input" required
                                        value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="例如：產品研發部"
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label required">職缺名稱 (Position)</label>
                                    <input
                                        type="text" className="form-input" required
                                        value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        placeholder="例如：前端工程師"
                                    />
                                </div>
                            </div>

                            {/* Stage Editor removed from Modal to be strictly inline-only per user requirements */}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                                <div>
                                    {editingCategory && (
                                        <button type="button" onClick={() => handleDeleteCategory(editingCategory)} style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Trash2 size={16} /> 刪除此職缺
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>取消</button>
                                    <button type="submit" className="btn-wizard-next" style={{ padding: '0.8rem 1.5rem', margin: 0 }}>
                                        <Save size={18} /> 儲存設定
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
