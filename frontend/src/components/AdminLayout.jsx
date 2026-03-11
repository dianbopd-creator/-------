import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LogOut, Users, FileText, UserCircle, KeyRound, X, Loader2,
    Briefcase, Activity, ChevronLeft, ChevronRight, ShieldCheck,
    ClipboardList, Settings, Search, BarChart2, Library
} from 'lucide-react';

const AdminLayout = () => {
    const { user, login, updateUserContext } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Profile States
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [department, setDepartment] = useState(user?.department || '');
    const [position, setPosition] = useState(user?.position || '');
    const [avatarB64, setAvatarB64] = useState(user?.avatar_b64 || '');
    const [profileError, setProfileError] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    // ── Auto-sync 2FA status to fix stale localStorage sessions ──────────
    // When user.totp_enabled is missing/false (old session), verify from backend
    // The /2fa/status endpoint is exempt from the 2FA middleware block
    useEffect(() => {
        if (user && !user.totp_enabled) {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
            fetch(`${apiUrl}/admin/2fa/status`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            })
                .then(r => r.json())
                .then(data => {
                    if (data.enabled) {
                        updateUserContext({ totp_enabled: true });
                    }
                })
                .catch(() => { }); // silently fail — gate will still show if backend unreachable
        }
    }, [user?.id]); // only re-run if user changes

    if (!user) return <Navigate to="/admin/login" replace />;

    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    // ── Mandatory 2FA gate ──────────────────────────────────────────────────
    // If user hasn't enabled 2FA, block access until they set it up
    const needs2FASetup = !user.totp_enabled && location.pathname !== '/admin/security';

    // Navigation groups — like Hipp Health's grouped sidebar
    const navGroups = [
        {
            label: '招募管理',
            items: [
                { label: '履歷總管', path: '/admin/resumes', icon: FileText },
                { label: '甄試看板', path: '/admin/dashboard', icon: Activity },

                { label: '題庫中心', path: '/admin/question-bank', icon: Library },
            ]
        },
        ...(isAdmin ? [{
            label: '系統設定',
            items: [
                { label: '人員管理', path: '/admin/users', icon: Users },
                { label: '操作日誌', path: '/admin/audit-logs', icon: ClipboardList },
            ]
        }] : []),
        {
            label: '帳號',
            items: [
                { label: '帳號安全性', path: '/admin/security', icon: ShieldCheck },
                { label: '個人資訊', action: () => setIsProfileModalOpen(true), icon: UserCircle },
            ]
        }
    ];

    const isItemActive = (item) => item.path && location.pathname.startsWith(item.path);

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { setProfileError('照片大小不可超過 2MB'); return; }
            const reader = new FileReader();
            reader.onloadend = () => setAvatarB64(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileError(''); setProfileSuccess(false); setProfileLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
            const response = await fetch(`${apiUrl}/admin/me/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: JSON.stringify({ full_name: fullName, email, department, position, avatar_b64: avatarB64 })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '個人資訊更新失敗');
            setProfileSuccess(true);
            const updatedUser = { ...user, full_name: fullName, email, department, position, avatar_b64: avatarB64 };
            localStorage.setItem('adminUser', JSON.stringify(updatedUser));
            setTimeout(() => { setIsProfileModalOpen(false); setProfileSuccess(false); window.location.reload(); }, 1000);
        } catch (err) { setProfileError(err.message); }
        finally { setProfileLoading(false); }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setPasswordError(''); setPasswordSuccess(false);
        if (newPassword !== confirmPassword) return setPasswordError('兩次輸入的新密碼不一致');
        if (newPassword.length < 6) return setPasswordError('新密碼長度必須至少 6 個字元');
        if (!currentPassword) return setPasswordError('請輸入目前密碼');
        setPasswordLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
            const response = await fetch(`${apiUrl}/admin/me/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '密碼更新失敗');
            setPasswordSuccess(true);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setTimeout(() => { setIsPasswordModalOpen(false); setPasswordSuccess(false); }, 2000);
        } catch (err) { setPasswordError(err.message === 'Incorrect current password' ? '目前密碼輸入錯誤' : err.message); }
        finally { setPasswordLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        window.location.reload();
    };

    // ── Sidebar width
    const sidebarW = sidebarCollapsed ? '64px' : '220px';

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-main)' }}>

            {/* ════════════════════ 2FA ENFORCEMENT GATE ════════════════════ */}
            {needs2FASetup && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,27,49,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '3rem 2.5rem', maxWidth: '460px', width: '90%', textAlign: 'center', boxShadow: '0 32px 80px rgba(9,27,49,0.3)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <ShieldCheck size={32} color="#d97706" />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-structural)', marginBottom: '0.75rem' }}>請先啟用雙重驗證 (2FA)</h2>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(15,23,42,0.6)', lineHeight: '1.7', marginBottom: '2rem' }}>
                            為保障帳號與系統安全，所有後台人員必須啟用<strong>雙重驗證 (Google Authenticator)</strong> 才能存取管理後台。
                        </p>
                        <button onClick={() => navigate('/admin/security')}
                            style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.85rem 2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', width: '100%', transition: 'opacity 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <ShieldCheck size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                            前往啟用 2FA
                        </button>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.35)', marginTop: '1rem' }}>啟用完成後即可正常使用所有後台功能</p>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
                LEFT SIDEBAR
            ════════════════════════════════════════ */}
            <aside style={{
                width: sidebarW,
                minWidth: sidebarW,
                height: '100vh',
                background: '#ffffff',
                borderRight: '1px solid var(--border-structural)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.22s ease',
                overflow: 'hidden',
                zIndex: 20,
                flexShrink: 0,
            }}>
                {/* Logo area */}
                <div style={{
                    padding: sidebarCollapsed ? '1.25rem 0' : '1.25rem 1.25rem',
                    borderBottom: '1px solid var(--border-structural)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                    minHeight: '60px',
                    overflow: 'hidden',
                }}>
                    {!sidebarCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', overflow: 'hidden' }}>
                            <span style={{
                                fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: '800',
                                color: 'var(--color-logo-primary)', letterSpacing: '0.06em', whiteSpace: 'nowrap'
                            }}>DIANBOPOPO</span>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: '800', color: 'var(--color-logo-primary)' }}>D</span>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        style={{
                            background: 'transparent', border: '1px solid var(--border-structural)',
                            borderRadius: '6px', cursor: 'pointer', padding: '4px',
                            display: 'flex', alignItems: 'center', color: 'var(--color-structural-light)',
                            transition: 'all 0.15s', flexShrink: 0,
                        }}
                        title={sidebarCollapsed ? '展開選單' : '收合選單'}
                    >
                        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Navigation Groups */}
                <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.75rem 0', scrollbarWidth: 'none' }}>
                    {navGroups.map((group, gi) => (
                        <div key={gi} style={{ marginBottom: '0.25rem' }}>
                            {/* Group label — only show when expanded */}
                            {!sidebarCollapsed && (
                                <div style={{
                                    fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.08em',
                                    color: 'var(--color-structural-light)', textTransform: 'uppercase',
                                    padding: '0.6rem 1.25rem 0.3rem',
                                }}>
                                    {group.label}
                                </div>
                            )}
                            {group.items.map((item, ii) => {
                                const active = isItemActive(item);
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={ii}
                                        onClick={() => {
                                            if (item.path) navigate(item.path);
                                            if (item.action) item.action();
                                        }}
                                        title={sidebarCollapsed ? item.label : undefined}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.65rem',
                                            padding: sidebarCollapsed ? '0.62rem 0' : '0.62rem 1.25rem',
                                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                            background: active ? 'rgba(9,27,49,0.06)' : 'transparent',
                                            color: active ? 'var(--color-primary)' : 'var(--color-structural-light)',
                                            border: 'none',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s, color 0.15s',
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '0.875rem',
                                            fontWeight: active ? '600' : '400',
                                            textAlign: 'left',
                                            whiteSpace: 'nowrap',
                                            borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent',
                                            boxSizing: 'border-box',
                                        }}
                                        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(9,27,49,0.03)'; e.currentTarget.style.color = 'var(--color-structural)'; } }}
                                        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-structural-light)'; } }}
                                    >
                                        <Icon size={16} style={{ flexShrink: 0 }} />
                                        {!sidebarCollapsed && <span>{item.label}</span>}
                                    </button>
                                );
                            })}
                            {/* Separator between groups */}
                            {gi < navGroups.length - 1 && (
                                <div style={{ height: '1px', background: 'var(--border-structural)', margin: '0.5rem 0' }} />
                            )}
                        </div>
                    ))}
                </nav>

                {/* Bottom: User info + Logout */}
                <div style={{
                    borderTop: '1px solid var(--border-structural)',
                    padding: sidebarCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                }}>
                    {!sidebarCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden', flex: 1 }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'var(--color-primary)', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                            }}>
                                {user.avatar_b64
                                    ? <img src={user.avatar_b64} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <UserCircle size={18} color="#fff" />
                                }
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-structural)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user.full_name || user.username}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-structural-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user.department || user.role}
                                </div>
                            </div>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {user.avatar_b64 ? <img src={user.avatar_b64} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={16} color="#fff" />}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        title="登出系統"
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--color-structural-light)', padding: '6px',
                            borderRadius: '6px', display: 'flex', alignItems: 'center',
                            transition: 'all 0.15s', flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#dc2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-structural-light)'; }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* ════════════════════════════════════════
                MAIN CONTENT AREA
            ════════════════════════════════════════ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                {/* Thin top bar — breadcrumb / page title area */}
                <header style={{
                    height: '52px',
                    background: '#ffffff',
                    borderBottom: '1px solid var(--border-structural)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1.75rem',
                    flexShrink: 0,
                }}>
                    {/* Current section label */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-structural-light)', fontWeight: '500' }}>
                        {navGroups.flatMap(g => g.items).find(i => i.path && location.pathname.startsWith(i.path))?.label || '管理後台'}
                    </div>
                    {/* Right: user name */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-structural-light)' }}>
                        {user.full_name || user.username}
                        {user.position && <span style={{ marginLeft: '0.5rem', color: 'var(--color-structural-light)', opacity: 0.6 }}>· {user.position}</span>}
                    </div>
                </header>

                {/* Scrollable page content */}
                <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-main)', position: 'relative' }}>
                    <Outlet />
                </main>
            </div>

            {/* ════════════════════════════════════════
                PROFILE MODAL
            ════════════════════════════════════════ */}
            {isProfileModalOpen && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal-content" style={{ position: 'relative', background: '#fff', borderRadius: '16px', padding: '2.5rem', maxWidth: '560px', width: '90%' }}>
                        <button onClick={() => { setIsProfileModalOpen(false); setProfileError(''); setProfileSuccess(false); }}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-structural)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={18} />
                        </button>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-structural)', marginBottom: '0.3rem' }}>個人資訊管理</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-structural-light)', marginBottom: '1.75rem' }}>更新帳號 [{user.username}] 的基本資料</p>

                        {profileSuccess ? (
                            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#059669', padding: '1rem', borderRadius: '10px', textAlign: 'center', fontSize: '0.9rem' }}>更新成功！視窗將自動關閉</div>
                        ) : (
                            <form onSubmit={handleUpdateProfile}>
                                {profileError && <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>{profileError}</div>}
                                <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                        <div style={{ width: '80px', height: '80px', border: '2px dashed var(--border-structural)', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                                            {avatarB64 ? <img src={avatarB64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={36} opacity={0.3} />}
                                        </div>
                                        <label style={{ background: 'rgba(9,27,49,0.06)', color: 'var(--color-structural)', padding: '0.3rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '6px', fontWeight: '500' }}>
                                            上傳頭像 <input type="file" accept="image/jpeg,image/png" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        <div className="form-group"><label className="form-label">顯示名稱</label><input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="王小明" /></div>
                                        <div className="form-group"><label className="form-label">聯絡信箱</label><input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@dianbopopo.com" /></div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group"><label className="form-label">所屬部門</label><input type="text" className="form-input" value={department} onChange={e => setDepartment(e.target.value)} placeholder="人資部" /></div>
                                    <div className="form-group"><label className="form-label">職位抬頭</label><input type="text" className="form-input" value={position} onChange={e => setPosition(e.target.value)} placeholder="招募專員" /></div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', borderTop: '1px solid var(--border-structural)', paddingTop: '1.25rem' }}>
                                    <button type="button" onClick={() => { setIsProfileModalOpen(false); setIsPasswordModalOpen(true); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--border-structural)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-structural-light)', fontFamily: 'var(--font-body)' }}>
                                        <KeyRound size={14} /> 變更密碼
                                    </button>
                                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                                        <button type="button" onClick={() => setIsProfileModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border-structural)', borderRadius: '8px', padding: '0.5rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-structural-light)', fontFamily: 'var(--font-body)' }}>取消</button>
                                        <button type="submit" disabled={profileLoading} className="btn-wizard-next" style={{ padding: '0.5rem 1.4rem', margin: 0, width: 'auto', fontSize: '0.88rem' }}>
                                            {profileLoading ? <Loader2 size={16} className="animate-spin" /> : '儲存'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
                PASSWORD MODAL
            ════════════════════════════════════════ */}
            {isPasswordModalOpen && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal-content" style={{ position: 'relative', background: '#fff', borderRadius: '16px', padding: '2.5rem', maxWidth: '440px', width: '90%' }}>
                        <button onClick={() => { setIsPasswordModalOpen(false); setPasswordError(''); setPasswordSuccess(false); }}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-structural)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={18} />
                        </button>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-structural)', marginBottom: '0.3rem' }}>變更登入密碼</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-structural-light)', marginBottom: '1.75rem' }}>變更帳號 [{user.username}] 的系統密碼</p>

                        {passwordSuccess ? (
                            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#059669', padding: '1rem', borderRadius: '10px', textAlign: 'center', fontSize: '0.9rem' }}>密碼更新成功！</div>
                        ) : (
                            <form onSubmit={handleUpdatePassword}>
                                {passwordError && <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>{passwordError}</div>}
                                <div className="form-group" style={{ marginBottom: '1rem' }}><label className="form-label">目前密碼</label><input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}><label className="form-label">新密碼（至少 6 個字元）</label><input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}><label className="form-label">確認新密碼</label><input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
                                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-structural)', paddingTop: '1.25rem' }}>
                                    <button type="button" onClick={() => setIsPasswordModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border-structural)', borderRadius: '8px', padding: '0.5rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-structural-light)', fontFamily: 'var(--font-body)' }}>取消</button>
                                    <button type="submit" disabled={passwordLoading} className="btn-wizard-next" style={{ padding: '0.5rem 1.4rem', margin: 0, width: 'auto', fontSize: '0.88rem' }}>
                                        {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : '確認變更'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
