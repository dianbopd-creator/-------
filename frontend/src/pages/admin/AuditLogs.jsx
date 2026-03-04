import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

const AuditLogs = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch(`${apiUrl}/admin/audit-logs`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                });

                if (!response.ok) throw new Error('Failed to fetch audit logs');

                const data = await response.json();
                setLogs(data.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [apiUrl]);

    if (loading) return <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)', fontFamily: 'var(--font-tech)', fontSize: '1.2rem', justifyContent: 'center' }}><Loader2 className="animate-spin" /> 讀取系統日誌中...</div>;

    return (
        <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-structural)', paddingBottom: '1rem' }}>
                <div>
                    <h1 className="step-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>系統操作日誌 (Audit Logs)</h1>
                    <p className="step-desc" style={{ margin: 0 }}>供管理員檢視系統內的核心操作紀錄與權限變更歷程。</p>
                </div>
            </div>

            {error ? (
                <div style={{ background: 'rgba(224, 49, 49, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '1.5rem', fontFamily: 'var(--font-tech)', fontSize: '1rem' }}>
                    [SYSTEM_ERROR] 無法載入日誌: {error}
                </div>
            ) : (
                <div className="wizard-content" style={{ minHeight: 'auto', padding: '0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-structural)', background: 'rgba(255,255,255,0.2)' }}>
                                    <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>發生時間</th>
                                    <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>操作者</th>
                                    <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>動作類別</th>
                                    <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>目標物件</th>
                                    <th style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>詳細資訊</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => {
                                    const actionMap = {
                                        'LOGIN_SUCCESS': '登入成功',
                                        'LOGIN_FAILED': '登入失敗 (密碼錯誤)',
                                        'CHANGE_PASSWORD': '變更登入密碼',
                                        'UPDATE_PROFILE': '更新個人基本資料',
                                        'USER_CREATED': '新增全新使用者帳號',
                                        'ROLE_UPDATED': '更新使用者權限層級',
                                        'USER_DELETED': '刪除系統使用者帳號',
                                        'CREATE_JOB_CATEGORY': '新增甄試職缺階段',
                                        'UPDATE_JOB_CATEGORY': '更新職缺編輯內容',
                                        'DELETE_JOB_CATEGORY': '刪除特定職缺',
                                        'PASSWORD_RESET': '管理員重設密碼'
                                    };
                                    const displayAction = actionMap[log.action] || log.action;

                                    return (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-structural)', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1.2rem 2rem', fontFamily: 'var(--font-tech)', color: 'rgba(24,24,27,0.7)', whiteSpace: 'nowrap' }}>
                                                {formatDateTime(log.created_at)}
                                            </td>
                                            <td style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--color-structural)' }}>
                                                {log.admin_username || 'Unknown'}
                                            </td>
                                            <td style={{ padding: '1.2rem 2rem' }}>
                                                <span style={{ background: 'var(--color-structural)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontFamily: 'var(--font-tech)', fontSize: '0.8rem' }}>
                                                    {displayAction}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem 2rem', fontFamily: 'var(--font-tech)', color: 'var(--color-primary)' }}>
                                                {(() => {
                                                    try {
                                                        const p = JSON.parse(log.details || '{}');
                                                        if (p.target_entity) {
                                                            const entityMap = { 'Candidate': '候選人', 'User': '使用者', 'JobCategory': '甄試職缺', 'AdminUser': '管理員' };
                                                            const entityName = entityMap[p.target_entity] || p.target_entity;
                                                            return `${entityName} (ID: ${p.target_id || '未指定'})`;
                                                        }
                                                        return '-';
                                                    } catch { return '-'; }
                                                })()}
                                            </td>
                                            <td style={{ padding: '1.2rem 2rem', color: 'rgba(24,24,27,0.8)' }}>
                                                <pre style={{ margin: 0, fontFamily: 'var(--font-tech)', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                                                    {(() => {
                                                        try {
                                                            const p = JSON.parse(log.details || '{}');
                                                            if (typeof p.details === 'string') return p.details;

                                                            // Pretty print the fields nicely in Chinese
                                                            if (p.details && typeof p.details === 'object') {
                                                                const lines = Object.entries(p.details).map(([k, v]) => {
                                                                    const keyMap = { 'username': '帳號名稱', 'role': '系統權限', 'department': '所屬部門', 'position': '職缺標題', 'stages': '甄試流程設定' };
                                                                    const displayK = keyMap[k] || k;
                                                                    const displayV = Array.isArray(v) ? v.map(item => typeof item === 'object' ? item.name || JSON.stringify(item) : item).join(', ') : (typeof v === 'object' ? JSON.stringify(v) : v);
                                                                    return `• ${displayK}: ${displayV}`;
                                                                });
                                                                return lines.join('\n');
                                                            }
                                                            return JSON.stringify(p.details || p, null, 2);
                                                        } catch { return log.details; }
                                                    })()}
                                                </pre>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'rgba(24,24,27,0.5)', fontFamily: 'var(--font-tech)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                <ShieldAlert size={40} opacity={0.3} color="var(--color-structural)" />
                                                [NO_LOGS] 目前沒有任何系統操作紀錄
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ padding: '1.5rem 2rem', background: 'var(--color-structural)', color: 'white', fontFamily: 'var(--font-tech)', fontSize: '0.9rem', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ opacity: 0.5 }}>DIANBOPOPO RECRUITMENT SYSTEM v2.0 // AUDIT</span>
                        <span>共顯示 {logs.length} 筆日誌</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
