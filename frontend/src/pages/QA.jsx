import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const QA = () => {
    const navigate = useNavigate();
    const contentRef = useRef(null);

    const candidateId = sessionStorage.getItem('candidateId');
    const jobCategoryId = sessionStorage.getItem('jobCategoryId'); // stored when BasicInfo completes

    const [questions, setQuestions] = useState([]);
    const [loadingQuestions, setLoadingQuestions] = useState(true);
    const [answers, setAnswers] = useState({});
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // ──────────────────────────────────────────────
    // Load questions
    // ──────────────────────────────────────────────
    useEffect(() => {
        if (!candidateId) {
            alert('請先填寫基本資料！');
            navigate('/');
            return;
        }

        const loadQuestions = async () => {
            setLoadingQuestions(true);
            try {
                let data = [];
                if (jobCategoryId) {
                    const res = await fetch(`${API_URL}/jobs/${jobCategoryId}/questions`);
                    if (res.ok) {
                        const json = await res.json();
                        data = json.data || [];
                    }
                }

                // Fallback: if no questions assigned, use static questions.json
                if (data.length === 0) {
                    const staticQs = await import('../data/questions.json');
                    data = staticQs.default.flatMap(cat =>
                        cat.questions.map(q => ({ id: q.id, question_text: q.text, question_type: 'textarea', category: cat.category }))
                    );
                }

                setQuestions(data);

                // Restore draft
                const draft = localStorage.getItem(`qa_draft_${candidateId}`);
                if (draft) {
                    try {
                        if (window.confirm('發現您有未送出的專業問答草稿，是否要還原上次填寫的內容？')) {
                            setAnswers(JSON.parse(draft));
                        } else {
                            localStorage.removeItem(`qa_draft_${candidateId}`);
                        }
                    } catch { /* ignore */ }
                }
            } catch (err) {
                console.error('Failed to load questions:', err);
            } finally {
                setLoadingQuestions(false);
            }
        };

        loadQuestions();
    }, [candidateId, jobCategoryId, navigate]);

    // Auto-save draft
    useEffect(() => {
        if (candidateId && Object.keys(answers).length > 0) {
            localStorage.setItem(`qa_draft_${candidateId}`, JSON.stringify(answers));
        }
    }, [answers, candidateId]);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    // ──────────────────────────────────────────────
    // Group questions by category for sidebar steps
    // ──────────────────────────────────────────────
    const categories = questions.reduce((acc, q) => {
        const cat = q.category || '通用';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(q);
        return acc;
    }, {});
    const categoryList = Object.keys(categories);
    const currentCategory = categoryList[currentStep];
    const currentQuestions = currentCategory ? categories[currentCategory] : [];
    const totalSteps = categoryList.length;

    const nextStep = () => { setDirection(1); setCurrentStep(p => Math.min(p + 1, totalSteps - 1)); };
    const prevStep = () => { setDirection(-1); setCurrentStep(p => Math.max(p - 1, 0)); };

    const handleAnswer = (qId, value) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const onSubmit = async () => {
        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers)
                .filter(([, v]) => v)
                .map(([question_code, answer_text]) => ({ question_code, answer_text }));

            const response = await fetch(`${API_URL}/candidates/${candidateId}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: formattedAnswers })
            });

            if (response.ok) {
                localStorage.removeItem(`qa_draft_${candidateId}`);
                navigate('/personality');
            } else {
                alert('提交失敗，請重試');
            }
        } catch (error) {
            alert('系統發生錯誤，請稍後再試');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingQuestions) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--color-primary)' }}>
            <Loader2 size={36} className="animate-spin" />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>載入題目中...</div>
        </div>
    );

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="wizard-wrapper">
                {/* Sidebar */}
                <aside className="wizard-sidebar">
                    <div className="sidebar-global-progress">
                        <div className="global-step completed">
                            <span className="global-step-num"><Check size={16} /></span>
                            <span className="global-step-title" style={{ opacity: 0.7 }}>基本資料</span>
                        </div>
                        <div className="global-step active">
                            <span className="global-step-num">02</span>
                            <span className="global-step-title">專業問答</span>
                        </div>
                        <div className="global-step">
                            <span className="global-step-num">03</span>
                            <span className="global-step-title">性格測驗</span>
                        </div>
                    </div>

                    <div className="local-step-list">
                        {categoryList.map((cat, idx) => (
                            <div key={cat} className={`local-step ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`}>
                                {cat}
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="wizard-content" ref={contentRef}>
                    {totalSteps === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(45,34,28,0.5)' }}>
                            此職缺尚未設定面試題目，請直接進行下一步。
                            <button onClick={() => navigate('/personality')} style={{ display: 'block', margin: '2rem auto 0', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                                繼續 → 性格測驗
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="step-title">{currentCategory}</h2>
                            <p className="step-desc">此大題共有 {currentQuestions.length} 題，請盡可能詳細地描述您的經驗與想法。</p>

                            <div className="qa-questions-container">
                                <AnimatePresence mode="wait">
                                    <motion.div key={currentStep}
                                        initial={{ x: direction * 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -direction * 20, opacity: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        {currentQuestions.map((q, index) => (
                                            <div key={q.id} className="form-group" style={{ marginBottom: '2.5rem' }}>
                                                <label className="form-label" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginRight: '8px' }}>{index + 1}.</span>
                                                    {q.question_text}
                                                    {q.is_required ? <span style={{ color: '#ef4444', marginLeft: '4px', fontSize: '0.85em' }}>*</span> : null}
                                                </label>
                                                {q.question_type === 'text' ? (
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={answers[q.id] || ''}
                                                        onChange={e => handleAnswer(q.id, e.target.value)}
                                                        placeholder="請在此輸入您的回答..."
                                                    />
                                                ) : (
                                                    <textarea
                                                        className="form-input"
                                                        rows="4"
                                                        value={answers[q.id] || ''}
                                                        onChange={e => handleAnswer(q.id, e.target.value)}
                                                        placeholder="請在此輸入您的回答..."
                                                        style={{ resize: 'vertical', minHeight: '100px' }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="wizard-nav">
                                {currentStep > 0 ? (
                                    <button type="button" onClick={prevStep} className="btn-wizard btn-wizard-prev">上一類</button>
                                ) : <div />}

                                {currentStep < totalSteps - 1 ? (
                                    <button type="button" onClick={nextStep} className="btn-wizard btn-wizard-next">
                                        下一類 <ArrowRight size={20} />
                                    </button>
                                ) : (
                                    <button type="button" onClick={onSubmit} disabled={submitting} className="btn-wizard btn-wizard-next">
                                        {submitting ? <Loader2 size={20} className="animate-spin" /> : <>完成問答 <ArrowRight size={20} /></>}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default QA;
