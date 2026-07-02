'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { getCoachInfo } from '@/lib/coach';
import {
    Briefcase,
    Target,
    Play,
    Coffee,
    ChevronRight,
    ChevronDown,
    Bell,
    Sparkles,
    Search,
    Users,
    LogOut,
    TrendingUp,
    CheckCircle2,
    BarChart2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useEffect } from 'react';

const DOMAINS = [
    'Java Developer',
    'Frontend Engineer',
    'Data Scientist',
    'Full Stack Developer',
    'Software Architect',
    'Product Manager'
];

const DIFFICULTIES = [
    'Beginner / Junior',
    'Intermediate / Associate',
    'Expert / Lead'
];

export default function Dashboard() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    );
}

function DashboardContent() {
    const router = useRouter();
    const { user, userData, logout, isGuest } = useAuth();
    const [domain, setDomain] = useState(DOMAINS[0]);
    const [difficulty, setDifficulty] = useState(DIFFICULTIES[0]);
    const [isStarting, setIsStarting] = useState(false);

    const coachInfo = getCoachInfo(userData?.coachGender);
    const [stats, setStats] = useState({ sessions: 0, avgScore: 0 });
    const [achievements, setAchievements] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            
            if (isGuest) {
                // Mock data for guest users
                setStats({ sessions: 0, avgScore: 0 });
                setAchievements([]);
                return;
            }

            try {
                // Fetch stats
                const statsQuery = query(collection(db, 'interviews'), where('userId', '==', user.uid));
                const statsSnapshot = await getDocs(statsQuery);
                const statsResults = statsSnapshot.docs.map(doc => doc.data());

                if (statsResults.length > 0) {
                    const totalScore = statsResults.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
                    setStats({
                        sessions: statsResults.length,
                        avgScore: (totalScore / statsResults.length).toFixed(1)
                    });
                }

                // Fetch recent achievements
                const achievementsQuery = query(
                    collection(db, 'interviews'),
                    where('userId', '==', user.uid),
                    orderBy('timestamp', 'desc'),
                    limit(2)
                );
                const achievementsSnapshot = await getDocs(achievementsQuery);
                setAchievements(achievementsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })));
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        };

        fetchUserData();
    }, [user, isGuest]);

    const handleStart = () => {
        setIsStarting(true);
        setTimeout(() => {
            router.push(`/interview?domain=${encodeURIComponent(domain)}&difficulty=${encodeURIComponent(difficulty)}`);
        }, 1200);
    };

    return (
        <main className="premium-dashboard">
            <div className="workspace-bg" />

            <nav className="lounge-nav container">
                <div className="luxury-logo-sm">
                    <Image src="/logo.png" alt="AnInterview Logo" width={32} height={32} className="logo-img" style={{ borderRadius: '6px' }} />
                    <span>AnInterview</span>
                </div>

                <div className="nav-search premium-glass">
                    <Search size={18} />
                    <input type="text" placeholder="Search mentorship topics..." />
                </div>

                <div className="nav-user-actions">
                    <div className="nav-icon-wrapper">
                        <button className="nav-icon-btn" onClick={() => router.push('/analytics')} title="Analytics">
                            <BarChart2 size={20} />
                        </button>
                    </div>

                    <div className="nav-icon-wrapper">
                        <button className="nav-icon-btn"><Bell size={20} /></button>
                        <div className="premium-glass achievements-card">
                            <div className="side-card-header">
                                <TrendingUp size={20} />
                                <h3>Last Achievements</h3>
                            </div>
                            <div className="achievement-list">
                                {achievements.length > 0 ? achievements.map(ach => (
                                    <div key={ach.id} className="achievement-item">
                                        <div className="ach-icon"><CheckCircle2 size={16} /></div>
                                        <div className="ach-content">
                                            <p>{ach.domain} - {ach.difficulty}</p>
                                            <div className="ach-meta">
                                                <span>Score: {ach.overallScore}/10</span>
                                                <span className="dot"></span>
                                                <span>{new Date(ach.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-achievements">
                                        <p>No recent sessions found. Start your first interview!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button className="nav-icon-btn" title="Logout" onClick={logout}><LogOut size={20} /></button>

                    <div className="user-profile-nav" onClick={() => router.push('/profile')}>
                        <div className="premium-avatar-ring clickable">
                            <img src={user?.photoURL || "/avatar.png"} alt="Profile" width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                        </div>
                        <span className="user-first-name">{(typeof user?.displayName === 'string' && user.displayName ? user.displayName.split(' ')[0] : 'Candidate')}</span>
                    </div>
                </div>
            </nav>

            <div className="container lounge-content animate-fade">
                <header className="lounge-header">
                    <div className="welcome-section">
                        <h1 className="hero-text text-5xl">Welcome to the <span className="gradient-text">Lounge</span>, {user?.displayName || 'Candidate'}.</h1>
                        <p className="muted text-lg">Your next career milestone begins with a single conversation. Choose your path below.</p>
                    </div>

                    <div className="quick-stats-box premium-glass animate-fade-in">
                        <div className="header-stat">
                            <span className="stat-label">SESSIONS</span>
                            <span className="stat-value">{stats.sessions}</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="header-stat">
                            <span className="stat-label">AVG SCORE</span>
                            <span className="stat-value">{stats.avgScore}/10</span>
                        </div>
                    </div>
                </header>

                <div className="lounge-grid">
                    <section className="config-island">
                        <div className="premium-glass config-card">
                            <div className="card-intro">
                                <div className="icon-badge-premium">
                                    <Coffee size={24} />
                                </div>
                                <div>
                                    <h3>New Practice Session</h3>
                                    <p className="muted">Select your professional focus</p>
                                </div>
                            </div>

                            <div className="selection-grid">
                                <div className="lounge-group">
                                    <div className="label-row">
                                        <label>Domain</label>
                                        <span className="selection-hint">Target Area</span>
                                    </div>
                                    <div className="select-wrapper">
                                        <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                                            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <ChevronDown size={18} className="select-arrow" />
                                    </div>
                                </div>

                                <div className="lounge-group">
                                    <div className="label-row">
                                        <label>Experience</label>
                                        <span className="selection-hint">Complexity</span>
                                    </div>
                                    <div className="select-wrapper">
                                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <ChevronDown size={18} className="select-arrow" />
                                    </div>
                                </div>
                            </div>

                            <div className="lounge-perks">
                                <div className="perk center"><Users size={16} /> Dynamic Follow-ups & <Sparkles size={16} /> Behavior Analysis</div>
                            </div>

                            <div className="start-btn-container">
                                <button className="btn-premium start-btn-refined" onClick={handleStart} disabled={isStarting}>
                                    {isStarting ? 'Preparing Studio...' : 'Launch Private Session'}
                                    {!isStarting && <ChevronRight size={22} />}
                                </button>
                            </div>
                        </div>
                    </section>

                    <aside className="lounge-side">
                        <div className="premium-glass coach-card">
                            <div className="coach-preview premium-glass">
                                <Image src={coachInfo.image} alt={`Coach ${coachInfo.name}`} width={120} height={120} />
                            </div>
                            <div className="coach-info">
                                <strong>Meet Coach {coachInfo.name}</strong>
                                <p>{userData?.coachGender === 'male' ? 'He' : 'She'} specializes in behavioral architecture and soft-skill optimization.</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <style jsx>{`
        .premium-dashboard { min-height: 100vh; padding-bottom: 6rem; position: relative; }
        .lounge-nav { height: 100px; display: flex; align-items: center; justify-content: space-between; }
        .luxury-logo-sm { display: flex; align-items: center; gap: 0.8rem; font-weight: 800; font-size: 1.5rem; letter-spacing: -1px; }

        .nav-search { padding: 0.75rem 1.5rem; width: 320px; display: flex; align-items: center; gap: 1rem; border-radius: 100px; background: rgba(255,255,255,0.6); }
        .nav-search input { background: transparent; border: none; outline: none; width: 100%; font-weight: 500; color: var(--foreground); }

        .nav-user-actions { display: flex; align-items: center; gap: 1.5rem; }
        .user-profile-nav { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .nav-icon-btn { background: transparent; border: none; color: var(--muted); cursor: pointer; transition: 0.3s; padding: 0.5rem; border-radius: 12px; }
        .nav-icon-btn:hover { background: white; color: var(--primary); }

        .nav-icon-wrapper { position: relative; }
        .achievements-card {
            position: absolute; top: calc(100% + 15px); right: -100px; width: 340px;
            padding: 2rem; border-radius: 24px; opacity: 0; visibility: hidden;
            transform: translateY(10px); transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 100; box-shadow: var(--shadow-xl); border: 1px solid var(--border);
            background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);
        }
        .nav-icon-wrapper:hover .achievements-card { opacity: 1; visibility: visible; transform: translateY(0); }
        
        .user-avatar-wrapper, .premium-avatar-ring { 
            width: 44px; height: 44px; 
            border-radius: 50% !important; 
            overflow: hidden !important; 
            border: 2px solid white; 
            background: var(--glass-glow); 
            display: flex; align-items: center; justify-content: center; 
            box-shadow: var(--shadow-sm);
        }
        .user-avatar-wrapper img, .premium-avatar-ring img, .profile-img-circle { 
            width: 100% !important; 
            height: 100% !important; 
            object-fit: cover !important; 
            border-radius: 50% !important; 
        }

        .side-card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; color: var(--foreground); }
        .side-card-header h3 { font-size: 1.1rem; letter-spacing: -0.5px; }

        .achievement-list { display: flex; flex-direction: column; gap: 1.2rem; }
        .achievement-item { display: flex; gap: 1rem; align-items: flex-start; }
        .ach-icon { width: 28px; height: 28px; min-width: 28px; border-radius: 8px; background: #f0fdf4; color: #166534; display: flex; align-items: center; justify-content: center; }
        .ach-content p { font-size: 0.9rem; font-weight: 700; color: var(--foreground); margin-bottom: 0.2rem; }
        .ach-meta { display: flex; align-items: center; gap: 0.6rem; font-size: 0.75rem; color: var(--muted); font-weight: 600; }
        .ach-meta .dot { width: 3px; height: 3px; background: #cbd5e1; border-radius: 50%; }
        .empty-achievements { text-align: center; padding: 1rem 0; color: var(--muted); font-size: 0.85rem; font-weight: 500; }

        .lounge-content { margin-top: 2.5rem; }
        .lounge-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem; }
        .welcome-section h1 { letter-spacing: -3px; margin-bottom: 0.5rem; }

        .quick-stats-box { 
            display: flex; 
            padding: 1.25rem 2.5rem; 
            border-radius: 20px; 
            gap: 2.5rem; 
            align-items: center;
            background: rgba(255, 255, 255, 0.4);
            border: 1px solid var(--border);
        }
        .header-stat { display: flex; flex-direction: column; gap: 0.25rem; }
        .stat-label { font-size: 0.7rem; font-weight: 800; color: var(--muted); letter-spacing: 1px; }
        .stat-value { font-size: 1.5rem; font-weight: 900; color: var(--primary); font-family: var(--font-heading); }
        .stat-divider { width: 1px; height: 34px; background: var(--border); opacity: 0.6; }

        .user-first-name { font-weight: 700; font-size: 0.95rem; color: var(--foreground); transition: 0.3s; cursor: pointer; }

        .quick-stats { display: flex; gap: 1rem; }
        .stat-pill { background: white; padding: 0.8rem 1.5rem; border-radius: 20px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; min-width: 100px; box-shadow: var(--shadow-sm); }
        .stat-pill.highlight { border-color: transparent; background: linear-gradient(180deg, #fff, #fef2f2); box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.1); }
        .pill-val { font-size: 1.5rem; font-weight: 800; color: var(--foreground); }
        .pill-label { font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }

        .lounge-grid { display: grid; grid-template-columns: 1fr 360px; gap: 2.5rem; align-items: start; }

        .config-card { padding: 3rem; }
        .card-intro { display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem; }
        .icon-badge-premium { background: var(--glass-glow); width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: var(--primary); }
        .card-intro h3 { font-size: 1.8rem; letter-spacing: -1px; }

        .selection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem; }
        .lounge-group { display: flex; flex-direction: column; gap: 0.8rem; }
        .label-row { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 0.25rem; width: 100%; }
        .lounge-group label { font-size: 0.75rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.6; }
        .selection-hint { font-size: 0.7rem; font-weight: 800; color: var(--primary); opacity: 0.4; }

        .select-wrapper { 
            position: relative; 
            background: #f8fafc; 
            border: 1.5px solid #edf2f7; 
            border-radius: 20px; 
            transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
            width: 100%; 
            display: flex; 
            align-items: center; 
            padding-right: 1.5rem;
            cursor: pointer;
            box-shadow: var(--shadow-sm);
        }
        .select-wrapper:hover { border-color: var(--primary-glow); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .select-wrapper:focus-within { background: white; border-color: var(--primary); box-shadow: 0 0 0 6px var(--glass-glow); }
        .select-wrapper select { 
            width: 100%; 
            appearance: none; 
            background: transparent; 
            border: none; 
            padding: 1.3rem 1.75rem; 
            border-radius: 20px; 
            font-weight: 700; 
            font-size: 1.15rem; 
            cursor: pointer; 
            color: var(--foreground); 
            position: relative; 
            z-index: 1; 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .select-wrapper select:focus { outline: none; }
        .select-arrow { color: var(--primary); pointer-events: none; margin-left: -1rem; z-index: 2; transition: 0.3s; transform: scale(1.2); }
        .select-wrapper:hover .select-arrow { color: var(--secondary); transform: scale(1.3) translateY(1px); }

        .lounge-perks { display: flex; justify-content: center; gap: 1rem; margin-bottom: 3rem; border-top: 1px solid #f3f4f6; padding-top: 1.5rem; }
        .perk { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600; color: var(--muted); background: white; padding: 0.4rem 0.9rem; border-radius: 100px; border: 1px solid var(--border); }

        .start-btn-container { display: flex; justify-content: center; width: 100%; }
        .start-btn-refined { width: fit-content; min-width: 320px; padding: 1.4rem 3rem; font-size: 1.1rem; }

        .lounge-side { display: flex; flex-direction: column; gap: 2.5rem; }
        .coach-card { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; align-items: center; text-align: center; }
        .coach-preview { position: relative; width: 120px; height: 120px; border-radius: 40px; overflow: hidden; border: 4px solid white; box-shadow: var(--shadow-md); display: flex; justify-content: center; align-items: center; }
        .coach-preview img { width: 100%; height: 100%; object-fit: cover; }

        .community-card { padding: 2.5rem; }
        .community-card h4 { margin-bottom: 1.5rem; font-size: 1.1rem; }
        .achieve-list { display: flex; flex-direction: column; gap: 1.2rem; }
        .ach-item { display: flex; align-items: center; gap: 1rem; font-size: 0.9rem; font-weight: 500; }
        .ach-icon { background: var(--glass-glow); padding: 0.5rem; border-radius: 10px; color: var(--primary); }

        @media (max-width: 1024px) {
          .lounge-grid { grid-template-columns: 1fr; }
          .lounge-header { flex-direction: column; align-items: flex-start; gap: 2rem; }
          .selection-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </main>
    );
}
