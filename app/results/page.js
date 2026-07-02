'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getCoachInfo } from '@/lib/coach';
import {
    Trophy,
    Target,
    MessageSquare,
    Send,
    ChevronRight,
    TrendingUp,
    Activity,
    UserCheck,
    Award,
    BookOpen,
    ArrowLeft,
    Loader2,
    Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ResultsPage() {
    return (
        <AuthGuard>
            <ResultsContent />
        </AuthGuard>
    );
}

function ResultsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const interviewId = searchParams.get('id');
    const isFallback = searchParams.get('fallback') === 'true';
    const { user, userData } = useAuth();
    const coachInfo = getCoachInfo(userData?.coachGender);

    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef(null);

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            const element = printRef.current;
            // Temporarily hide buttons to prevent them from appearing in PDF
            const buttons = element.querySelectorAll('button');
            const originalDisplays = [];
            buttons.forEach((btn, idx) => {
                originalDisplays[idx] = btn.style.display;
                btn.style.display = 'none';
            });

            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
            const data = canvas.toDataURL('image/png');
            
            buttons.forEach((btn, idx) => {
                btn.style.display = originalDisplays[idx];
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });
            pdf.addImage(data, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            
            const fileName = `${user?.displayName || 'Candidate'}_Interview score.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error generating PDF', error);
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        const fetchResults = async () => {
            // Handle fallback case (no Firestore write)
            if (isFallback) {
                const pending = sessionStorage.getItem('pendingResult');
                if (pending) {
                    try {
                        setResults(JSON.parse(pending));
                        // We intentionally do not remove pendingResult here to support React 18 Strict Mode double-invocations
                        confetti({
                            particleCount: 200,
                            spread: 90,
                            origin: { y: 0.6 },
                            colors: ['#DC2626', '#EF4444', '#B91C1C']
                        });
                    } catch (e) {
                        console.error('Failed to parse fallback result:', e);
                        router.push('/dashboard');
                    }
                } else {
                    console.warn('Fallback flag set but no pending result found');
                    router.push('/dashboard');
                }
                setLoading(false);
                return;
            }

            if (!interviewId) {
                router.push('/dashboard');
                return;
            }

            try {
                if (!user?.uid) return; // Wait for user to be available

                const docRef = doc(db, 'interviews', interviewId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().userId === user.uid) {
                    setResults(docSnap.data());

                    confetti({
                        particleCount: 200,
                        spread: 90,
                        origin: { y: 0.6 },
                        colors: ['#DC2626', '#EF4444', '#B91C1C']
                    });
                } else {
                    // try fallback from session (in case Firestore write failed)
                    const pending = sessionStorage.getItem('pendingResult');
                    if (pending) {
                        setResults(JSON.parse(pending));
                        // We intentionally do not remove pendingResult here
                        confetti({
                            particleCount: 200,
                            spread: 90,
                            origin: { y: 0.6 },
                            colors: ['#DC2626', '#EF4444', '#B91C1C']
                        });
                    } else {
                        router.push('/dashboard');
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [interviewId, user, router, isFallback]);

    const handleSendEmail = async () => {
        setIsSending(true);
        try {
            const res = await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    report: {
                        name: user.displayName || 'Candidate',
                        domain: results.domain,
                        difficulty: results.difficulty,
                        score: results.overallScore,
                        feedback: results.evaluations?.[0]?.feedback?.strengths || "Great performance across all technical domains.",
                        roadmap: results.evaluations?.map(e => e.followUpQuestion).filter(Boolean).slice(0, 3) || [
                            "Master advanced architectural patterns",
                            "Refine verbal communication pacing",
                            "Deepen technical domain knowledge"
                        ]
                    }
                })
            });
            if (res.ok) setSent(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    if (loading) return (
        <div className="center-loading">
            <div className="moving-circles">
                <div className="circle"></div>
                <div className="circle"></div>
                <div className="circle"></div>
            </div>
            <p>Decoding Transcription DNA...</p>
            <style jsx>{`
                .center-loading { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; color: var(--muted); }
                .moving-circles { display: flex; gap: 1rem; }
                .circle { width: 14px; height: 14px; border-radius: 50%; background: var(--primary); animation: pulse 1.5s infinite; }
                .circle:nth-child(2) { animation-delay: 0.2s; background: var(--secondary); }
                .circle:nth-child(3) { animation-delay: 0.4s; background: var(--accent); }
                @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.5); opacity: 1; } }
            `}</style>
        </div>
    );

    if (!results) return null;

    const evaluations = results.evaluations || [];
    const avgTech = evaluations.length ? Number((evaluations.reduce((acc, curr) => acc + (curr.score?.technical || 0), 0) / evaluations.length).toFixed(2)) : 0;
    const avgComm = evaluations.length ? Number((evaluations.reduce((acc, curr) => acc + (curr.score?.communication || 0), 0) / evaluations.length).toFixed(2)) : 0;
    const avgWpm = evaluations.length ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.metrics?.wpm || 0), 0) / evaluations.length) : 0;
    const overall = typeof results.overallScore === 'number' ? Number(results.overallScore.toFixed(2)) : 0;

    const allMatched = new Set();
    const allMissing = new Set();
    
    evaluations.forEach(ev => {
        (ev.metrics?.matchedKeywords || []).forEach(k => allMatched.add(k));
        (ev.metrics?.missingKeywords || []).forEach(k => allMissing.add(k));
    });

    allMatched.forEach(k => allMissing.delete(k));

    const matchedList = Array.from(allMatched);
    const missingList = Array.from(allMissing);

    const stats = [
        { label: 'Technical Depth', score: avgTech * 10, color: 'var(--primary)' },
        { label: 'Verbal Hygiene', score: avgComm * 10, color: 'var(--secondary)' },
        { label: 'Pacing (WPM)', score: Math.min(100, (avgWpm / 150) * 100), color: 'var(--accent)' }
    ];

    return (
        <main className="premium-results" ref={printRef}>
            <div className="workspace-bg" />

            <div className="container results-container animate-fade">
                <header className="res-nav">
                    <button className="back-btn" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft size={20} />
                        <span>Return to Lounge</span>
                    </button>
                    <div className="luxury-logo-sm">
                        <Image src="/logo.png" alt="AnInterview Logo" width={32} height={32} className="logo-img" style={{ borderRadius: '6px' }} />
                        <span>AnInterview DNA</span>
                    </div>
                </header>

                <section className="dna-hero">
                    <div className="hero-content">
                        <h1 className="hero-text text-5xl">Your Professional <br /><span className="gradient-text">Competency DNA</span></h1>
                        <p className="muted text-lg">Sophisticated analysis of your technical depth and communication maturity.</p>
                    </div>

                    <div className="dna-overall-view">
                        <div className="premium-glass main-score-orb">
                            <div className="orb-inner">
                                <span className="sc-val">{overall}</span>
                                <span className="sc-max">/10</span>
                            </div>
                            <div className="orb-label">OVERALL READINESS</div>
                            <div className="orb-glow"></div>
                        </div>
                    </div>
                </section>

                <section className="analysis-grid">
                    <div className="matrix-island">
                        <div className="premium-glass performance-matrix">
                            <h3>Competency Matrix</h3>
                            <div className="matrix-stack">
                                {stats.map(s => (
                                    <div key={s.label} className="matrix-row">
                                        <div className="row-info">
                                            <span className="label-bold">{s.label}</span>
                                            <span className="val-bold">{Number(s.score.toFixed(1))}%</span>
                                        </div>
                                        <div className="row-bar-bg">
                                            <div className="row-bar-fill" style={{ width: `${s.score}%`, background: s.color }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="premium-glass insight-card">
                            <div className="card-top">
                                <UserCheck size={20} color="var(--primary)" />
                                <strong>Coach&apos;s Summary</strong>
                            </div>
                            <p className="text-lg">
                                &quot;{user?.displayName || 'Candidate'}, {evaluations[0]?.feedback?.strengths || "you demonstrated strong technical foundations today."}
                                {evaluations[0]?.feedback?.weaknesses ? ` To reach the next level, ${evaluations[0].feedback.weaknesses.toLowerCase()}` : ""}
                                Keep focusing on your clarity and depth.&quot;
                            </p>
                            <div className="human-signature">
                                <Image src={coachInfo.image} alt={`Coach ${coachInfo.name}`} className="sig-avatar" width={44} height={44} />
                                <div>
                                    <strong>Coach {coachInfo.name}</strong>
                                    <span>Senior Behavioral Architect</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="roadmap-island">
                        <div className="premium-glass roadmap-card">
                            <div className="roadmap-header">
                                <BookOpen size={20} color="var(--primary)" />
                                <h3>Personalized 7-Day Roadmap</h3>
                            </div>
                            <div className="roadmap-steps">
                                {evaluations.length > 0 ? evaluations.slice(0, 3).map((eva, i) => (
                                    <div key={i} className="step-item">
                                        <div className="step-num">0{i + 1}</div>
                                        <div className="step-text">{eva.followUpQuestion || "Master advanced technical concepts"}</div>
                                    </div>
                                )) : (
                                    <>
                                        <div className="step-item">
                                            <div className="step-num">01</div>
                                            <div className="step-text">Master core architectural patterns</div>
                                        </div>
                                        <div className="step-item">
                                            <div className="step-num">02</div>
                                            <div className="step-text">Refine verbal pacing</div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button className={`btn-premium report-btn ${sent ? 'sent' : ''}`} onClick={handleSendEmail} disabled={isSending || sent}>
                                {isSending ? 'Generating DNA Report...' : sent ? 'DNA Report Sent!' : 'Export Performance DNA'}
                                {!isSending && !sent && <Send size={20} />}
                            </button>
                            
                            <button className="btn-premium report-btn pdf-btn" onClick={handleDownloadPDF} disabled={isDownloading}>
                                {isDownloading ? 'Generating PDF...' : 'Download PDF Report'}
                                {!isDownloading && <Download size={20} />}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="keyword-section">
                    <div className="premium-glass keyword-card">
                        <div className="kw-header">
                            <Target size={20} color="var(--primary)" />
                            <h3>Vocabulary & Terminology DNA</h3>
                        </div>
                        <div className="kw-body">
                            <div className="kw-group">
                                <h4>Demonstrated Vocabulary <span className="kw-count success">{matchedList.length}</span></h4>
                                <div className="kw-pills">
                                    {matchedList.length > 0 ? matchedList.map((kw, i) => (
                                        <span key={i} className="kw-pill matched">{kw}</span>
                                    )) : <span className="kw-empty">No specific terminology detected.</span>}
                                </div>
                            </div>
                            <div className="kw-group">
                                <h4>Missed Opportunities <span className="kw-count warning">{missingList.length}</span></h4>
                                <div className="kw-pills">
                                    {missingList.length > 0 ? missingList.map((kw, i) => (
                                        <span key={i} className="kw-pill missing">{kw}</span>
                                    )) : <span className="kw-empty">Perfect keyword coverage!</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
        .premium-results { min-height: 100vh; padding-bottom: 6rem; position: relative; }
        .results-container { padding-top: 2rem; display: flex; flex-direction: column; gap: 4rem; }
        
        .res-nav { display: flex; justify-content: space-between; align-items: center; }
        .back-btn { background: transparent; border: none; display: flex; align-items: center; gap: 0.75rem; font-weight: 700; color: var(--muted); cursor: pointer; transition: 0.3s; }
        .back-btn:hover { color: var(--primary); }
        .luxury-logo-sm { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 1.5rem; letter-spacing: -1px; }

        .dna-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .res-medal-badge { background: #fffbeb; color: #b45309; padding: 0.5rem 1rem; border-radius: 100px; display: inline-flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; font-weight: 800; margin-bottom: 1.5rem; border: 1px solid #fde68a; box-shadow: var(--shadow-sm); }
        .dna-hero h1 { letter-spacing: -3px; line-height: 1; }
        
        .main-score-orb { width: 300px; height: 300px; border-radius: 50%; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
        .orb-inner { display: flex; align-items: baseline; }
        .sc-val { font-size: 8rem; font-weight: 900; color: var(--primary); font-family: var(--font-heading); line-height: 1; letter-spacing: -5px; }
        .sc-max { font-size: 2rem; font-weight: 700; color: var(--muted); }
        .orb-label { font-size: 0.8rem; font-weight: 800; color: var(--muted); letter-spacing: 2px; }
        .orb-glow { position: absolute; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 60px rgba(220, 38, 38, 0.15); z-index: -1; animation: grow 3s infinite; }
        @keyframes grow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }

        .analysis-grid { display: grid; grid-template-columns: 1fr 400px; gap: 2.5rem; }
        .matrix-island { display: flex; flex-direction: column; gap: 2rem; }
        
        .performance-matrix { padding: 3rem; }
        .performance-matrix h3 { margin-bottom: 2.5rem; font-size: 1.5rem; }
        .matrix-stack { display: flex; flex-direction: column; gap: 2rem; }
        .matrix-row { display: flex; flex-direction: column; gap: 0.8rem; }
        .row-info { display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; }
        .row-bar-bg { height: 10px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
        .row-bar-fill { height: 100%; transition: width 2s cubic-bezier(0.16, 1, 0.3, 1); }

        .insight-card { padding: 3rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .card-top { display: flex; align-items: center; gap: 0.75rem; color: var(--primary); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
        .insight-card p { line-height: 1.6; color: #1e293b; font-style: italic; }
        .human-signature { display: flex; align-items: center; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
        .sig-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
        .human-signature strong { display: block; font-size: 0.95rem; }
        .human-signature span { font-size: 0.75rem; color: var(--muted); }

        .roadmap-card { padding: 3rem; display: flex; flex-direction: column; gap: 2.5rem; height: 100%; }
        .roadmap-header { display: flex; align-items: center; gap: 1rem; }
        .roadmap-header h3 { font-size: 1.3rem; }
        .roadmap-steps { display: flex; flex-direction: column; gap: 1.5rem; }
        .step-item { display: flex; align-items: center; gap: 1.5rem; }
        .step-num { font-size: 1.5rem; font-weight: 800; color: var(--primary-glow); font-family: var(--font-heading); }
        .step-text { font-weight: 600; font-size: 1rem; color: #475569; }

        .report-btn { width: 100%; margin-top: auto; }
        .report-btn.pdf-btn { background: #0f172a; color: white; margin-top: 1rem; border: none; }
        .report-btn.pdf-btn:hover { background: #1e293b; color: white; }
        .report-btn.sent { background: #10b981; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4); }

        .keyword-section { margin-top: 2.5rem; }
        .keyword-card { padding: 3rem; display: flex; flex-direction: column; gap: 2rem; }
        .kw-header { display: flex; align-items: center; gap: 1rem; }
        .kw-header h3 { font-size: 1.5rem; }
        .kw-body { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
        .kw-group { display: flex; flex-direction: column; gap: 1.25rem; }
        .kw-group h4 { display: flex; align-items: center; justify-content: space-between; font-size: 1rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; }
        .kw-count { font-size: 0.8rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 100px; }
        .kw-count.success { background: #d1fae5; color: #059669; }
        .kw-count.warning { background: #fee2e2; color: #ef4444; }
        .kw-pills { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .kw-pill { padding: 0.5rem 1rem; border-radius: 100px; font-size: 0.85rem; font-weight: 600; transition: 0.3s; }
        .kw-pill.matched { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .kw-pill.matched:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .kw-pill.missing { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; text-decoration: line-through; opacity: 0.8; }
        .kw-pill.missing:hover { opacity: 1; text-decoration: none; border-color: #ef4444; color: #ef4444; background: #fef2f2; }
        .kw-empty { font-size: 0.9rem; color: var(--muted); font-style: italic; }

        @media (max-width: 1024px) {
          .dna-hero { grid-template-columns: 1fr; text-align: center; }
          .hero-content { display: flex; flex-direction: column; align-items: center; }
          .analysis-grid { grid-template-columns: 1fr; }
          .kw-body { grid-template-columns: 1fr; }
        }
      `}</style>
        </main>
    );
}
