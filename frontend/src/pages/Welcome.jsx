import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Welcome = () => {
    const navigate = useNavigate();
    const [agreed, setAgreed] = useState(false);

    const handleStart = () => {
        if (agreed) {
            navigate('/basic-info');
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
        }}>
            {/* Title Area */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '600px' }}>
                <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: 'var(--color-structural)',
                    margin: '0 0 0.75rem',
                    lineHeight: 1.2,
                }}>
                    歡迎來到面試系統
                </h1>
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '1.05rem',
                    color: 'var(--color-structural-light)',
                    margin: 0,
                }}>
                    請先閱讀下方隱私權同意書，確認後即可開始填寫
                </p>
            </div>

            {/* Main Card */}
            <div className="wizard-content" style={{
                maxWidth: '680px',
                width: '100%',
                minHeight: 'auto',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
            }}>
                {/* Privacy Section */}
                <div style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border-structural)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '1.2rem 1.5rem',
                        borderBottom: '1px solid var(--border-structural)',
                        background: '#ffffff',
                    }}>
                        <ShieldCheck size={20} color="var(--color-primary)" />
                        <h4 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: 'var(--color-structural)',
                            margin: 0,
                        }}>隱私權與資料處理同意書</h4>
                    </div>

                    {/* Content */}
                    <div style={{
                        height: '200px',
                        overflowY: 'auto',
                        padding: '1.5rem',
                        fontSize: '0.95rem',
                        color: 'var(--color-structural)',
                        lineHeight: '1.85',
                    }}>
                        <p>歡迎您參加「電波澎澎 dianbopopo」的面試徵選流程。</p>
                        <p>為了順利進行後續的適性測驗與面試評估，我們將蒐集您的基本資料（包含姓名、聯絡方式等）、專業問答內容以及性格測驗結果。</p>
                        <p>您的所有資料將受到嚴格保密，僅限於本公司內部招募評估之用，絕不外流或挪作他用。完成填寫後，系統可能會自動使用 AI 技術輔助進行初步分析，以協助我們更快速地了解您的特質與專長。</p>
                        <p>請仔細閱讀以上聲明，若您同意本公司蒐集並處理您的面試相關資料，請勾選下方同意方塊並點擊開始。</p>
                    </div>
                </div>

                {/* Consent Checkbox */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    cursor: 'pointer',
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    background: agreed ? 'rgba(15, 23, 42, 0.03)' : 'transparent',
                    border: agreed ? '1.5px solid rgba(15, 23, 42, 0.15)' : '1.5px solid var(--border-structural)',
                    transition: 'all 0.2s',
                    userSelect: 'none',
                }}>
                    {/* Custom checkbox visual */}
                    <div style={{
                        width: '1.5rem', height: '1.5rem',
                        flexShrink: 0,
                        border: agreed ? '2px solid var(--color-primary)' : '2px solid #cbd5e1',
                        borderRadius: '6px',
                        background: agreed ? 'var(--color-primary)' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}>
                        {agreed && <CheckCircle2 size={14} color="white" strokeWidth={3} />}
                    </div>
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        style={{ display: 'none' }}
                    />
                    <span style={{
                        fontWeight: '600',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--color-structural)',
                        fontSize: '0.95rem',
                    }}>
                        我已閱讀並同意上述隱私權聲明與資料處理條款
                    </span>
                </label>

                {/* CTA Button */}
                <button
                    onClick={handleStart}
                    disabled={!agreed}
                    className="btn-wizard btn-wizard-next"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '1.1rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        letterSpacing: '0.02em',
                    }}
                >
                    開始填寫 <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default Welcome;
