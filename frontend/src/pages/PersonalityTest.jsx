import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import { QuestionPicker } from '../utils/colortest_picker';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const PersonalityTest = () => {
    const navigate = useNavigate();
    const candidateId = sessionStorage.getItem('candidateId');

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

            // Clear sessionStorage and navigate to thank you
            sessionStorage.removeItem('qa_draft_' + candidateId);
            sessionStorage.removeItem('candidateId');
            navigate('/thank-you');
        } catch (err) {
            console.error(err);
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    if (questions.length === 0) return null; // Loading state

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
