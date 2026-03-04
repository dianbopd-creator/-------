import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Home, ShieldCheck } from 'lucide-react';

const ThankYou = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(30); // Use 30 seconds instead of 10s based on user feedback

    useEffect(() => {
        // Clear all session storage on landing here to reset for the next candidate
        sessionStorage.clear();

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div style={{
            width: '100%',
            minHeight: '80vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-xl"
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center',
                    padding: '4rem 3rem'
                }}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            boxShadow: '0 0 30px rgba(138, 43, 226, 0.4)'
                        }}
                    >
                        <CheckCircle size={40} color="var(--color-structural)" strokeWidth={2.5} />
                    </motion.div>
                </div>

                <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--color-structural)', marginBottom: '1rem' }}>
                    感謝您的填寫！
                </h2>

                <p style={{ fontSize: '1.1rem', color: 'var(--color-structural)', opacity: 0.8, marginBottom: '2rem', lineHeight: '1.6' }}>
                    您的面試資料（包含基本資料、專業問答與性格測驗）已完整且安全地儲存至加密伺服器後台。<br />
                    人資團隊將會盡快與您聯繫後續事宜。
                </p>

                <div style={{
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid var(--border-structural)',
                    padding: '1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '3rem'
                }}>
                    <ShieldCheck size={20} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-structural)', fontWeight: '500' }}>資料已自動安全歸檔完畢</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-wizard btn-wizard-next"
                        style={{ padding: '1rem 2.5rem', width: 'auto' }}
                    >
                        <Home size={20} /> 返回首頁
                    </button>
                    <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-tech)', color: 'var(--color-structural)', opacity: 0.5 }}>
                        系統將在 {countdown} 秒後自動為您清理畫面並返回首頁
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default ThankYou;
