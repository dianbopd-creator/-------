import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Loader2, Save, Send, MessageSquarePlus, Briefcase, FileText, BrainCircuit, Printer, RefreshCw, Upload, FileUp, CheckCircle, XCircle, ClipboardList, Trash2, UserCircle } from 'lucide-react';
import { formatShortDateTime } from '../../utils/dateUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import questionsData from '../../data/questions.json';
import InterviewScoreForm from '../../components/InterviewScoreForm';
import { useCandidate, useComments, useTags } from '../../hooks/useApi';

// Static fallback map from bundled questions.json (old alphanumeric codes)
const STATIC_QUESTION_MAP = questionsData.reduce((acc, cat) => {
    cat.questions.forEach(q => acc[q.id] = q.text);
    return acc;
}, {});

// ─── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    '待處理': { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
    '初篩合格': { bg: '#f0fdf4', color: '#15803d', border: '#dcfce7' },
    '待面試': { bg: '#eff6ff', color: '#1d4ed8', border: '#dbeafe' },
    '核定中': { bg: '#fdf4ff', color: '#7e22ce', border: '#f3e8ff' },
    '即將到職': { bg: '#f0fdf4', color: '#166534', border: '#dcfce7' },
    '錄用': { bg: '#f0fdf4', color: '#15803d', border: '#dcfce7' },
};
const StatusBadge = ({ status }) => {
    const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
    return (
        <span style={{ padding: '0.35rem 0.8rem', borderRadius: '9999px', fontWeight: '600', fontSize: '0.85rem', background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontFamily: 'var(--font-heading)' }}>
            {status || '待處理'}
        </span>
    );
};

