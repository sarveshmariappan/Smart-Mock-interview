'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ChevronLeft, TrendingUp, Activity, Award, Loader2, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AnalyticsPage() {
    return (
        <AuthGuard>
            <AnalyticsContent />
        </AuthGuard>
    );
}

function AnalyticsContent() {
    const router = useRouter();
    const { user, isGuest } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [averages, setAverages] = useState({ technical: 0, communication: 0, overall: 0 });

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            
            if (isGuest) {
                // Mock data for guests
                setIsLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, 'interviews'),
                    where('userId', '==', user.uid),
                    orderBy('timestamp', 'asc')
                );
                const snapshot = await getDocs(q);
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Process for charts
                let totalTech = 0;
                let totalComm = 0;
                let totalOverall = 0;
                let validCount = 0;

                const cData = docs.map((doc, idx) => {
                    const dateObj = doc.timestamp?.seconds ? new Date(doc.timestamp.seconds * 1000) : new Date();
                    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    
                    // calculate average tech and comm for this session
                    let sessionTech = 0;
                    let sessionComm = 0;
                    if (doc.evaluations && doc.evaluations.length > 0) {
                        sessionTech = doc.evaluations.reduce((sum, ev) => sum + (ev.score?.technical || 0), 0) / doc.evaluations.length;
                        sessionComm = doc.evaluations.reduce((sum, ev) => sum + (ev.score?.communication || 0), 0) / doc.evaluations.length;
                    }

                    if (doc.overallScore) {
                        totalOverall += doc.overallScore;
                        totalTech += sessionTech;
                        totalComm += sessionComm;
                        validCount++;
                    }

                    return {
                        name: `Session ${idx + 1}`,
                        date: dateStr,
                        Overall: doc.overallScore || 0,
                        Technical: Number(sessionTech.toFixed(1)),
                        Communication: Number(sessionComm.toFixed(1)),
                        domain: doc.domain
                    };
                });

                if (validCount > 0) {
                    setAverages({
                        technical: Number((totalTech / validCount).toFixed(1)),
                        communication: Number((totalComm / validCount).toFixed(1)),
                        overall: Number((totalOverall / validCount).toFixed(1))
                    });
                }

                setChartData(cData);
                setHistory(docs.reverse()); // latest first for table
            } catch (err) {
                console.error("Error fetching analytics:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [user, isGuest]);

    if (isLoading) {
        return <div className="loading-state"><Loader2 className="animate-spin" size={32} /></div>;
    }

    return (
        <main className="analytics-page">
            <div className="workspace-bg" />
            
            <div className="container analytics-container animate-fade">
                <header className="analytics-header">
                    <button className="back-btn" onClick={() => router.push('/dashboard')}>
                        <ChevronLeft size={20} /> Back to Lounge
                    </button>
                    <div>
                        <h1 className="hero-text text-5xl">Performance <span className="gradient-text">Analytics</span></h1>
                        <p className="muted">Track your progress and identify areas for growth.</p>
                    </div>
                </header>

                {chartData.length === 0 ? (
                    <div className="premium-glass empty-state">
                        <Activity size={48} color="var(--muted)" />
                        <h2>No Data Yet</h2>
                        <p>Complete your first interview session to unlock your personalized analytics dashboard.</p>
                        <button className="btn-premium" onClick={() => router.push('/dashboard')}>Start a Session</button>
                    </div>
                ) : (
                    <div className="analytics-grid">
                        <div className="metrics-row">
                            <div className="premium-glass metric-card">
                                <div className="metric-icon"><Award size={24} /></div>
                                <div className="metric-info">
                                    <span className="label">Avg Overall Score</span>
                                    <span className="value">{averages.overall} <span className="max">/10</span></span>
                                </div>
                            </div>
                            <div className="premium-glass metric-card">
                                <div className="metric-icon"><Activity size={24} /></div>
                                <div className="metric-info">
                                    <span className="label">Avg Technical</span>
                                    <span className="value">{averages.technical} <span className="max">/10</span></span>
                                </div>
                            </div>
                            <div className="premium-glass metric-card">
                                <div className="metric-icon"><TrendingUp size={24} /></div>
                                <div className="metric-info">
                                    <span className="label">Avg Communication</span>
                                    <span className="value">{averages.communication} <span className="max">/10</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="charts-row">
                            <div className="premium-glass chart-container">
                                <h3>Overall Progression</h3>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 10]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                            <Line type="monotone" dataKey="Overall" stroke="var(--primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="premium-glass chart-container">
                                <h3>Skill Breakdown</h3>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 10]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                                            <Legend iconType="circle" />
                                            <Bar dataKey="Technical" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Communication" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="premium-glass history-section">
                            <div className="history-header">
                                <h3>Session History</h3>
                            </div>
                            <div className="table-container">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Domain</th>
                                            <th>Difficulty</th>
                                            <th>Score</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(session => (
                                            <tr key={session.id}>
                                                <td>
                                                    <div className="date-cell">
                                                        <Calendar size={14} />
                                                        {new Date(session.timestamp?.seconds * 1000).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="font-medium">{session.domain}</td>
                                                <td><span className="diff-badge">{session.difficulty}</span></td>
                                                <td><span className="score-badge">{session.overallScore}</span></td>
                                                <td>
                                                    <button className="view-btn" onClick={() => router.push(`/results?id=${session.id}`)}>
                                                        View Report
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .analytics-page { min-height: 100vh; padding: 2rem 0 6rem 0; position: relative; }
                .loading-state { height: 100vh; display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .analytics-container { display: flex; flex-direction: column; gap: 2.5rem; }
                
                .analytics-header { display: flex; flex-direction: column; gap: 1.5rem; }
                .back-btn { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: none; font-weight: 600; color: var(--muted); cursor: pointer; width: fit-content; transition: 0.2s; }
                .back-btn:hover { color: var(--foreground); transform: translateX(-4px); }
                
                .empty-state { padding: 5rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; }
                
                .analytics-grid { display: flex; flex-direction: column; gap: 2.5rem; }
                
                .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
                .metric-card { padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1.5rem; }
                .metric-icon { width: 54px; height: 54px; border-radius: 16px; background: var(--glass-glow); color: var(--primary); display: flex; align-items: center; justify-content: center; }
                .metric-info { display: flex; flex-direction: column; }
                .metric-info .label { font-size: 0.8rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
                .metric-info .value { font-size: 2rem; font-weight: 800; color: var(--foreground); font-family: var(--font-heading); display: flex; align-items: baseline; gap: 0.2rem; }
                .metric-info .max { font-size: 1rem; color: var(--muted); }
                
                .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .chart-container { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; height: 400px; }
                .chart-container h3 { font-size: 1.2rem; color: var(--foreground); }
                .chart-wrapper { flex: 1; min-height: 0; }
                
                .history-section { padding: 2rem; }
                .history-header { margin-bottom: 1.5rem; }
                .table-container { overflow-x: auto; }
                .history-table { width: 100%; border-collapse: separate; border-spacing: 0 0.5rem; }
                .history-table th { text-align: left; padding: 1rem; font-size: 0.75rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); }
                .history-table td { padding: 1.2rem 1rem; background: rgba(255,255,255,0.4); }
                .history-table tr td:first-child { border-radius: 12px 0 0 12px; }
                .history-table tr td:last-child { border-radius: 0 12px 12px 0; }
                
                .date-cell { display: flex; align-items: center; gap: 0.5rem; color: var(--muted); font-size: 0.9rem; font-weight: 600; }
                .font-medium { font-weight: 600; }
                .diff-badge { background: #f1f5f9; padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.75rem; font-weight: 700; color: #475569; }
                .score-badge { background: var(--glass-glow); color: var(--primary); padding: 0.4rem 0.8rem; border-radius: 100px; font-weight: 800; }
                
                .view-btn { background: white; border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
                .view-btn:hover { border-color: var(--primary); color: var(--primary); }
                
                @media (max-width: 1024px) {
                    .metrics-row { grid-template-columns: 1fr; }
                    .charts-row { grid-template-columns: 1fr; }
                }
            `}</style>
        </main>
    );
}
