import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Loader2, X, Briefcase, ChevronRight, ChevronLeft } from 'lucide-react';

const JobCategories = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        department: '',
        position: '',
        stages: ['待處理', '面試中', '錄取', '婉拒'] // Default stages
    });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${apiUrl}/categories`); // Public GET is fine for listing, or we use admin specific one. Either way /categories is open
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenModal = (categoryToEdit = null) => {
        if (categoryToEdit) {
            setFormData({
                id: categoryToEdit.id,
                department: categoryToEdit.department,
                position: categoryToEdit.position,
                stages: [...categoryToEdit.stages]
            });
        } else {
            setFormData({
                id: null,
                department: '',
                position: '',
                stages: ['待處理', '初試', '複試', '錄取', '婉拒']
            });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleStageChange = (index, value) => {
        const newStages = [...formData.stages];
        newStages[index] = value;
        setFormData({ ...formData, stages: newStages });
    };

    const handleAddStage = () => {
        setFormData({ ...formData, stages: [...formData.stages, '自訂關卡'] });
    };

    const handleRemoveStage = (index) => {
        if (formData.stages.length <= 2) {
            alert('至少需要保留兩個關卡');
            return;
        }
        const newStages = formData.stages.filter((_, i) => i !== index);
        setFormData({ ...formData, stages: newStages });
    };

    const handleMoveStage = (index, direction) => {
        if (direction === -1 && index === 0) return;
        if (direction === 1 && index === formData.stages.length - 1) return;

        const newStages = [...formData.stages];
        const temp = newStages[index];
        newStages[index] = newStages[index + direction];
        newStages[index + direction] = temp;
        setFormData({ ...formData, stages: newStages });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (formData.stages.some(s => !s.trim())) {
            setError('關卡名稱不可為空');
            setSubmitting(false);
            return;
        }

        try {
            const method = formData.id ? 'PUT' : 'POST';
            const url = formData.id ? `${apiUrl}/admin/job-categories/${formData.id}` : `${apiUrl}/admin/job-categories`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '操作失敗');

            setIsModalOpen(false);
            fetchCategories();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此職缺分類嗎？如已有求職者投遞此職缺則無法刪除。')) return;

        try {
            const response = await fetch(`${apiUrl}/admin/job-categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '刪除失敗');
            fetchCategories();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)', fontFamily: 'var(--font-tech)', fontSize: '1.2rem', justifyContent: 'center' }}><Loader2 className="animate-spin" /> 載入資料中...</div>;

    // Only Admin or Superadmin can manage categories
    const canManageCategories = user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid rgba(51, 51, 56, 0.15)', paddingBottom: '1rem' }}>
                <div>
                    <h1 className="step-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>徵才職缺管理</h1>
                    <p className="step-desc" style={{ margin: 0 }}>管理對外開放的部門職缺及自訂各職缺的面試流程關卡 (Kanban Stages)</p>
                </div>
                {canManageCategories && (
                    <button
                        className="btn-wizard-next"
                        onClick={() => handleOpenModal()}
                        style={{ padding: '0.8rem 1.5rem', margin: 0, width: 'auto', fontSize: '1rem' }}
                    >
                        <Plus size={20} /> 新增職缺
                    </button>
                )}
            </div>

            <div className="wizard-content" style={{ minHeight: 'auto', padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-structural)', background: 'rgba(255,255,255,0.2)' }}>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>部門與職缺名稱</th>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>專屬面試流程關卡</th>
                                {canManageCategories && <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px', textAlign: 'right' }}>操作</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid rgba(51,51,56,0.1)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(30, 58, 138, 0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div style={{ fontWeight: '700', color: 'var(--color-structural)', fontSize: '1.2rem', marginBottom: '4px' }}>{c.position}</div>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-primary)', background: 'rgba(30, 58, 138, 0.1)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'var(--font-tech)' }}>
                                            <Briefcase size={14} /> {c.department}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                            {c.stages.map((stage, idx) => (
                                                <React.Fragment key={idx}>
                                                    <span style={{
                                                        background: 'var(--color-structural)', color: 'white', padding: '4px 12px',
                                                        borderRadius: '12px', fontSize: '0.85rem', fontFamily: 'var(--font-tech)', fontWeight: '600'
                                                    }}>
                                                        {stage}
                                                    </span>
                                                    {idx < c.stages.length - 1 && <ChevronRight size={16} color="var(--color-structural)" style={{ opacity: 0.5 }} />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </td>
                                    {canManageCategories && (
                                        <td style={{ padding: '1.2rem 2rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => handleOpenModal(c)}
                                                    style={{ padding: '0.5rem', width: 'auto' }}
                                                    title="編輯職缺與流程"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    style={{
                                                        background: 'transparent', border: '1px solid var(--color-error)', padding: '0.5rem', borderRadius: '0',
                                                        cursor: 'pointer', color: 'var(--color-error)', transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-error)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-error)'; }}
                                                    title="刪除職缺"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={canManageCategories ? "3" : "2"} style={{ padding: '4rem', textAlign: 'center', color: 'rgba(51,51,56,0.5)', fontFamily: 'var(--font-tech)' }}>[NO_DATA] 尚未建立任何職缺分類</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '1.5rem 2rem', background: 'var(--color-structural)', color: 'white', fontFamily: 'var(--font-tech)', fontSize: '0.9rem', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ opacity: 0.5 }}>DIANBOPOPO RECRUITMENT SYSTEM v2.0 // JOB CATEGORIES</span>
                    <span>共 {categories.length} 筆職缺資料</span>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && canManageCategories && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="wizard-content" style={{ maxWidth: '600px', width: '90%', minHeight: 'auto', padding: '2.5rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>

                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-structural)', padding: '0.5rem' }}
                            title="關閉"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="step-title" style={{ fontSize: '1.8rem', marginTop: 0 }}>
                            {formData.id ? '編輯職缺分類' : '新增職缺分類'}
                        </h3>
                        <p className="step-desc" style={{ marginBottom: '2rem' }}>
                            設定該職缺隸屬部門，並客製化求職者投遞此職缺後的面試流程長度與關卡名稱。
                        </p>

                        {error && (
                            <div style={{ background: 'rgba(224, 49, 49, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '1rem', marginBottom: '1.5rem', fontFamily: 'var(--font-tech)', fontSize: '0.9rem', textAlign: 'center' }}>
                                [ERROR] {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label required">所屬部門</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="例如：產品研發部"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label required">職缺名稱</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        placeholder="例如：資深前端工程師"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label required" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>專屬面試流程 (Kanban Stages)</span>
                                    <button type="button" onClick={handleAddStage} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-tech)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        <Plus size={14} /> 新增關卡
                                    </button>
                                </label>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(51,51,56,0.6)', margin: '0 0 1rem 0' }}>設定求職者在系統中的狀態流轉階段，至少需包含起頭(待處理)與結尾(錄取/婉拒)。</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {formData.stages.map((stage, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ background: 'var(--color-structural)', color: 'white', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-tech)', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>
                                                {idx + 1}
                                            </div>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={stage}
                                                onChange={e => handleStageChange(idx, e.target.value)}
                                                style={{ padding: '0.6rem 1rem', fontSize: '0.95rem' }}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleMoveStage(idx, -1)}
                                                disabled={idx === 0}
                                                style={{ background: 'transparent', border: '1px solid rgba(51,51,56,0.2)', padding: '0.5rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveStage(idx, 1)}
                                                disabled={idx === formData.stages.length - 1}
                                                style={{ background: 'transparent', border: '1px solid rgba(51,51,56,0.2)', padding: '0.5rem', cursor: idx === formData.stages.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === formData.stages.length - 1 ? 0.3 : 1 }}
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStage(idx)}
                                                style={{ background: 'transparent', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '0.5rem', cursor: 'pointer' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="btn-wizard-next"
                                    disabled={submitting}
                                    style={{ padding: '0.8rem 1.5rem', margin: 0, width: 'auto' }}
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : '儲存職缺設定'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobCategories;
