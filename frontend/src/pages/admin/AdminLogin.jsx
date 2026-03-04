import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Lock, ChevronRight, Smartphone, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
    const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    // ── Step 1: Submit credentials ──
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${apiUrl}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.require2FA) {
                // Server needs OTP verification
                setTempToken(data.tempToken);
                setStep('otp');
            } else {
                // No 2FA — login complete
                login(data.user, data.token);
                navigate('/admin/dashboard', { replace: true });
            }
        } catch (err) {
            setError(err.message === 'Invalid credentials' ? '帳號或密碼輸入錯誤，請重試' : err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Submit OTP ──
    const handleOtpVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${apiUrl}/admin/login/2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken, otpToken: otpToken.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '驗證失敗');
            }

            login(data.user, data.token);
            navigate('/admin/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Shared error box
    const ErrorBox = () => error ? (
        <div style={{
            background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626', padding: '0.9rem 1.2rem', marginBottom: '1.5rem',
            borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
            textAlign: 'center'
        }}>
            {error}
        </div>
    ) : null;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="wizard-content" style={{ maxWidth: '480px', width: '100%', minHeight: 'auto', padding: '3rem 3.5rem' }}>

                {/* ── STEP 1: Credentials ── */}
                {step === 'credentials' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{
                                display: 'inline-flex', background: 'var(--color-primary)',
                                padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem'
                            }}>
                                <Lock size={28} color="#ffffff" />
                            </div>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)', fontSize: '1.75rem',
                                fontWeight: '800', color: 'var(--color-structural)', margin: '0 0 0.5rem'
                            }}>系統管理後台</h2>
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                                color: 'var(--color-structural-light)', margin: 0
                            }}>請輸入您的管理員帳號密碼</p>
                        </div>

                        <ErrorBox />

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label required">管理員帳號 (Username)</label>
                                <input type="text" className="form-input" value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required autoComplete="username" placeholder="請輸入帳號" />
                            </div>

                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="form-label required">系統密碼 (Password)</label>
                                <input type="password" className="form-input" value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required autoComplete="current-password" placeholder="請輸入密碼" />
                            </div>

                            <button type="submit" disabled={loading}
                                className="btn-wizard btn-wizard-next"
                                style={{ width: '100%', justifyContent: 'center', padding: '1rem 2rem', marginTop: '0.5rem', fontSize: '1.05rem', fontWeight: '700' }}>
                                {loading
                                    ? <><Loader2 size={20} className="animate-spin" /> 驗證中...</>
                                    : <>登入系統 <ChevronRight size={20} /></>
                                }
                            </button>
                        </form>
                    </>
                )}

                {/* ── STEP 2: OTP Verification ── */}
                {step === 'otp' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{
                                display: 'inline-flex', background: 'var(--color-primary)',
                                padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem'
                            }}>
                                <Smartphone size={28} color="#ffffff" />
                            </div>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)', fontSize: '1.75rem',
                                fontWeight: '800', color: 'var(--color-structural)', margin: '0 0 0.5rem'
                            }}>雙因素驗證</h2>
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                                color: 'var(--color-structural-light)', margin: 0
                            }}>請打開 Google Authenticator，輸入 6 位數驗證碼</p>
                        </div>

                        <ErrorBox />

                        <form onSubmit={handleOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label required">驗證碼 (6 位數字)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={otpToken}
                                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    autoComplete="one-time-code"
                                    placeholder="000 000"
                                    inputMode="numeric"
                                    autoFocus
                                    style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '0.5rem', fontWeight: '700' }}
                                />
                                <p style={{ fontSize: '0.82rem', color: 'var(--color-structural-light)', marginTop: '0.5rem', textAlign: 'center' }}>
                                    驗證碼每 30 秒更新一次，請以手機 App 當下顯示的號碼為準
                                </p>
                            </div>

                            <button type="submit" disabled={loading || otpToken.length !== 6}
                                className="btn-wizard btn-wizard-next"
                                style={{ width: '100%', justifyContent: 'center', padding: '1rem 2rem', marginTop: '0.5rem', fontSize: '1.05rem', fontWeight: '700' }}>
                                {loading
                                    ? <><Loader2 size={20} className="animate-spin" /> 驗證中...</>
                                    : <>確認驗證碼 <ChevronRight size={20} /></>
                                }
                            </button>
                        </form>

                        <button onClick={() => { setStep('credentials'); setError(''); setOtpToken(''); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem',
                                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-structural-light)',
                                fontFamily: 'var(--font-body)', fontSize: '0.9rem', width: '100%', justifyContent: 'center'
                            }}>
                            <ArrowLeft size={16} /> 返回重新登入
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};

export default AdminLogin;
