import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, BrainCircuit, ChevronRight, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { QuestionPicker } from '../utils/colortest_picker';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const PersonalityTest = () => {
    const navigate = useNavigate();
    const candidateId = sessionStorage.getItem('candidateId');

    // Intro screen: show before first question
    const [showIntro, setShowIntro] = useState(true);

    // Test states
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [timings, setTimings] = useState([]);
    const [positionSequence, setPositionSequence] = useState([]);

    // Timing states
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());

    // UI states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!candidateId) {
            navigate('/');
            return;
        }

        // Initialize 30 questions
        const picked = QuestionPicker.pick();
        setQuestions(picked);
        setQuestionStartTime(Date.now());
    }, [candidateId, navigate]);

    const handleOptionClick = (option, optionIndex) => {
        const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
        const currentQ = questions[currentIndex];

        const newAnswers = [...answers, {
            questionId: currentQ.id,
            color: option.color || null,
            optionText: option.text
        }];

        const newTimings = [...timings, {
            questionId: currentQ.id,
            seconds: timeTaken
        }];

        const newPositionSequence = [...positionSequence, optionIndex];

        // Record answers in state (for rendering, though not strictly needed for final submit)
        setAnswers(newAnswers);
        setTimings(newTimings);
        setPositionSequence(newPositionSequence);

        // Proceed to next or submit
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setQuestionStartTime(Date.now());
        } else {
            submitPersonalityTest(newAnswers, newTimings, newPositionSequence);
        }
    };

    const submitPersonalityTest = async (finalAnswers, finalTimings, finalPositionSequence) => {
        setIsSubmitting(true);
        try {
            // 1. Submit personality test data
            const response = await fetch(`${API_URL}/candidates/${candidateId}/personality`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: finalAnswers,
                    timings: finalTimings,
                    positionSequence: finalPositionSequence
                })
            });

            if (!response.ok) throw new Error('提交性格測驗失敗');

            // 2. Trigger final submission to mark candidate as 'completed'
            const finalRes = await fetch(`${API_URL}/candidates/${candidateId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!finalRes.ok) throw new Error('最終提交失敗');

            // ── Clear ALL candidate draft & session data after successful submission ──
            // localStorage drafts (persist across tab close – must be explicitly removed)
            localStorage.removeItem(`qa_draft_${candidateId}`);
            localStorage.removeItem('basic_info_draft');
            // sessionStorage session identifiers
            sessionStorage.removeItem('candidateId');
            sessionStorage.removeItem('jobCategoryId');

            navigate('/thank-you');
        } catch (err) {
            console.error(err);
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    // ── Intro Screen ─────────────────────────────────────────────────────────
    if (showIntro) {
        return (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '2rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    className="wizard-content"
                    style={{ maxWidth: '640px', width: '100%', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}
                >
                    {/* Icon */}
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c9ef5 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(99, 118, 234, 0.25)',
                    }}>
                        <BrainCircuit size={38} color="#fff" strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: '800', color: 'var(--color-structural)', margin: '0 0 0.6rem' }}>
                            性格色彩鑑定
                        </h2>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-structural-light)', margin: 0, letterSpacing: '0.02em' }}>
                            PERSONALITY SPECTRUM ASSESSMENT
                        </p>
                    </div>

                    {/* Description */}
                    <div style={{ background: '#f8fafc', border: '1px solid var(--border-structural)', borderRadius: '16px', padding: '1.75rem 2rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                            <Sparkles size={16} color="var(--color-primary)" />
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-primary)' }}>作答說明</span>
                        </div>
                        <p style={{ fontSize: '0.97rem', lineHeight: '1.85', color: 'var(--color-structural)', margin: '0 0 1rem' }}>
                            接下來有 <strong>30 道情境題</strong>，每道題有四個選項。
                        </p>
                        <p style={{ fontSize: '0.97rem', lineHeight: '1.85', color: 'var(--color-structural)', margin: '0 0 1rem' }}>
                            這不是考試，<strong>沒有「正確」或「錯誤」的答案</strong>。請依照您的<strong>第一直覺</strong>，選擇最符合真實的您的選項。
                        </p>
                        <p style={{ fontSize: '0.97rem', lineHeight: '1.85', color: 'var(--color-structural)', margin: '0' }}>
                            過多思考或符合「理想形象」的作答，反而無法讓我們看見真實的您。請放鬆心情，享受這個過程。
                        </p>
                    </div>

                    {/* Copyright / note */}
                    <p style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.35)', margin: '-0.5rem 0 0' }}>
                        測驗結果僅供本次招募內部評估使用
                    </p>

                    {/* CTA */}
                    <button
                        onClick={() => { setShowIntro(false); setQuestionStartTime(Date.now()); }}
                        className="btn-wizard btn-wizard-next"
                        style={{ width: '100%', justifyContent: 'center', padding: '1.1rem 2rem', fontSize: '1.05rem', fontWeight: '700', letterSpacing: '0.02em' }}
                    >
                        準備好了，開始測驗 <ChevronRight size={20} />
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Loading guard (questions not yet initialised) ──────────────────────────
    if (questions.length === 0) return null;

    const currentQuestion = questions[currentIndex];
    const progressPercentage = ((currentIndex) / 30) * 100;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="wizard-wrapper">
                {/* Global Sidebar layout matching other modules */}
                <aside className="wizard-sidebar">
                    <div className="sidebar-global-progress">
                        <div className="global-step completed">
                            <span className="global-step-num"><Check size={16} /></span>
                            <span className="global-step-title" style={{ opacity: 0.7 }}>基本資料</span>
                        </div>
                        <div className="global-step completed">
                            <span className="global-step-num"><Check size={16} /></span>
                            <span className="global-step-title" style={{ opacity: 0.7 }}>專業問答</span>
                        </div>
                        <div className="global-step active">
                            <span className="global-step-num">03</span>
                            <span className="global-step-title">性格測驗</span>
                        </div>
                    </div>

                    <div className="local-step-list">
                        <div className="local-step active">
                            性格色彩鑑定
                        </div>
                    </div>
                </aside>

                <main className="wizard-content">
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                            <h2 className="step-title" style={{ fontSize: '1.6rem', marginBottom: 0 }}>
                                問題 {currentIndex + 1}
                            </h2>
                            <span style={{ fontSize: '0.95rem', color: 'var(--color-structural)', fontWeight: '600', opacity: 0.6 }}>
                                進度 {currentIndex + 1} / 30
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                style={{ height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                            />
                        </div>
                    </div>

                    {/* Question Content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <AnimatePresence mode="wait">
                            {isSubmitting ? (
                                <motion.div
                                    key="submitting"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ padding: '4rem 0', textAlign: 'center', margin: 'auto' }}
                                >
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        {['#E4B359', '#4A4233', '#8F2F28', '#2D221C'].map((color, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -15, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>正在透過 AI 分析您的性格色彩...</h2>
                                    <p style={{ color: 'var(--color-structural)', opacity: 0.6 }}>解讀作答模式中，請稍候</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={currentQuestion.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ width: '100%', maxWidth: '800px' }}
                                >
                                    <h3 style={{ fontSize: '1.35rem', lineHeight: '1.6', marginBottom: '2.5rem', color: 'var(--color-structural)', fontWeight: '600' }}>
                                        {currentQuestion.text}
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        {currentQuestion.options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionClick(opt, idx)}
                                                className="form-input"
                                                style={{
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '1.2rem 1.5rem',
                                                    height: 'auto',
                                                    whiteSpace: 'normal',
                                                    backgroundColor: 'transparent'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                    e.currentTarget.style.boxShadow = '4px 4px 0px var(--color-primary)';
                                                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--border-structural)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.transform = 'translate(0, 0)';
                                                }}
                                            >
                                                <span style={{
                                                    fontFamily: 'var(--font-tech)',
                                                    color: 'var(--color-primary)',
                                                    fontWeight: '700',
                                                    marginRight: '1rem',
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {opt.letter}.
                                                </span>
                                                <span style={{ fontSize: '1.1rem' }}>{opt.text}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {error && (
                        <div style={{ color: 'var(--error-color)', marginTop: '2rem', padding: '1rem', background: 'rgba(143, 47, 40, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PersonalityTest;
