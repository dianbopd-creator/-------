import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer, Funnel, FunnelChart,
    LabelList, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Loader2, Users, TrendingUp, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';

const COLORS = ['#1e3a8a', '#2563eb', '#06b6d4', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, subtitle, color = '#1e3a8a', icon: Icon }) => (
    <div style={{
        background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '16px',
        padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: `4px solid ${color}`
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'rgba(15,23,42,0.5)', fontFamily: 'var(--font-tech)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
            {Icon && <Icon size={20} color={color} style={{ opacity: 0.7 }} />}
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-structural)', fontFamily: 'var(--font-tech)', lineHeight: 1 }}>{value}</div>
        {subtitle && <div style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.4)', fontFamily: 'var(--font-body)' }}>{subtitle}</div>}
    </div>
);

const SectionTitle = ({ children }) => (
    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-structural)', fontFamily: 'var(--font-heading)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}
    </h2>
);

const CustomTooltipStyle = {
    background: '#fff',
    border: '1px solid rgba(15,23,42,0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
};

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`${apiUrl}/admin/analytics/dashboard`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });
                if (!res.ok) throw new Error('Failed to fetch analytics data');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
            <Loader2 size={28} className="animate-spin" /> 載入數據洞察中...
        </div>
    );

    if (error) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
            <div>{error}</div>
        </div>
    );

    // Prepare job distribution data for pie chart
    const jobPieData = (data.jobDistribution || [])
        .filter(d => d.count > 0)
        .map(d => ({ name: `${d.department}-${d.position}`, value: d.count }));

    // Prepare status bar chart data
    const statusBarData = (data.statusDistribution || [])
        .filter(d => d.status && d.count > 0)
        .slice(0, 10)
        .map(d => ({ name: d.status, count: d.count }));

    // Funnel data
    const funnelData = (data.funnel || []).map((f, i) => ({
        ...f,
        fill: COLORS[i % COLORS.length]
    }));

    // Trend data — fill missing days with 0
    const trend30 = data.trend30 || [];

    // Stage days data
    const stageDaysData = (data.stageDays || []).map(d => ({
        name: d.status,
        avg_days: parseFloat(d.avg_days) || 0,
        count: d.count
    }));

    const conversionRate = data.total > 0
        ? Math.round((funnelData[funnelData.length - 1]?.count / data.total) * 100)
        : 0;

    return (
        <div style={{ padding: '3rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Header */}
            <div style={{ borderBottom: '2px solid rgba(15,23,42,0.08)', paddingBottom: '1.5rem' }}>
                <h1 className="step-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>數據洞察</h1>
                <p className="step-desc" style={{ margin: 0 }}>即時掌握招募漏斗效率、各職缺熱度與流程健康度。</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                <StatCard title="總應徵人數" value={data.total} subtitle="所有時間累計投遞" color="#1e3a8a" icon={Users} />
                <StatCard title="待處理" value={data.pending} subtitle="尚未分配至流程" color="#f97316" icon={AlertCircle} />
                <StatCard title="職缺數量" value={data.jobDistribution?.length || 0} subtitle="目前開啟中的職缺" color="#06b6d4" icon={Briefcase} />
                <StatCard title="最終錄取率" value={`${conversionRate}%`} subtitle="投遞 → 核定/錄用" color="#22c55e" icon={CheckCircle} />
            </div>

            {/* Row 1: Funnel + Job Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Recruitment Funnel */}
                <div style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <SectionTitle>📣 招募漏斗 (Recruitment Funnel)</SectionTitle>
                    {funnelData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {funnelData.map((f, i) => {
                                const pct = data.total > 0 ? Math.round((f.count / data.total) * 100) : 0;
                                const widths = [100, 70, 45];
                                return (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-structural)' }}>{f.stage}</span>
                                            <span style={{ fontSize: '0.82rem', color: 'rgba(15,23,42,0.5)', fontFamily: 'var(--font-tech)' }}>{f.count} 人 ({pct}%)</span>
                                        </div>
                                        <div style={{ background: 'rgba(15,23,42,0.05)', borderRadius: '6px', height: '36px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${widths[i] || 30}%`,
                                                height: '100%',
                                                background: f.fill,
                                                borderRadius: '6px',
                                                transition: 'width 0.6s ease',
                                                display: 'flex', alignItems: 'center',
                                                paddingLeft: '12px',
                                                color: '#fff',
                                                fontSize: '0.82rem',
                                                fontWeight: '700'
                                            }}>
                                                {f.count > 0 ? f.count : ''}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem' }}>尚無招募資料</div>
                    )}
                </div>

                {/* Job Popularity Pie */}
                <div style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <SectionTitle>💼 職缺熱度分佈</SectionTitle>
                    {jobPieData.length > 0 ? (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <ResponsiveContainer width={220} height={220}>
                                <PieChart>
                                    <Pie
                                        data={jobPieData}
                                        cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={90}
                                        dataKey="value"
                                        paddingAngle={3}
                                    >
                                        {jobPieData.map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={CustomTooltipStyle} formatter={(val) => [`${val} 人`, '投遞數']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {jobPieData.map((entry, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                        <span style={{ color: 'var(--color-structural)', flex: 1, fontWeight: '500' }}>{entry.name}</span>
                                        <span style={{ color: 'rgba(15,23,42,0.5)', fontFamily: 'var(--font-tech)', fontWeight: '600' }}>{entry.value}</span>
                                    </div>
                                ))}
                                {jobPieData.length === 0 && <div style={{ color: 'rgba(15,23,42,0.4)', fontSize: '0.85rem', textAlign: 'center' }}>尚無資料</div>}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem' }}>尚無職缺資料</div>
                    )}
                </div>
            </div>

            {/* Row 2: 30-day Trend */}
            <div style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <SectionTitle>📈 近 30 天每日投遞趨勢</SectionTitle>
                {trend30.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={trend30} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(15,23,42,0.45)', fontFamily: 'var(--font-tech)' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(15,23,42,0.45)' }} />
                            <Tooltip contentStyle={CustomTooltipStyle} labelStyle={{ fontWeight: '700' }} formatter={(val) => [`${val} 人`, '投遞數']} />
                            <Area type="monotone" dataKey="count" stroke="#1e3a8a" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 3, fill: '#1e3a8a' }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem' }}>過去 30 天無新投遞資料</div>
                )}
            </div>

            {/* Row 3: Status Bar + Stage Days */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Status Distribution */}
                <div style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <SectionTitle>📊 各狀態分佈</SectionTitle>
                    {statusBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={statusBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(15,23,42,0.45)' }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-structural)', fontWeight: '500' }} width={80} />
                                <Tooltip contentStyle={CustomTooltipStyle} formatter={(val) => [`${val} 人`, '人數']} />
                                <Bar dataKey="count" fill="#1e3a8a" radius={[0, 6, 6, 0]}>
                                    {statusBarData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem' }}>尚無狀態資料</div>
                    )}
                </div>

                {/* Stage Average Days */}
                <div style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <SectionTitle>⏱ 各階段平均停留天數</SectionTitle>
                    {stageDaysData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stageDaysData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: 'rgba(15,23,42,0.45)' }} unit=" 天" />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-structural)', fontWeight: '500' }} width={80} />
                                <Tooltip contentStyle={CustomTooltipStyle} formatter={(val) => [`${val} 天`, '平均停留']} />
                                <Bar dataKey="avg_days" radius={[0, 6, 6, 0]}>
                                    {stageDaysData.map((d, i) => {
                                        // Color coding — longer = more orange/red
                                        const color = d.avg_days > 14 ? '#ef4444' : d.avg_days > 7 ? '#f97316' : '#22c55e';
                                        return <Cell key={i} fill={color} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem' }}>尚無階段停留資料</div>
                    )}
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '2px', display: 'inline-block' }} /> ≤ 7 天 (正常)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', background: '#f97316', borderRadius: '2px', display: 'inline-block' }} /> 7~14 天 (注意)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px', display: 'inline-block' }} /> &gt;14 天 (待改善)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
