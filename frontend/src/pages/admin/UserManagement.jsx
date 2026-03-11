import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Loader2, ShieldAlert, X, ShieldCheck, Lock } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

// ── 權限矩陣定義 ──────────────────────────────────────────────────────────────
const PERMISSION_MATRIX = [
    {
        category: '💼 職缺與題庫',
        items: [
            { code: 'view_jobs',         icon: '👁️', label: '檢視職缺設定',   desc: '可瀏覽職缺清單及題庫內容' },
            { code: 'manage_jobs',       icon: '✏️', label: '管理職缺與流程', desc: '可新增、編輯、刪除職缺及甄試流程' },
            { code: 'manage_questions',  icon: '✏️', label: '管理應徵題庫',   desc: '可新增、編輯、刪除應徵問卷題目' },
        ]
    },
    {
        category: '📄 履歷與甄試',
        items: [
            { code: 'view_resumes',   icon: '👁️', label: '檢視所有履歷',  desc: '可瀏覽所有求職者資料與 AI 報告' },
            { code: 'edit_resumes',   icon: '✏️', label: '編輯/評鑑甄試', desc: '可填寫面試評分表與留下評語' },
            { code: 'change_status',  icon: '✏️', label: '履歷狀態異動',  desc: '可拖拉改變求職者的甄試流程階段' },
            { code: 'delete_resumes', icon: '🗑️', label: '移除求職者',    desc: '可停用或移除求職者資料' },
            { code: 'export_data',    icon: '📊', label: '匯出甄試資料',  desc: '可匯出求職者資料為 CSV 檔案' },
        ]
    },
    {
        category: '⚙️ 系統帳號設定',
        items: [
            { code: 'view_system',  icon: '👁️', label: '檢視人員日誌',  desc: '可查閱人員清單與系統操作日誌' },
            { code: 'manage_tags',  icon: '✏️', label: '管理標籤系統',  desc: '可新增、修改、刪除共用標籤' },
            { code: 'manage_users', icon: '🔑', label: '系統人員授權',  desc: '可新增帳號及設定他人的權限 (最高層)' },
        ]
    }
];

const ALL_PERMISSIONS = PERMISSION_MATRIX.flatMap(g => g.items.map(i => i.code));