// ─── Markdown styling props ────────────────────────────────────────────────────
const MD_COMPONENTS = {
    h1: ({ ...props }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.8em', borderBottom: '3px solid var(--color-primary)', paddingBottom: '0.3em', color: 'var(--color-structural)' }} {...props} />,
    h2: ({ ...props }) => <h2 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '1.8em 0 0.6em', color: 'var(--color-structural)', paddingBottom: '4px', borderBottom: '1px solid var(--border-dark)' }} {...props} />,
    h3: ({ ...props }) => <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '1.2em 0 0.4em', color: 'var(--color-structural)' }} {...props} />,
    p: ({ ...props }) => <p style={{ marginBottom: '0.8em', lineHeight: '1.9' }} {...props} />,
    ul: ({ ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.4em', marginBottom: '0.8em' }} {...props} />,
    ol: ({ ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.4em', marginBottom: '0.8em' }} {...props} />,
    li: ({ ...props }) => <li style={{ marginBottom: '0.4em', lineHeight: '1.8' }} {...props} />,
    strong: ({ ...props }) => <strong style={{ color: 'var(--color-primary)', fontWeight: '700' }} {...props} />,
    hr: ({ ...props }) => <hr style={{ border: 'none', borderTop: '1px dashed var(--border-dark)', margin: '1.2em 0' }} {...props} />,
    blockquote: ({ ...props }) => <blockquote style={{ borderLeft: '4px solid var(--color-primary)', margin: '0.8em 0', background: 'rgba(15, 23, 42, 0.04)', padding: '0.6em 1em', color: 'var(--color-structural-light)', borderRadius: '0 4px 4px 0' }} {...props} />,
    table: ({ ...props }) => <div style={{ overflowX: 'auto', marginBottom: '1.2em' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }} {...props} /></div>,
    thead: ({ ...props }) => <thead style={{ background: 'rgba(15, 23, 42, 0.04)' }} {...props} />,
    th: ({ ...props }) => <th style={{ padding: '0.6em 0.9em', textAlign: 'left', borderBottom: '2px solid var(--color-primary)', fontWeight: '700', color: 'var(--color-structural)', fontSize: '0.8rem' }} {...props} />,
    td: ({ ...props }) => <td style={{ padding: '0.6em 0.9em', borderBottom: '1px solid var(--border-structural)', verticalAlign: 'top', lineHeight: '1.7' }} {...props} />,
    code: ({ inline, ...props }) => inline
        ? <code style={{ background: 'rgba(15, 23, 42, 0.06)', padding: '0.1em 0.35em', borderRadius: '3px', fontFamily: 'var(--font-tech)', fontSize: '0.85em' }} {...props} />
        : <pre style={{ background: 'rgba(15, 23, 42, 0.04)', padding: '1em', overflowX: 'auto', borderRadius: '8px', marginBottom: '1em' }}><code style={{ fontFamily: 'var(--font-tech)', fontSize: '0.85em' }} {...props} /></pre>,
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CandidateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    const authHeaders = { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` };

    const { data: candBody, isLoading: candLoading, isError: candError, mutateCandidate } = useCandidate(id);
    const { comments, isLoading: commLoading, mutateComments } = useComments(id);
    const { tags: allTags, mutateTags } = useTags();

    const data = candBody && candBody.candidate ? candBody : null;
    const loading = candLoading || commLoading;
    const error = candError ? candError.message : null;

    const [aiGenerating, setAiGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('candidate'); // 'candidate' | 'hr'

    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    const [newComment, setNewComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [uploadState, setUploadState] = useState({ loading: false, error: '', success: '' });

    // Merged question map: static json (old codes) + DB questions (new integer IDs)
    const [questionMap, setQuestionMap] = useState(STATIC_QUESTION_MAP);
    useEffect(() => {
        fetch(`${apiUrl}/admin/questions`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } })
            .then(r => r.ok ? r.json() : null)
            .then(body => {
                if (body && Array.isArray(body.data)) {
                    const dbMap = {};
                    body.data.forEach(q => {
                        dbMap[String(q.id)] = q.question_text;  // integer id → text
                    });
                    setQuestionMap(prev => ({ ...prev, ...dbMap }));
                }
            })
            .catch(() => { });
    }, []);

    // Removed fetchComments, fetchTags, fetchData

    const handleCreateTag = async (e) => {
        if (e) e.preventDefault();
        const trimmed = newTagName.trim();
        if (!trimmed) return;
        try {
            const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
            const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            const res = await fetch(`${apiUrl}/admin/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ name: trimmed, color: randomColor })
            });
            if (res.ok) {
                setNewTagName('');
                mutateTags();
            } else {
                const j = await res.json();
                alert(j.error || '建立標籤失敗');
            }
        } catch (err) { alert(err.message); }
    };




    const handleToggleCandidateTag = async (tagId, isCurrentlySelected) => {
        try {
            const currentTagIds = (data?.tags || []).map(t => t.id);
            const newTagIds = isCurrentlySelected
                ? currentTagIds.filter(tid => tid !== tagId)
                : [...currentTagIds, tagId];

            const res = await fetch(`${apiUrl}/admin/candidates/${id}/tags`, {
                method: 'PUT',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagIds: newTagIds })
            });
            if (!res.ok) throw new Error('標籤更新失敗');
            mutateCandidate();
        } catch (err) {
            alert(err.message);
        }
    };


    const handleResumeUpload = async (file) => {
        if (!file) return;
        setUploadState({ loading: true, error: '', success: '' });
        const formData = new FormData();
        formData.append('resume', file);
        try {
            const res = await fetch(`${apiUrl}/admin/candidates/${id}/resume-upload`, {
                method: 'POST', headers: authHeaders, body: formData
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || '上傳失敗');
            setUploadState({ loading: false, error: '', success: `✅ 已成功解析 ${json.length?.toLocaleString()} 字的履歷內容` });
            mutateCandidate();
        } catch (err) {
            setUploadState({ loading: false, error: err.message, success: '' });
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setCommenting(true);
        try {
            const res = await fetch(`${apiUrl}/admin/candidates/${id}/comments`, {
                method: 'POST',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });
            if (!res.ok) throw new Error('Failed to add comment');
            setNewComment('');
            mutateComments();
        } catch (err) { alert(err.message); }
        finally { setCommenting(false); }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('確定要刪除這則留言嗎？')) return;
        try {
            const res = await fetch(`${apiUrl}/admin/candidates/${id}/comments/${commentId}`, {
                method: 'DELETE', headers: authHeaders
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || '刪除失敗'); }
            mutateComments();
        } catch (err) { alert(err.message); }
    };


    const handleRegenerateAi = async () => {
        if (!window.confirm('確定要重新產生 AI 評估報告嗎？約需 30~60 秒。')) return;
        setAiGenerating(true);
        try {
            const res = await fetch(`${apiUrl}/admin/candidates/${id}/analyze`, {
                method: 'POST', headers: authHeaders
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
            await mutateCandidate();
        } catch (err) { alert('錯誤: ' + err.message); }
        finally { setAiGenerating(false); }
    };

    const handleDeleteResume = async () => {
        if (!window.confirm('確定要刪除這份外部履歷嗎？刪除後 AI 再次分析將不含此份履歷內容。')) return;
        try {
            const res = await fetch(`${apiUrl}/admin/candidates/${id}/resume`, {
                method: 'DELETE', headers: authHeaders
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || '刪除失敗'); }
            mutateCandidate();
        } catch (err) { alert('錯誤: ' + err.message); }
    };

    const handlePrint = () => {
        if (!data) return;
        const { candidate, answers, personality, aiReport, workExperiences } = data;

        const workExpHtml = (workExperiences || []).length > 0
            ? workExperiences.map((exp, i) => `<div class="card experience-card"><div class="exp-header"><strong>${exp.job_title || '未知職稱'}</strong> <span class="exp-years">${exp.years || ''}</span></div><div class="exp-achievements">${exp.achievements || ''}</div></div>`).join('')
            : '<p class="empty-state">無工作經歷資料</p>';

        const qaHtml = (answers || []).map((a, i) =>
            `<div class="card qa-card"><div class="qa-q"><span class="q-num">Q${i + 1}.</span> ${questionMap[a.question_code] || a.question_code}</div><div class="qa-a">${a.answer_text || ''}</div></div>`
        ).join('');

        const fpaHtml = personality
            ? `<div class="fpa-grid">
                <div class="fpa-item"><div class="fpa-score">${personality.red_score ?? 0}</div><div class="fpa-label">紅色</div></div>
                <div class="fpa-item"><div class="fpa-score">${personality.yellow_score ?? 0}</div><div class="fpa-label">黃色</div></div>
                <div class="fpa-item"><div class="fpa-score">${personality.green_score ?? 0}</div><div class="fpa-label">綠色</div></div>
                <div class="fpa-item"><div class="fpa-score">${personality.blue_score ?? 0}</div><div class="fpa-label">藍色</div></div>
                <div class="fpa-item"><div class="fpa-score">${personality.cri_score ?? 0}/10</div><div class="fpa-label">CRI 真實度</div></div>
               </div>`
            : '<p class="empty-state">尚未完成測驗</p>';

        const aiHtml = aiReport?.raw_analysis
            ? aiReport.raw_analysis
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^# (.+)$/gm, '<h2>$1</h2>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
                .replace(/^- (.+)$/gm, '<li><span>•</span> $1</li>')
                .replace(/\n\n/g, '</p><p>')
            : '<p class="empty-state">AI 尚未產生分析報告</p>';

        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>${candidate.name} - 評鑑報告</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Inter:wght@400;600;700&display=swap');
@page { size: A4; margin: 12mm 15mm; }
body { font-family: 'Inter', 'Noto Sans TC', sans-serif; font-size: 10.5pt; color: #000; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
.header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
.header h1 { font-size: 22pt; font-weight: 700; color: #000; margin: 0 0 4px 0; letter-spacing: 2px; }
.header .meta { font-size: 10pt; color: #333; font-weight: 500; display: inline-flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.header .badge { background: #fff; padding: 2px 8px; border-radius: 4px; color: #000; border: 1px solid #ccc; }
section { margin-bottom: 20px; page-break-inside: auto; }
h2.section-title { font-size: 12pt; color: #000; border-bottom: 1px solid #999; padding-bottom: 4px; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 1px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.info-box { background: #fff; border: 1px solid #ccc; padding: 6px 10px; border-radius: 4px; }
.info-label { font-size: 8.5pt; color: #555; font-weight: 600; margin-bottom: 2px; text-transform: uppercase; }
.info-value { font-size: 10pt; color: #000; font-weight: 500; }
.card { background: #fff; border: 1px solid #ccc; border-left: 4px solid #666; padding: 10px 12px; border-radius: 4px; margin-bottom: 10px; page-break-inside: avoid; }
.exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.exp-header strong { font-size: 11pt; color: #000; }
.exp-years { font-size: 9pt; color: #333; background: #eee; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
.exp-achievements { font-size: 9.5pt; color: #222; line-height: 1.5; white-space: pre-wrap; }
.qa-card { border-left-color: #666; }
.qa-q { font-weight: 700; color: #000; margin-bottom: 6px; font-size: 10.5pt; }
.q-num { color: #555; margin-right: 4px; font-weight: bold; }
.qa-a { color: #222; white-space: pre-wrap; background: #fafafa; border: 1px solid #eee; padding: 8px 10px; border-radius: 4px; font-size: 9.5pt; }
.fpa-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center; margin-bottom: 10px; }
.fpa-item { background: #fff; border: 1px solid #ccc; border-top: 3px solid #666; padding: 10px 4px; border-radius: 4px; page-break-inside: avoid; }
.fpa-score { font-size: 16pt; font-weight: 700; color: #000; font-family: 'Inter', sans-serif; line-height: 1; margin-bottom: 4px; }
.fpa-label { font-size: 8.5pt; color: #333; font-weight: 600; }
.ai-report { background: #fff; border: 1px solid #ccc; padding: 16px; border-radius: 4px; color: #000; }
.ai-report h2 { font-size: 12pt; color: #000; margin-top: 0; padding-bottom: 6px; border-bottom: 1px solid #ccc; }
.ai-report h3 { font-size: 10.5pt; color: #000; margin: 12px 0 6px 0; }
.ai-report p { margin: 0 0 8px 0; }
.ai-report ul { margin: 0 0 10px 0; padding-left: 20px; }
.ai-report li { margin-bottom: 4px; }
.ai-report strong { color: #000; font-weight: bold; }
.ai-report blockquote { border-left: 3px solid #666; background: #fafafa; padding: 6px 10px; margin: 10px 0; border-radius: 0 4px 4px 0; font-style: italic; color: #333; }
.empty-state { color: #666; font-size: 9.5pt; font-style: italic; text-align: center; padding: 10px; }
.page-footer { text-align: center; font-size: 8pt; color: #666; margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 8px; }
</style></head>
<body>
<div class="header">
    <h1>${candidate.name}</h1>
    <div class="meta">
        <span class="badge">應徵：${candidate.department || ''} - ${candidate.position || ''}</span>
        <span class="badge">狀態：${candidate.status || '待處理'}</span>
        <span class="badge">電話：${candidate.phone || '-'}</span>
    </div>
</div>

<section>
    <h2>📋 基本與期望條件</h2>
    <div class="grid-2">
        <div class="info-box"><div class="info-label">聯絡電話</div><div class="info-value">${candidate.phone || '-'}</div></div>
        <div class="info-box"><div class="info-label">出生日期</div><div class="info-value">${candidate.birth_date || '-'}</div></div>
        <div class="info-box"><div class="info-label">最高學歷</div><div class="info-value">${candidate.education_school || '-'} ${candidate.education_major ? `(${candidate.education_major})` : ''}</div></div>
        <div class="info-box"><div class="info-label">駕照</div><div class="info-value">${candidate.driving_license || '無'}</div></div>
        <div class="info-box"><div class="info-label">目前薪資</div><div class="info-value">月 ${candidate.current_salary_monthly || 'N/A'} / 年 ${candidate.current_salary_annual || 'N/A'}</div></div>
        <div class="info-box"><div class="info-label">期望薪資</div><div class="info-value">月 ${candidate.expected_salary_monthly || 'N/A'} / 年 ${candidate.expected_salary_annual || 'N/A'}</div></div>
    </div>
</section>

<section>
    <h2>💡 動機與職涯規劃</h2>
    <div class="grid-2" style="margin-bottom: 12px;">
        <div class="info-box"><div class="info-label">離職原因</div><div class="info-value" style="white-space:pre-wrap;">${candidate.leave_reason || '-'}</div></div>
        <div class="info-box"><div class="info-label">應徵動機</div><div class="info-value" style="white-space:pre-wrap;">${candidate.motivation || '-'}</div></div>
    </div>
    <div class="info-box" style="margin-bottom: 12px;">
        <div class="info-label">人生夢想</div>
        <div class="info-value" style="white-space:pre-wrap;">${candidate.dream || '-'}</div>
    </div>
    <div class="grid-3">
        <div class="info-box"><div class="info-label">1年內短程目標</div><div class="info-value">${candidate.career_plan_short || '-'}</div></div>
        <div class="info-box"><div class="info-label">3~5年中程目標</div><div class="info-value">${candidate.career_plan_mid || '-'}</div></div>
        <div class="info-box"><div class="info-label">5年後長程目標</div><div class="info-value">${candidate.career_plan_long || '-'}</div></div>
    </div>
</section>

<section>
    <h2>💼 工作經歷</h2>
    ${workExpHtml}
</section>

<section>
    <h2>📝 專業問答紀錄</h2>
    ${qaHtml}
</section>

<section>
    <h2>🧬 嘉樂 FPA 性格測驗結果</h2>
    ${fpaHtml}
</section>

<section>
    <h2>🤖 AI 人才深度評鑑報告</h2>
    <div class="ai-report"><p>${aiHtml}</p></div>
</section>

<div class="page-footer">
    列印時間：${new Date().toLocaleString('zh-TW')} | 嘉樂醫療系統
</div>
</body></html>`);
        win.document.close();
        setTimeout(() => win.print(), 400);
    };

    // ── GUARDS ──
    if (loading) return <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)', justifyContent: 'center', fontFamily: 'var(--font-tech)', fontSize: '1.1rem' }}><Loader2 className="animate-spin" /> 載入中...</div>;
    if (error || !data) return <div style={{ padding: '3rem', color: 'var(--color-error)', fontFamily: 'var(--font-tech)', textAlign: 'center' }}>[ERROR] {error || '找不到求職者'}</div>;

    const { candidate, workExperiences, answers, personality, aiReport } = data;


    // ── Tabs Config ──
    const TABS = [
        { key: 'candidate', icon: <FileText size={17} />, label: '候選人資料' },
        { key: 'resume104', icon: <FileUp size={17} />, label: '104履歷' },
        { key: 'ai', icon: <BrainCircuit size={17} />, label: 'AI 履歷解析' },
        { key: 'hr', icon: <ClipboardList size={17} />, label: 'HR 評估與留言' },
    ];

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Full-page AI overlay ── */}
            {aiGenerating && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>AI 深度分析中...</div>
                        <div style={{ fontFamily: 'var(--font-tech)', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', maxWidth: '380px' }}>正在整合履歷、問答與性格測驗，產出八大章節完整報告</div>
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {[0, 1, 2, 3, 4].map(i => (
                                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', animation: `pulse 1.4s ease-in-out ${i * 0.25}s infinite` }} />
                            ))}
                        </div>
                        <div style={{ marginTop: '1rem', fontFamily: 'var(--font-tech)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>預計 30 ~ 60 秒，請勿關閉頁面</div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-structural)', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'var(--bg-main)', width: '48px', height: '48px', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--color-structural)', borderRadius: '9999px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-main)'; }}
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="step-title" style={{ fontSize: '2.2rem', margin: '0 0 0.4rem 0' }}>{candidate.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.9rem', color: 'rgba(45,34,28,0.55)', fontFamily: 'var(--font-tech)' }}>
                                {candidate.department || '未指定'} · {candidate.position || '未指定'}
                            </span>
                            {/* ── 甄試狀態（唯讀，與 AdminDashboard 同步） ── */}
                            <StatusBadge status={candidate.status} />

                            {/* Tags */}
                            {data.tags && data.tags.map(t => (
                                <span key={t.id} style={{ fontSize: '0.8rem', background: t.color + '20', color: t.color, padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', border: `1px solid ${t.color}40`, display: 'flex', alignItems: 'center' }}>
                                    {t.name}
                                </span>
                            ))}

                            <div style={{ position: 'relative' }} onMouseLeave={() => setIsTagDropdownOpen(false)}>
                                <button onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)} style={{ background: 'transparent', border: '1px dashed var(--border-dark)', borderRadius: '12px', padding: '2px 10px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--color-structural)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    + 標籤
                                </button>
                                {isTagDropdownOpen && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#fff', border: '1px solid var(--border-structural)', borderRadius: '8px', zIndex: 10, padding: '0.5rem', width: '240px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        {allTags.map(tag => {
                                            const isSelected = data.tags && data.tags.some(t => t.id === tag.id);
                                            return (
                                                <div
                                                    key={tag.id}
                                                    onClick={() => handleToggleCandidateTag(tag.id, isSelected)}
                                                    style={{ padding: '6px 8px', fontSize: '0.85rem', cursor: 'pointer', background: isSelected ? 'rgba(15,23,42,0.05)' : 'transparent', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.08)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(15,23,42,0.05)' : 'transparent'}
                                                >
                                                    <span style={{ color: tag.color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tag.color }} />
                                                        {tag.name}
                                                    </span>
                                                    {isSelected && <CheckCircle size={14} color="var(--color-primary)" />}
                                                </div>
                                            )
                                        })}
                                        {allTags.length === 0 && <div style={{ fontSize: '0.8rem', color: '#888', padding: '4px 8px' }}>尚無可用標籤</div>}
                                        <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '4px', paddingTop: '8px', display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                            <input type="text" placeholder="輸入新標籤..." value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTag()} style={{ flex: 1, fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)', outline: 'none' }} />
                                            <button onClick={handleCreateTag} disabled={!newTagName.trim()} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', opacity: newTagName.trim() ? 1 : 0.5 }}>新增</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    className="btn-wizard-next no-print"
                    onClick={handlePrint}
                    style={{ background: 'var(--color-primary)', color: '#ffffff', padding: '0.7rem 1.4rem', margin: 0, fontSize: '0.95rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Printer size={18} />列印 / 匯出 PDF
                </button>
            </div>

            {/* ── Tab Bar ── */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                            border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                            borderRadius: '9999px',
                            background: activeTab === tab.key ? 'var(--color-primary)' : 'rgba(15, 23, 42, 0.06)',
                            color: activeTab === tab.key ? '#ffffff' : 'var(--color-structural)',
                            transition: 'all 0.2s', fontFamily: 'var(--font-heading)',
                        }}
                        onMouseEnter={e => { if (activeTab !== tab.key) { e.currentTarget.style.color = 'var(--color-structural)'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.08)'; } }}
                        onMouseLeave={e => { if (activeTab !== tab.key) { e.currentTarget.style.color = 'var(--color-structural-light)'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.04)'; } }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ══════════════ TAB: 候選人資料 ══════════════ */}
            {activeTab === 'candidate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Basic Info */}
                    <div className="wizard-content" style={{ minHeight: 'auto', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.4rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', borderBottom: '2px solid rgba(45,34,28,0.08)', paddingBottom: '0.9rem' }}>
                            <Briefcase size={22} color="var(--color-primary)" /> 基本資料
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', fontSize: '0.95rem' }}>
                            {[
                                { label: '聯絡電話', value: candidate.phone },
                                { label: '出生日期', value: candidate.birth_date || '未提供' },
                                { label: '最高學歷', value: `${candidate.education_school || ''} ${candidate.education_major ? `(${candidate.education_major})` : ''}` },
                                { label: '駕照', value: candidate.driving_license || '無' },
                                { label: '目前薪資', value: `月 ${candidate.current_salary_monthly || 'N/A'} / 年 ${candidate.current_salary_annual || 'N/A'}` },
                                { label: '期望薪資', value: `月 ${candidate.expected_salary_monthly || 'N/A'} / 年 ${candidate.expected_salary_annual || 'N/A'}` },
                            ].map(f => (
                                <div key={f.label}>
                                    <div style={{ color: 'rgba(45,34,28,0.5)', fontSize: '0.78rem', fontFamily: 'var(--font-tech)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-structural)' }}>{f.value}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(45,34,28,0.08)', paddingTop: '1.2rem' }}>
                            {[
                                { label: '專業技能', value: candidate.skills },
                                { label: '考取證照', value: candidate.certifications },
                                { label: '離職原因', value: candidate.leave_reason },
                                { label: '應徵動機', value: candidate.motivation },
                                { label: '人生夢想', value: candidate.dream },
                            ].map(f => (
                                <div key={f.label}>
                                    <div style={{ color: 'rgba(45,34,28,0.5)', fontSize: '0.78rem', fontFamily: 'var(--font-tech)', marginBottom: '0.2rem' }}>{f.label}</div>
                                    <div style={{ fontWeight: 500, color: 'var(--color-structural)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{f.value || '未填寫'}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-structural)', paddingTop: '1.2rem' }}>
                            {[
                                { label: '短程目標（1年內）', value: candidate.career_plan_short },
                                { label: '中程目標（3～5年）', value: candidate.career_plan_mid },
                                { label: '長程目標（5年後）', value: candidate.career_plan_long },
                            ].map(f => (
                                <div key={f.label} style={{ background: '#f8fafc', border: '1px solid var(--border-structural)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                                    <div style={{ color: 'var(--color-structural-light)', fontSize: '0.78rem', fontFamily: 'var(--font-tech)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</div>
                                    <div style={{ fontWeight: 500, color: 'var(--color-structural)' }}>{f.value || '未填寫'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Work Experiences */}
                    <div className="wizard-content" style={{ minHeight: 'auto', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.4rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', borderBottom: '2px solid rgba(45,34,28,0.08)', paddingBottom: '0.9rem' }}>
                            <Briefcase size={22} color="var(--color-primary)" /> 工作經歷
                            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'rgba(45,34,28,0.4)', fontFamily: 'var(--font-tech)' }}>共 {workExperiences?.length || 0} 筆</span>
                        </h2>
                        {workExperiences?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {workExperiences.map((exp, idx) => (
                                    <div key={idx} style={{ background: '#ffffff', padding: '1.4rem', border: '1px solid var(--border-structural)', borderLeft: '4px solid var(--color-primary)', borderRadius: '0 12px 12px 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <div style={{ fontWeight: '700', color: 'var(--color-structural)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>{exp.job_title || '未填寫職稱'}</div>
                                            <span style={{ background: '#eff3f8', color: 'var(--color-structural-light)', padding: '2px 12px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: '600' }}>{exp.years || '-'}</span>
                                        </div>
                                        {exp.achievements && <div style={{ color: 'var(--color-structural)', whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '0.95rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>{exp.achievements}</div>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-structural-light)', fontFamily: 'var(--font-tech)', textAlign: 'center', padding: '2rem' }}>尚無工作經歷資料</div>
                        )}
                    </div>

                    {/* QA */}
                    <div className="wizard-content" style={{ minHeight: 'auto', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.4rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', borderBottom: '2px solid rgba(45,34,28,0.08)', paddingBottom: '0.9rem' }}>
                            <FileText size={22} color="var(--color-primary)" /> 專業職能問答
                            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'rgba(45,34,28,0.4)', fontFamily: 'var(--font-tech)' }}>共 {answers?.length || 0} 題</span>
                        </h2>
                        {answers?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                {answers.map((ans, idx) => (
                                    <div key={idx} style={{ background: '#ffffff', padding: '1.4rem', border: '1px solid var(--border-structural)', borderLeft: '4px solid var(--color-accent-blue)', borderRadius: '0 12px 12px 0' }}>
                                        <div style={{ fontWeight: '700', color: 'var(--color-structural)', marginBottom: '0.75rem', fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>
                                            <span style={{ color: 'var(--color-accent-blue)', marginRight: '6px' }}>Q{idx + 1}.</span>
                                            {questionMap[ans.question_code] || ans.question_text || ans.question_code}
                                        </div>
                                        <div style={{ color: 'var(--color-structural)', whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '0.95rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>{ans.answer_text}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-structural-light)', fontFamily: 'var(--font-tech)', textAlign: 'center', padding: '2rem' }}>尚無問答紀錄</div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════ TAB: 104履歷 ══════════════ */}
            {activeTab === 'resume104' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="wizard-content" style={{ minHeight: 'auto', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(45,34,28,0.08)', paddingBottom: '0.9rem', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.4rem', margin: '0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>
                                <FileUp size={22} color="var(--color-primary)" /> 104履歷原件
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => document.getElementById(`resume-hr-${id}`).click()}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1.2rem',
                                        background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px',
                                        fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(228,179,89,0.2)'
                                    }}
                                >
                                    <Upload size={16} /> 上傳 PDF/Word 履歷
                                </button>
                                <input id={`resume-hr-${id}`} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) handleResumeUpload(f); e.target.value = ''; }} />
                            </div>
                        </div>

                        {(uploadState.loading || uploadState.success || uploadState.error || candidate.resume_text) && (
                            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {uploadState.loading && <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader2 size={18} className="animate-spin" /> 解析中...</div>}
                                {uploadState.success && <div style={{ fontSize: '0.85rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(21,128,61,0.05)', padding: '6px 12px', borderRadius: '4px' }}><CheckCircle size={14} /> {uploadState.success}</div>}
                                {uploadState.error && <div style={{ fontSize: '0.85rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(220,38,38,0.05)', padding: '6px 12px', borderRadius: '4px' }}><XCircle size={14} /> {uploadState.error}</div>}
                                {candidate.resume_text && !uploadState.loading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '4px 10px', background: 'rgba(15,23,42,0.03)', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--color-structural)' }}><CheckCircle size={14} color="#15803d" /> 已儲存文字：{candidate.resume_text.length.toLocaleString()} 字</div>
                                        <button
                                            onClick={handleDeleteResume}
                                            title="刪除此份履歷"
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', border: '1px solid rgba(220,38,38,0.35)', borderRadius: '4px', background: 'rgba(220,38,38,0.06)', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.15s' }}
                                        >
                                            <Trash2 size={12} /> 清除
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {candidate.resume_text ? (
                            <iframe
                                key={id}
                                src={`${apiUrl}/admin/candidates/${id}/resume-file?t=${Date.now()}`}
                                title="104履歷"
                                style={{
                                    width: '100%',
                                    height: '85vh',
                                    border: '1px solid rgba(45,34,28,0.12)',
                                    borderRadius: '6px',
                                    background: '#fff'
                                }}
                            />
                        ) : (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(45,34,28,0.4)', fontFamily: 'var(--font-tech)', border: '2px dashed rgba(45,34,28,0.15)', borderRadius: '8px' }}>
                                <FileUp size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <div style={{ fontWeight: 'bold', marginBottom: '0.4rem' }}>尚未上傳 104 履歷</div>
                                <div style={{ fontSize: '0.82rem' }}>請在右側區塊上傳檔案</div>
                            </div>
                        )}
                    </div>

                    {/* 右側欄已整合至上方 */}
                </div>
            )}

            {/* ══════════════ TAB: AI 履歷解析 ══════════════ */}
            {activeTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* ── Left: AI Report ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* FPA */}
                        {personality && (
                            <div className="wizard-content" style={{ minHeight: 'auto', padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--color-structural)', fontFamily: 'var(--font-tech)', margin: '0 0 1rem 0', letterSpacing: '1px' }}>// 嘉樂 FPA 四色性格測驗結果</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                                    {[
                                        { key: 'red', label: '🔴 紅色', sub: '熱情外向', color: '#ef4444' },
                                        { key: 'yellow', label: '🟡 黃色', sub: '目標導向', color: '#eab308' },
                                        { key: 'green', label: '🟢 綠色', sub: '穩定和諧', color: '#22c55e' },
                                        { key: 'blue', label: '🔵 藍色', sub: '謹慎分析', color: '#3b82f6' },
                                        { key: 'cri', label: '⚡ CRI', sub: '真實度', color: '#8b5cf6' },
                                    ].map(({ key, label, sub, color }) => (
                                        <div key={key} style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `4px solid ${color}`, borderRadius: '4px 4px 0 0', textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.2rem' }}>{label}</span>
                                            <span style={{ fontSize: '0.68rem', color: 'rgba(45,34,28,0.45)', marginBottom: '0.4rem' }}>{sub}</span>
                                            <strong style={{ fontSize: '1.8rem', color: 'var(--color-structural)', fontFamily: 'var(--font-tech)' }}>{personality[`${key}_score`] ?? 0}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Report */}
                        <div className="wizard-content" style={{ minHeight: 'auto', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid rgba(45,34,28,0.08)', paddingBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>
                                    <BrainCircuit size={22} color="var(--color-primary)" /> AI 人才評鑑報告
                                </h2>
                                <button
                                    className="btn-wizard-next no-print"
                                    onClick={handleRegenerateAi}
                                    disabled={aiGenerating}
                                    style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem', width: 'auto', display: 'flex', gap: '6px', opacity: aiGenerating ? 0.5 : 1 }}
                                >
                                    <RefreshCw size={15} style={{ animation: aiGenerating ? 'spin 1s linear infinite' : 'none' }} />
                                    {aiGenerating ? '分析中...' : '重新產生'}
                                </button>
                            </div>

                            {aiReport ? (
                                <div style={{ background: 'rgba(228,179,89,0.02)', border: '1px solid rgba(228,179,89,0.25)', padding: '2rem', borderRadius: '6px', color: 'var(--color-structural)', lineHeight: '1.9', fontSize: '0.96rem' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                                        {aiReport.raw_analysis}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div style={{ color: 'rgba(45,34,28,0.45)', fontFamily: 'var(--font-tech)', padding: '3rem', textAlign: 'center', border: '1px dashed rgba(45,34,28,0.2)', borderRadius: '8px' }}>
                                    <BrainCircuit size={36} style={{ marginBottom: '1rem', opacity: 0.25 }} />
                                    <div>尚未產生 AI 分析報告</div>
                                    <div style={{ fontSize: '0.82rem', marginTop: '0.5rem', opacity: 0.7 }}>點擊右上方「重新產生」按鈕觸發</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right Sidebar: HR Tools ── */}
                    <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* hr tab layout without resume upload */}
                    </div>
                </div>
            )}

            {/* ══════════════ TAB: HR 評估與留言 ══════════════ */}
            {activeTab === 'hr' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem', alignItems: 'start' }}>

                    {/* ── Left: Internal Comments ── */}
                    <div style={{ background: '#fff', border: '1px solid var(--border-structural)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', maxHeight: '850px' }}>
                        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-structural)', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
                            <MessageSquarePlus size={20} color="var(--color-primary)" />
                            <span style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>內部協作留言</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-structural-light)', background: 'rgba(15,23,42,0.06)', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{comments.length} 則</span>
                        </div>

                        {/* Comments List (Fill space) */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f1f5f9' }}>
                            {comments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-structural-light)', fontSize: '0.9rem' }}>
                                    <MessageSquarePlus size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                                    <div>尚無留言，成為第一個留言的人！</div>
                                </div>
                            ) : (
                                comments.map(c => {
                                    const isOwn = c.admin_id === user?.id;
                                    const initials = (c.admin_name || c.username || '?').charAt(0).toUpperCase();
                                    const timeStr = formatShortDateTime(c.created_at);

                                    return (
                                        <div key={c.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                                            {/* Avatar */}
                                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isOwn ? 'var(--color-primary)' : '#475569', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '0.95rem', fontWeight: '700', color: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                                {c.avatar_b64 ? <img src={c.avatar_b64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Header Line */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-structural)' }}>
                                                        {c.admin_name || c.username}
                                                    </span>
                                                    {c.department && (
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--color-structural-light)', background: 'rgba(15,23,42,0.06)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                                                            {c.department}
                                                        </span>
                                                    )}

                                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'rgba(45,34,28,0.4)' }}>{timeStr}</span>
                                                        {isOwn && (
                                                            <button
                                                                onClick={() => handleDeleteComment(c.id)}
                                                                title="刪除"
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-structural-light)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                                                                onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-structural-light)'}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content Bubble */}
                                                <div style={{
                                                    background: '#fff',
                                                    color: 'var(--color-structural)',
                                                    border: '1px solid rgba(45,34,28,0.08)',
                                                    borderRadius: '4px 12px 12px 12px',
                                                    padding: '0.85rem 1.1rem', fontSize: '0.9rem', lineHeight: '1.65',
                                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                                                    display: 'inline-block'
                                                }}>
                                                    {c.content}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Comment Input */}
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-structural)', background: '#fff' }}>
                            <textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="輸入留言或面試觀察記錄..."
                                rows={3}
                                style={{
                                    width: '100%', boxSizing: 'border-box', resize: 'vertical',
                                    border: '1px solid var(--border-dark)', borderRadius: '8px',
                                    padding: '0.8rem', fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                                    color: 'var(--color-structural)', background: '#fff',
                                    lineHeight: '1.6', outline: 'none', marginBottom: '0.8rem', transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border-dark)'}
                                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAddComment(); }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-structural-light)' }}>Cmd+Enter 快速傳送</span>
                                <button
                                    onClick={handleAddComment}
                                    disabled={commenting || !newComment.trim()}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        background: newComment.trim() ? 'var(--color-primary)' : 'rgba(15,23,42,0.06)',
                                        color: newComment.trim() ? '#fff' : 'var(--color-structural-light)',
                                        border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem',
                                        fontSize: '0.88rem', fontWeight: 'bold', cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.15s', fontFamily: 'var(--font-body)'
                                    }}
                                >
                                    {commenting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                    傳送留言
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Interview Score Summary ── */}
                    <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="wizard-content" style={{ minHeight: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)' }}>
                                <ClipboardList size={20} color="var(--color-primary)" /> 面試評分與決策
                            </h3>
                            <InterviewScoreForm
                                candidateId={id}
                                apiUrl={apiUrl}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateDetail;
