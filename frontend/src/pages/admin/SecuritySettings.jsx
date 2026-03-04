import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Shield, QrCode, KeyRound, Loader2, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

const SecuritySettings = () => {
    const { user } = useAuth();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    const [step, setStep] = useState('status'); // 'status' | 'qr' | 'confirm' | 'disable'
    const [status, setStatus] = useState(null); // { enabled, hasSecret }
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

    const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` });

    // Load 2FA status on mount
    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${apiUrl}/admin/2fa/status`, { headers: authHeader() });
            const data = await res.json();
            setStatus(data);
        } catch {
            setMessage({ type: 'error', text: '無法讀取安全性狀態' });
        }
    };

    // Step 1: Request QR code
    const handleSetup = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`${apiUrl}/admin/2fa/setup`, {
                method: 'POST',
                headers: authHeader()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setQrCode(data.qrCode);
            setSecret(data.secret);
            setStep('qr');
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Confirm OTP to enable
    const handleEnable = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`${apiUrl}/admin/2fa/enable`, {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: data.message });
            setStep('status');
            fetchStatus();
            setToken('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // Disable 2FA
    const handleDisable = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`${apiUrl}/admin/2fa/disable`, {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: data.message });
            setStep('status');
            fetchStatus();
            setToken('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        textAlign: 'center', fontSize: '2rem', letterSpacing: '0.6rem',
        fontWeight: '800', fontFamily: 'var(--font-heading)', width: '100%',
        background: '#f8fafc', border: '2px solid var(--border-structural)',
        borderRadius: '12px', padding: '0.9rem 1.2rem', outline: 'none',
        color: 'var(--color-structural)', transition: 'border-color 0.2s'
    };

    return (
        <div style={{ padding: '3rem', maxWidth: '680px' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="step-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={30} color="var(--color-primary)" /> 帳號安全性設定
                </h1>
                <p className="step-desc">管理您的帳號雙因素驗證 (2FA) 設定，提升後台登入安全性。</p>
            </div>

            {/* Global message */}
            {message && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: message.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: message.type === 'success' ? '#059669' : '#dc2626',
                    padding: '1rem 1.2rem', borderRadius: '12px', marginBottom: '1.5rem',
                    fontFamily: 'var(--font-body)', fontSize: '0.95rem'
                }}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    {message.text}
                </div>
            )}

            {/* ── STATUS VIEW ── */}
            {step === 'status' && (
                <div style={{ background: '#ffffff', border: '1px solid var(--border-structural)', borderRadius: '16px', overflow: 'hidden' }}>
                    {/* 2FA Status Card */}
                    <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-structural)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '12px',
                                background: status?.enabled ? 'rgba(16,185,129,0.1)' : 'rgba(15,23,42,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Shield size={26} color={status?.enabled ? '#059669' : 'var(--color-structural-light)'} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>
                                    雙因素驗證 (2FA)
                                </div>
                                <div style={{ fontSize: '0.88rem', color: status?.enabled ? '#059669' : 'var(--color-structural-light)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {status === null ? '讀取中...' : status.enabled ? <><CheckCircle2 size={14} /> 已啟用</> : '尚未啟用'}
                                </div>
                            </div>
                        </div>
                        {status?.enabled ? (
                            <button onClick={() => { setStep('disable'); setMessage(null); setToken(''); }}
                                style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#dc2626', padding: '0.55rem 1.2rem', borderRadius: '9999px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                停用 2FA
                            </button>
                        ) : (
                            <button onClick={handleSetup} disabled={loading}
                                className="btn-wizard btn-wizard-next"
                                style={{ margin: 0, padding: '0.55rem 1.4rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                                立即設定
                            </button>
                        )}
                    </div>

                    {/* Instructions */}
                    <div style={{ padding: '1.5rem 2rem', background: '#f8fafc' }}>
                        <p style={{ fontSize: '0.88rem', color: 'var(--color-structural-light)', margin: 0, lineHeight: '1.7' }}>
                            啟用雙因素驗證後，每次登入時需額外輸入手機 <strong>Google Authenticator</strong> App 產生的 6 位數一次性密碼。
                            即使密碼洩露，其他人也無法進入後台。
                        </p>
                    </div>
                </div>
            )}

            {/* ── QR CODE VIEW ── */}
            {step === 'qr' && (
                <div style={{ background: '#ffffff', border: '1px solid var(--border-structural)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-structural)', marginBottom: '0.5rem' }}>
                        步驟 1：掃描 QR Code
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-structural-light)', marginBottom: '1.5rem' }}>
                        打開手機的 <strong>Google Authenticator</strong>，點「+」→「掃描 QR Code」
                    </p>

                    {qrCode && (
                        <div style={{ display: 'inline-block', padding: '1rem', background: '#fff', border: '3px solid var(--border-structural)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <img src={qrCode} alt="2FA QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                        </div>
                    )}

                    <div style={{ background: '#f8fafc', border: '1px solid var(--border-structural)', borderRadius: '10px', padding: '1rem', marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-structural-light)', margin: '0 0 0.4rem' }}>無法掃描？請手動輸入金鑰：</p>
                        <code style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-structural)', letterSpacing: '0.15em', wordBreak: 'break-all' }}>{secret}</code>
                    </div>

                    <button onClick={() => setStep('confirm')} className="btn-wizard btn-wizard-next"
                        style={{ margin: 0, padding: '0.8rem 2rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        掃描完成，下一步 <ChevronRight size={18} />
                    </button>

                    <button onClick={() => setStep('status')} style={{ display: 'block', margin: '1rem auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-structural-light)', fontSize: '0.88rem', fontFamily: 'var(--font-body)' }}>
                        取消
                    </button>
                </div>
            )}

            {/* ── CONFIRM OTP TO ENABLE ── */}
            {step === 'confirm' && (
                <div style={{ background: '#ffffff', border: '1px solid var(--border-structural)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', background: 'rgba(15,23,42,0.05)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <KeyRound size={28} color="var(--color-primary)" />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-structural)', marginBottom: '0.5rem' }}>
                        步驟 2：輸入驗證碼
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-structural-light)', marginBottom: '2rem' }}>
                        請輸入 Google Authenticator 目前顯示的 6 位數字以確認設定正確
                    </p>

                    <form onSubmit={handleEnable}>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            inputMode="numeric"
                            autoFocus
                            style={{ ...inputStyle, marginBottom: '1.5rem' }}
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-structural)'}
                        />

                        <button type="submit" disabled={loading || token.length !== 6}
                            className="btn-wizard btn-wizard-next"
                            style={{ margin: '0 auto', padding: '0.8rem 2rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {loading ? <><Loader2 size={18} className="animate-spin" /> 驗證中...</> : <><CheckCircle2 size={18} /> 確認啟用</>}
                        </button>
                    </form>

                    <button onClick={() => { setStep('qr'); setMessage(null); }} style={{ display: 'block', margin: '1rem auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-structural-light)', fontSize: '0.88rem', fontFamily: 'var(--font-body)' }}>
                        ← 回上一步
                    </button>
                </div>
            )}

            {/* ── DISABLE 2FA ── */}
            {step === 'disable' && (
                <div style={{ background: '#ffffff', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', background: 'rgba(239,68,68,0.08)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <AlertTriangle size={28} color="#dc2626" />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                        停用雙因素驗證
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-structural-light)', marginBottom: '2rem' }}>
                        請輸入目前 Google Authenticator 的 6 位數字以確認停用
                    </p>

                    <form onSubmit={handleDisable}>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            inputMode="numeric"
                            autoFocus
                            style={{ ...inputStyle, marginBottom: '1.5rem' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#dc2626'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-structural)'}
                        />

                        <button type="submit" disabled={loading || token.length !== 6}
                            style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '0.8rem 2rem', borderRadius: '9999px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)', opacity: (loading || token.length !== 6) ? 0.5 : 1, transition: 'all 0.15s' }}>
                            {loading ? <><Loader2 size={18} className="animate-spin" /> 處理中...</> : '確認停用 2FA'}
                        </button>
                    </form>

                    <button onClick={() => { setStep('status'); setMessage(null); }} style={{ display: 'block', margin: '1rem auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-structural-light)', fontSize: '0.88rem', fontFamily: 'var(--font-body)' }}>
                        取消
                    </button>
                </div>
            )}
        </div>
    );
};

export default SecuritySettings;
