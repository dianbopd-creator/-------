import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Loader2, ShieldAlert, X } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, username: '', password: '', role: 'interviewer' });
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

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (userToEdit = null) => {
        if (userToEdit) {
            setFormData({ id: userToEdit.id, username: userToEdit.username, password: '', role: userToEdit.role });
        } else {
            setFormData({ id: null, username: '', password: '', role: 'interviewer' });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const method = formData.id ? 'PUT' : 'POST';
            const url = formData.id ? `${apiUrl}/admin/users/${formData.id}` : `${apiUrl}/admin/users`;

            const payload = { ...formData };
            if (formData.id && !payload.password) {
                delete payload.password; // Don't send empty password if not changing
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
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
        if (!window.confirm('確定要刪除此使用者嗎？此動作無法復原。')) return;

        try {
            const response = await fetch(`${apiUrl}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('刪除使用者失敗');
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)', fontFamily: 'var(--font-tech)', fontSize: '1.2rem', justifyContent: 'center' }}><Loader2 className="animate-spin" /> 載入使用者資料中...</div>;

    return (
        <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-structural)', paddingBottom: '1rem' }}>
                <div>
                    <h1 className="step-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>系統權限管理</h1>
                    <p className="step-desc" style={{ margin: 0 }}>管理管理員 (Admin) 與面試官 (Interviewer) 帳號</p>
                </div>
                <button
                    className="btn-wizard-next"
                    onClick={() => handleOpenModal()}
                    style={{ padding: '0.8rem 1.5rem', margin: 0, width: 'auto', fontSize: '1rem' }}
                >
                    <Plus size={20} /> 新增使用者
                </button>
            </div>

            <div className="wizard-content" style={{ minHeight: 'auto', padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-structural)', background: 'rgba(255,255,255,0.2)' }}>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>使用者帳號</th>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>身分權限</th>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>建立時間</th>
                                <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px', textAlign: 'right' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-structural)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontSize: '1.1rem' }}>{u.username}</td>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'var(--font-tech)',
                                            background: u.role === 'superadmin' ? 'rgba(139, 92, 246, 0.15)' : u.role === 'admin' ? 'rgba(224, 49, 49, 0.15)' : 'rgba(30, 58, 138, 0.15)',
                                            color: u.role === 'superadmin' ? '#8b5cf6' : u.role === 'admin' ? 'var(--color-error)' : 'var(--color-primary)',
                                            border: `1px solid ${u.role === 'superadmin' ? '#8b5cf6' : u.role === 'admin' ? 'var(--color-error)' : 'var(--color-primary)'}`,
                                            display: 'inline-flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            {(u.role === 'admin' || u.role === 'superadmin') && <ShieldAlert size={14} />}
                                            {u.role === 'superadmin' ? '超級管理員' : u.role === 'admin' ? '系統管理員' : '面試官'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem', color: 'rgba(24,24,27,0.7)', fontFamily: 'var(--font-tech)' }}>
                                        {formatDateTime(u.created_at)}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                            {(user?.role === 'superadmin' || (user?.role === 'admin' && u.role === 'interviewer')) && (
                                                <>
                                                    <button
                                                        className="btn-secondary"
                                                        onClick={() => handleOpenModal(u)}
                                                        style={{ padding: '0.5rem', width: 'auto' }}
                                                        title="編輯"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    {u.id !== user.id && (
                                                        <button
                                                            onClick={() => handleDelete(u.id)}
                                                            style={{
                                                                background: 'transparent', border: '1px solid var(--color-error)', padding: '0.5rem', borderRadius: '0',
                                                                cursor: 'pointer', color: 'var(--color-error)', transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-error)'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-error)'; }}
                                                            title="刪除"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
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
                    <span style={{ opacity: 0.5 }}>DIANBOPOPO RECRUITMENT SYSTEM v2.0 // USERS</span>
                    <span>共 {users.length} 名使用者</span>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="wizard-content" style={{ maxWidth: '450px', width: '90%', minHeight: 'auto', padding: '2.5rem', position: 'relative' }}>

                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-structural)', padding: '0.5rem' }}
                            title="關閉"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="step-title" style={{ fontSize: '1.8rem', marginTop: 0 }}>
                            {formData.id ? '編輯使用者' : '新增使用者'}
                        </h3>
                        <p className="step-desc" style={{ marginBottom: '2rem' }}>
                            {formData.id ? '修改此帳號的基本資料與權限' : '建立一個新的管理員或面試官帳號'}
                        </p>

                        {error && (
                            <div style={{ background: 'rgba(224, 49, 49, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '1rem', marginBottom: '1.5rem', fontFamily: 'var(--font-tech)', fontSize: '0.9rem', textAlign: 'center' }}>
                                [ERROR] {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label required">使用者帳號</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    disabled={formData.id !== null}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className={formData.id ? "form-label" : "form-label required"}>
                                    {formData.id ? '新密碼 (若不修改請留空)' : '登入密碼'}
                                </label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!formData.id}
                                    placeholder={!formData.id ? "請輸入至少 6 個字元" : ""}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label required">身分權限</label>
                                <select
                                    className="form-input"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    style={{ margin: 0 }}
                                >
                                    <option value="interviewer">面試官 (一般權限)</option>
                                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                        <option value="admin">系統管理員 (主管權限)</option>
                                    )}
                                    {user?.role === 'superadmin' && (
                                        <option value="superadmin">超級管理員 (最高權限)</option>
                                    )}
                                </select>
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
