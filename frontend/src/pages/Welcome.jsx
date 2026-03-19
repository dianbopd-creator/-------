import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck, CheckCircle2, RotateCcw, PlayCircle } from 'lucide-react';

const clearAllDrafts = () => {
    localStorage.removeItem('basic_info_draft');
    localStorage.removeItem('qa_draft');
    localStorage.removeItem('candidateId');
    localStorage.removeItem('jobCategoryId');
    sessionStorage.removeItem('candidateId');
    sessionStorage.removeItem('jobCategoryId');
};

const Welcome = () => {
    const navigate = useNavigate();
    const [agreed, setAgreed] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);

    useEffect(() => {
        // Check if there's leftover data from a previous (unfinished) session
        const hasBasicDraft = !!localStorage.getItem('basic_info_draft');
        const hasQaDraft = !!localStorage.getItem('qa_draft');
        const hasCandidateId = !!localStorage.getItem('candidateId');
        setHasDraft(hasBasicDraft || hasQaDraft || hasCandidateId);
    }, []);

    const handleContinue = () => {
        // Resume where left off — no clearing
        const candidateId = localStorage.getItem('candidateId');
        if (candidateId) {
            // Already past BasicInfo, go to QA
            sessionStorage.setItem('candidateId', candidateId);
            const jobCategoryId = localStorage.getItem('jobCategoryId');
            if (jobCategoryId) sessionStorage.setItem('jobCategoryId', jobCategoryId);
            navigate('/qa');
        } else {
            navigate('/basic-info');
        }
    };

    const handleFresh = () => {
        clearAllDrafts();
        navigate('/basic-info');
    };

    const handleStart = () => {
        if (!agreed) return;
        if (hasDraft) return; // UI shows two buttons instead
        navigate('/basic-info');
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
                        fontSize: '0.9rem',
                        color: 'var(--color-structural)',
                        lineHeight: '1.9',
                    }}>
                        <p style={{ fontWeight: '700', marginBottom: '0.5rem' }}>一、蒐集目的與法律依據</p>
                        <p>依據《個人資料保護法》第八條規定，「電波澎澎 dianbopopo」（以下稱本公司）於辦理人才招募作業時，將蒐集您的個人資料，蒐集目的為：<strong>人事管理</strong>（法定特定目的代號：002）。</p>

                        <p style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.5rem' }}>二、蒐集資料類別</p>
                        <p>本次蒐集範圍包含：姓名、聯絡方式、求職意向、工作經歷、學歷背景、專業問答內容，以及性格測驗作答結果（以下合稱「招募資料」）。</p>

                        <p style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.5rem' }}>三、資料儲存與安全保護</p>
                        <p>您的所有招募資料，<strong>全程加密儲存於本公司設置於台灣境內之專屬伺服器，不經過任何第三方雲端人才媒合平台</strong>。本公司採用業界標準的資料加密技術與存取控制機制，嚴格限制具授權之內部人員方可閱覽，確保您的個人資料不會外洩、竄改或遭到未授權存取。</p>

                        <p style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.5rem' }}>四、利用期間與對象</p>
                        <p>本公司將於本次徵才結束後至多保留您的招募資料 <strong>一年</strong>，期滿後依法刪除或匿名化處理。資料僅供本公司內部招募評估委員閱覽，<strong>絕不提供、出售或以任何形式轉移予第三方</strong>。</p>

                        <p style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.5rem' }}>五、AI 輔助分析聲明</p>
                        <p>系統可能使用人工智慧（AI）技術，針對您的問答與測驗結果進行初步特質分析，以輔助招募人員更完整地認識您。AI 分析報告屬於內部參考文件，相關資料亦不會傳出公司範圍之外。</p>

                        <p style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.5rem' }}>六、您的個資權利</p>
                        <p>依《個人資料保護法》第三條規定，您就個人資料得行使以下權利：查詢或請求閱覽、請求製給複製本、請求補充或更正、請求停止蒐集、處理或利用，以及請求刪除。如需行使上述權利，請聯繫本公司招募窗口。</p>
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

                {/* CTA Area — changes based on whether draft data exists */}
                {agreed && hasDraft ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Draft notice */}
                        <div style={{
                            background: '#fff7ed', border: '1.5px solid #fb923c',
                            borderRadius: '12px', padding: '0.9rem 1.2rem',
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                        }}>
                            <span style={{ fontSize: '1.3rem' }}>📋</span>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#c2410c' }}>偵測到上次未完成的填寫資料</div>
                                <div style={{ fontSize: '0.82rem', color: '#9a3412', marginTop: '2px' }}>是否要繼續填寫，還是重新開始？</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleFresh}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0',
                                    background: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
                                    color: '#64748b', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                            >
                                <RotateCcw size={16} /> 重新開始
                            </button>
                            <button
                                onClick={handleContinue}
                                className="btn-wizard btn-wizard-next"
                                style={{ flex: 2, justifyContent: 'center', padding: '0.9rem', fontSize: '1rem', fontWeight: '700' }}
                            >
                                <PlayCircle size={18} /> 繼續上次填寫
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleStart}
                        disabled={!agreed}
                        className="btn-wizard btn-wizard-next"
                        style={{
                            width: '100%', justifyContent: 'center',
                            padding: '1.1rem 2rem', fontSize: '1.1rem',
                            fontWeight: '700', letterSpacing: '0.02em',
                        }}
                    >
                        開始填寫 <ChevronRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Welcome;
