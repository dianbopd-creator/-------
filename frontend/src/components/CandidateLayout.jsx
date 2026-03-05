import React from 'react';

/**
 * CandidateLayout — wraps every candidate-facing wizard page.
 * Provides:
 * - Full-viewport column layout
 * - Sticky branded header with logo
 * - Step progress indicator in the header
 */
const CandidateLayout = ({ children, step = 1 }) => {
    const steps = [
        { id: 1, label: '基本資料' },
        { id: 2, label: '專業問答' },
        { id: 3, label: '性格測驗' },
    ];

    return (
        <div className="kiosk-container" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)' }}>
            {/* ── Top Navigation Bar (FIXED — always visible) ── */}
            <header style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                zIndex: 200,
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(15,23,42,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 3rem',
                height: '64px',
                boxShadow: '0 1px 16px rgba(9,27,49,0.06)',
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <span style={{
                        fontFamily: 'var(--font-heading)', fontWeight: 800,
                        fontSize: '1.15rem', color: 'var(--color-logo-primary)',
                        letterSpacing: '0.08em', lineHeight: 1,
                    }}>DIANBOPOPO</span>
                    <span style={{
                        fontFamily: 'var(--font-tech)', fontSize: '0.62rem',
                        color: 'rgba(9,27,49,0.45)', letterSpacing: '0.18em',
                        fontWeight: 700, textTransform: 'uppercase',
                    }}>電波澎澎面試系統</span>
                </div>

                {/* Step Tracker */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                    {steps.map((s, idx) => {
                        const isActive = s.id === step;
                        const isDone = s.id < step;
                        return (
                            <React.Fragment key={s.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px' }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.72rem',
                                        background: isDone ? 'var(--color-accent-mint)' : isActive ? 'var(--color-primary)' : 'rgba(15,23,42,0.1)',
                                        color: isDone || isActive ? '#fff' : 'rgba(15,23,42,0.4)',
                                        transition: 'all 0.3s', flexShrink: 0,
                                    }}>
                                        {isDone ? '✓' : s.id}
                                    </div>
                                    <span style={{
                                        fontSize: '0.82rem',
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-accent-mint)' : 'rgba(15,23,42,0.4)',
                                        transition: 'all 0.3s',
                                    }}>{s.label}</span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div style={{ width: '32px', height: '1px', background: 'rgba(15,23,42,0.12)' }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </nav>

                <div style={{ width: '180px' }} />
            </header>

            {/* ── Page Body (top padding = header height) ── */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem 4rem', paddingTop: '80px' }}>
                {children}
            </main>
        </div>
    );
};

export default CandidateLayout;