const permissionStyle = {
    view_jobs:        { bg: 'rgba(14,165,233,0.1)', color: '#0284c7' },
    manage_jobs:      { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
    manage_questions: { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
    view_resumes:     { bg: 'rgba(14,165,233,0.1)', color: '#0284c7' },
    edit_resumes:     { bg: 'rgba(245,158,11,0.1)', color: '#b45309' },
    change_status:    { bg: 'rgba(245,158,11,0.1)', color: '#b45309' },
    delete_resumes:   { bg: 'rgba(224,49,49,0.1)',  color: '#dc2626' },
    export_data:      { bg: 'rgba(14,165,233,0.1)', color: '#0284c7' },
    view_system:      { bg: 'rgba(139,92,246,0.1)', color: '#7c3aed' },
    manage_tags:      { bg: 'rgba(139,92,246,0.1)', color: '#7c3aed' },
    manage_users:     { bg: 'rgba(220,38,38,0.15)', color: '#dc2626' },
};

const PermLabel = ({ code }) => {
    const item = PERMISSION_MATRIX.flatMap(g => g.items).find(i => i.code === code);
    if (!item) return null;
    const s = permissionStyle[code] || { bg: 'rgba(0,0,0,0.05)', color: '#333' };
    return (
        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '600', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
            {item.icon} {item.label}
        </span>
    );
};

// ── 主元件 ────────────────────────────────────────────────────────────────────
const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const defaultForm = { id: null, username: '', password: '', permissions: [] };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${apiUrl}/admin/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleOpenModal = (userToEdit = null) => {
        if (userToEdit) {
            setFormData({ id: userToEdit.id, username: userToEdit.username, password: '', permissions: userToEdit.permissions || [] });
        } else {
            setFormData(defaultForm);
        }
        setError('');
        setIsModalOpen(true);
    };

    const togglePermission = (code) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(code)
                ? prev.permissions.filter(p => p !== code)
                : [...prev.permissions, code]
        }));
    };

    const toggleAllInGroup = (groupCodes) => {
        const allSelected = groupCodes.every(c => formData.permissions.includes(c));
        setFormData(prev => ({
            ...prev,
            permissions: allSelected
                ? prev.permissions.filter(p => !groupCodes.includes(p))
                : [...new Set([...prev.permissions, ...groupCodes])]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const method = formData.id ? 'PUT' : 'POST';
            const url = formData.id ? `${apiUrl}/admin/users/${formData.id}` : `${apiUrl}/admin/users`;

            const payload = { username: formData.username, permissions: formData.permissions, role: 'user' };
            if (formData.password) payload.password = formData.password;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '操作失敗');

            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('確定要停用此帳號嗎？帳號將被停用並從清單隱藏，但歷史記錄會保留。')) return;
        try {
            const response = await fetch(`${apiUrl}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '停用帳號失敗');
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const isSuperAdmin = user?.role === 'superadmin';
    const callerPerms = (() => {
        try { return JSON.parse(localStorage.getItem('adminUser') || '{}').permissions || []; } catch { return []; }
    })();
    const canManageUsers = isSuperAdmin || callerPerms.includes('manage_users');

    if (loading) return <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)', fontFamily: 'var(--font-tech)', fontSize: '1.2rem', justifyContent: 'center' }}><Loader2 className="animate-spin" /> 載入使用者資料中...</div>;

    return (
        <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-structural)', paddingBottom: '1rem' }}>
                <div>
                    <h1 className="step-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>系統人員權限管理</h1>
                    <p className="step-desc" style={{ margin: 0 }}>管理各帳號的功能存取權限 · 超級管理員帳號恆全開</p>
                </div>
                {canManageUsers && (
                    <button className="btn-wizard-next" onClick={() => handleOpenModal()} style={{ padding: '0.8rem 1.5rem', margin: 0, width: 'auto', fontSize: '1rem' }}>
                        <Plus size={20} /> 新增使用者
                    </button>
                )}
            </div>

            <div className="wizard-content" style={{ minHeight: 'auto', padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-structural)', background: 'rgba(255,255,255,0.2)' }}>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px', width: '18%' }}>帳號</th>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>已授予的權限</th>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px', width: '16%' }}>建立時間</th>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px', textAlign: 'right', width: '10%' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-structural)', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div style={{ fontWeight: '700', color: 'var(--color-structural)', fontSize: '1rem' }}>{u.username}</div>
                                        {u.role === 'superadmin' && (
                                            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '600', background: 'rgba(139,92,246,0.15)', color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <ShieldAlert size={12} /> 超級管理員
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        {u.role === 'superadmin' ? (
                                            <span style={{ fontSize: '0.85rem', color: '#7c3aed', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ShieldCheck size={16} /> 所有功能完整存取 (不可修改)
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {(u.permissions || []).length === 0 ? (
                                                    <span style={{ color: 'rgba(24,24,27,0.4)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <Lock size={14} /> 尚未授予任何權限
                                                    </span>
                                                ) : (
                                                    (u.permissions || []).map(code => <PermLabel key={code} code={code} />)
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem', color: 'rgba(24,24,27,0.7)', fontFamily: 'var(--font-tech)', fontSize: '0.85rem' }}>
                                        {formatDateTime(u.created_at)}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem', textAlign: 'right' }}>
                                        {u.role !== 'superadmin' && canManageUsers && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button className="btn-secondary" onClick={() => handleOpenModal(u)} style={{ padding: '0.5rem', width: 'auto' }} title="編輯權限">
                                                    <Edit2 size={16} />
                                                </button>
                                                {u.id !== user?.id && (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        style={{ background: 'transparent', border: '1px solid var(--color-error)', padding: '0.5rem', borderRadius: '0', cursor: 'pointer', color: 'var(--color-error)', transition: 'all 0.2s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-error)'; e.currentTarget.style.color = 'white'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-error)'; }}
                                                        title="停用帳號"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: 'rgba(24,24,27,0.5)', fontFamily: 'var(--font-tech)' }}>[NO_DATA] 找不到使用者資料</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '1.5rem 2rem', background: 'var(--color-structural)', color: 'white', fontFamily: 'var(--font-tech)', fontSize: '0.9rem', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ opacity: 0.5 }}>DIANBOPOPO RECRUITMENT SYSTEM // PERMISSIONS v3.0</span>
                    <span>共 {users.length} 名使用者</span>
                </div>
            </div>

            {/* Permission Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="wizard-content" style={{ maxWidth: '680px', width: '100%', maxHeight: '92vh', overflowY: 'auto', minHeight: 'auto', padding: '2.5rem', position: 'relative' }}>

                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-structural)', padding: '0.5rem' }}>
                            <X size={24} />
                        </button>

                        <h3 className="step-title" style={{ fontSize: '1.8rem', marginTop: 0 }}>
                            {formData.id ? '編輯帳號權限' : '新增使用者'}
                        </h3>
                        <p className="step-desc" style={{ marginBottom: '2rem' }}>
                            {formData.id ? `正在設定 [${formData.username}] 的功能存取權限` : '建立帳號並分配功能存取'}
                        </p>

                        {error && (
                            <div style={{ background: 'rgba(224, 49, 49, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '1rem', marginBottom: '1.5rem', fontFamily: 'var(--font-tech)', fontSize: '0.9rem', textAlign: 'center' }}>
                                [ERROR] {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label required">使用者帳號</label>
                                    <input type="text" className="form-input" value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        disabled={formData.id !== null} required style={{ marginBottom: 0 }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className={formData.id ? "form-label" : "form-label required"}>
                                        {formData.id ? '新密碼 (若不修改留空)' : '登入密碼'}
                                    </label>
                                    <input type="password" className="form-input" value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!formData.id} placeholder={!formData.id ? "至少 6 個字元" : ""}
                                        style={{ marginBottom: 0 }} />
                                </div>
                            </div>

                            {/* 權限矩陣 */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: 'var(--color-structural)', letterSpacing: '0.05em' }}>
                                        功能存取權限設定
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, permissions: ALL_PERMISSIONS }))}
                                            style={{ fontSize: '0.78rem', padding: '4px 10px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent', cursor: 'pointer', borderRadius: '4px' }}>
                                            全選
                                        </button>
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                                            style={{ fontSize: '0.78rem', padding: '4px 10px', border: '1px solid rgba(0,0,0,0.2)', color: 'rgba(0,0,0,0.5)', background: 'transparent', cursor: 'pointer', borderRadius: '4px' }}>
                                            全清
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {PERMISSION_MATRIX.map(group => {
                                        const groupCodes = group.items.map(i => i.code);
                                        const allGroupSelected = groupCodes.every(c => formData.permissions.includes(c));
                                        return (
                                            <div key={group.category} style={{ border: '1px solid var(--border-structural)', borderRadius: '8px', overflow: 'hidden' }}>
                                                <div style={{ padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-structural)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>
                                                        {group.category}
                                                    </span>
                                                    <button type="button" onClick={() => toggleAllInGroup(groupCodes)}
                                                        style={{ fontSize: '0.75rem', padding: '2px 8px', border: `1px solid ${allGroupSelected ? 'rgba(0,0,0,0.2)' : 'var(--color-primary)'}`, color: allGroupSelected ? 'rgba(0,0,0,0.4)' : 'var(--color-primary)', background: 'transparent', cursor: 'pointer', borderRadius: '4px' }}>
                                                        {allGroupSelected ? '取消全選' : '全選此類'}
                                                    </button>
                                                </div>
                                                <div style={{ padding: '0.5rem' }}>
                                                    {group.items.map(item => {
                                                        const checked = formData.permissions.includes(item.code);
                                                        return (
                                                            <label key={item.code}
                                                                style={{
                                                                    display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '0.65rem 0.8rem', cursor: 'pointer', borderRadius: '6px',
                                                                    background: checked ? permissionStyle[item.code]?.bg || 'rgba(0,0,0,0.04)' : 'transparent',
                                                                    transition: 'background 0.15s'
                                                                }}>
                                                                <input type="checkbox" checked={checked} onChange={() => togglePermission(item.code)}
                                                                    style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0, accentColor: permissionStyle[item.code]?.color || 'var(--color-primary)' }} />
                                                                <div>
                                                                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: checked ? permissionStyle[item.code]?.color || 'inherit' : 'var(--color-structural)' }}>
                                                                        {item.icon} {item.label}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.78rem', color: 'rgba(24,24,27,0.55)', marginTop: '2px' }}>
                                                                        {item.desc}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ marginTop: '0.8rem', padding: '0.7rem 1rem', background: 'rgba(139,92,246,0.06)', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'rgba(24,24,27,0.6)' }}>
                                    💡 已勾選 <strong>{formData.permissions.length}</strong> / {ALL_PERMISSIONS.length} 項權限。未勾選的功能按鈕在介面上將自動隱藏或無法點擊。
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-structural)', paddingTop: '1.2rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>取消</button>
                                <button type="submit" className="btn-wizard-next" disabled={submitting} style={{ padding: '0.8rem 1.5rem', margin: 0, width: 'auto' }}>
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : '儲存設定'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
