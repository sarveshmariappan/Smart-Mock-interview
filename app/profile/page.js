'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
    User,
    Mail,
    Calendar,
    Shield,
    ArrowLeft,
    Camera,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Phone,
    MapPin,
    Linkedin,
    Github,
    GraduationCap,
    FileText
} from 'lucide-react';

export default function ProfilePage() {
    return (
        <AuthGuard>
            <ProfileContent />
        </AuthGuard>
    );
}

function ProfileContent() {
    const router = useRouter();
    const { user, userData, isGuest, refreshUser, updateUserData } = useAuth();
    const fileInputRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [profilePic, setProfilePic] = useState(user?.photoURL || "/avatar.png");

    // Using local state for editable fields (if any)
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        linkedin: '',
        github: '',
        education: '',
        coachGender: 'male'
    });

    const calculateCompletion = () => {
        const fields = Object.values(formData);
        const filledFields = fields.filter(f => f && f.trim().length > 0);
        return Math.round((filledFields.length / fields.length) * 100);
    };

    const completion = calculateCompletion();

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                displayName: user.displayName || '',
                email: user.email || '',
                coachGender: userData?.coachGender || 'male'
            }));
            if (user.photoURL) setProfilePic(user.photoURL);
        }
    }, [user, userData]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (isGuest) {
            alert('Guest users cannot upload profile pictures. Please sign in to use this feature.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5 MB.');
            return;
        }

        setIsUploading(true);
        try {
            // Use the backend API to upload the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await res.json();
            const imageUrl = data.url;

            // No query string needed - filename already contains timestamp + random suffix
            // so each upload creates a unique URL that won't be cached

            if (auth.currentUser) {
                // Update Auth Profile with the backend-hosted image URL
                await updateProfile(auth.currentUser, { photoURL: imageUrl });
                await auth.currentUser.reload();
                if (typeof refreshUser === 'function') await refreshUser();
            } else {
                throw new Error('No authenticated user session found.');
            }

            setProfilePic(imageUrl);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Upload Error:', err);
            const msg = err.message || 'upload failed. Please check your internet connection and try again.';
            alert(`Failed to upload image: ${msg}`);
            setSaveStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Optimistic update so UI reflects immediately
            if (updateUserData) {
                updateUserData({ coachGender: formData.coachGender });
            }

            const syncOperations = async () => {
                if (auth.currentUser) {
                    // update displayName in Firebase Auth
                    await updateProfile(auth.currentUser, {
                        displayName: formData.displayName || auth.currentUser.displayName
                    });
                    await auth.currentUser.reload();
                    if (typeof refreshUser === 'function') await refreshUser();
                }

                // Update additional fields like coachGender
                if (!isGuest && user) {
                    await setDoc(doc(db, 'users', user.uid), {
                        coachGender: formData.coachGender
                    }, { merge: true });
                }
            };

            // Run sync in background without blocking UI
            syncOperations().catch(err => console.error("Background sync failed:", err));

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Save Error:', err);
            alert('Failed to save profile: ' + (err.message || '')); 
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="premium-profile">
            <div className="workspace-bg" />

            <div className="container profile-container animate-fade">
                <header className="profile-header">
                    <button className="back-btn" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="profile-title-row">
                        <h1 className="hero-text text-4xl">Student <span className="gradient-text">Profile</span></h1>
                        <div className="completion-tracker premium-glass">
                            <div className="completion-info">
                                <span>Profile Completion</span>
                                <strong>{completion}%</strong>
                            </div>
                            <div className="progress-bg">
                                <div className="progress-fill" style={{ width: `${completion}%` }}></div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="profile-grid">
                    <section className="profile-main-card premium-glass">
                        <div className="avatar-section">
                            <div className="premium-avatar-large">
                                {isUploading && (
                                    <div className="avatar-upload-overlay">
                                        <Loader2 className="animate-spin" size={32} color="white" />
                                    </div>
                                )}
                                <img
                                    src={profilePic}
                                    alt="Profile"
                                    width={120}
                                    height={120}
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: 'inherit',
                                        objectFit: 'cover'
                                    }}
                                />
                                <button
                                    type="button"
                                    className="avatar-edit-btn"
                                    title="Change Avatar"
                                    onClick={handleAvatarClick}
                                    disabled={isUploading}
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div className="user-intro">
                                <h2>{formData.displayName || 'Candidate'}</h2>
                                <p className="muted">Premium Student Account</p>
                                <div className="badge-row">
                                    <span className="premium-badge"><Shield size={14} /> Verified</span>
                                    <span className="premium-badge second"><Calendar size={14} /> Joined Feb 2026</span>
                                </div>
                            </div>
                        </div>

                        <form className="profile-form" onSubmit={handleSave}>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label><User size={16} /> Full Name</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>

                                <div className="input-group full-width">
                                    <label><User size={16} /> Preferred Mentor</label>
                                    <div className="mentor-selection">
                                        <div 
                                            className={`mentor-card ${formData.coachGender === 'male' ? 'selected' : ''}`}
                                            onClick={() => setFormData({ ...formData, coachGender: 'male' })}
                                        >
                                            <Image src="/coach-male.png" alt="Gaddiel" width={60} height={60} className="mentor-img" />
                                            <div className="mentor-info">
                                                <h4>Gaddiel</h4>
                                                <span>Expert Technical Coach</span>
                                            </div>
                                            <div className="radio-circle"></div>
                                        </div>
                                        <div 
                                            className={`mentor-card ${formData.coachGender === 'female' ? 'selected' : ''}`}
                                            onClick={() => setFormData({ ...formData, coachGender: 'female' })}
                                        >
                                            <Image src="/coach-female.png" alt="Devikaa" width={60} height={60} className="mentor-img" />
                                            <div className="mentor-info">
                                                <h4>Devikaa</h4>
                                                <span>Senior Behavioral Strategist</span>
                                            </div>
                                            <div className="radio-circle"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="input-group disabled">
                                    <label><Mail size={16} /> Email Address</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            readOnly
                                            className="readonly-input"
                                        />
                                        <AlertCircle size={16} className="lock-icon" title="Email cannot be changed" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label><Phone size={16} /> Phone Number</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label><MapPin size={16} /> Location</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="City, Country"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label><GraduationCap size={16} /> Education</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={formData.education}
                                            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                            placeholder="University / Degree"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label><Linkedin size={16} /> LinkedIn URL</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="url"
                                            value={formData.linkedin}
                                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                            placeholder="linkedin.com/in/username"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label><Github size={16} /> GitHub URL</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="url"
                                            value={formData.github}
                                            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                            placeholder="github.com/username"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label><FileText size={16} /> Professional Bio</label>
                                <div className="input-wrapper">
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Tell us about your professional background and goals..."
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button className="btn-premium save-btn" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Updating Profile...
                                        </>
                                    ) : (
                                        <>
                                            {saveStatus === 'success' ? <CheckCircle2 size={20} /> : null}
                                            {saveStatus === 'success' ? 'Changes Saved' : 'Save Profile Changes'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>

                    <aside className="profile-sidebar">
                        <div className="premium-glass security-card">
                            <h3><Shield size={18} /> Account Security</h3>
                            <p className="muted text-sm">Update your password or manage two-factor authentication to keep your interview data safe.</p>
                            <button className="text-link-premium">Managed Security Settings</button>
                        </div>

                        <div className="premium-glass integration-card">
                            <h3>Integrations</h3>
                            <div className="integration-item">
                                <div className="google-icon-mock">G</div>
                                <span>Account connected</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <style jsx>{`
                .premium-profile { min-height: 100vh; padding-bottom: 6rem; position: relative; }
                .profile-container { padding-top: 3rem; display: flex; flex-direction: column; gap: 3rem; }
                
                .profile-header { display: flex; flex-direction: column; gap: 1rem; }
                .back-btn { align-self: flex-start; background: transparent; border: none; display: flex; align-items: center; gap: 0.75rem; font-weight: 700; color: var(--muted); cursor: pointer; transition: 0.3s; margin-bottom: 0.5rem; }
                .back-btn:hover { color: var(--primary); transform: translateX(-5px); }
                
                .profile-title-row { display: flex; justify-content: space-between; align-items: flex-end; }
                .completion-tracker { padding: 1rem 1.5rem; width: 300px; border-radius: 20px; display: flex; flex-direction: column; gap: 0.8rem; }
                .completion-info { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.8rem; }
                .completion-info span { color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
                .completion-info strong { font-size: 1.2rem; color: var(--primary); }
                .progress-bg { height: 8px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
                .progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 100px; transition: 0.6s cubic-bezier(0.16, 1, 0.3, 1); }

                .profile-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; align-items: start; }
                
                .profile-main-card { padding: 4rem; }
                
                .avatar-section { display: flex; align-items: center; gap: 2.5rem; margin-bottom: 4rem; padding-bottom: 3rem; border-bottom: 1px solid var(--border); }
                .premium-avatar-large { position: relative; width: 120px; height: 120px; }
                .premium-avatar-large img { width: 100%; height: 100%; border-radius: 40px; object-fit: cover; border: 4px solid white; box-shadow: var(--shadow-lg); }
                .avatar-upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); border-radius: 40px; display: flex; align-items: center; justify-content: center; z-index: 5; }
                .avatar-edit-btn { position: absolute; bottom: -10px; right: -10px; background: white; border: none; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); cursor: pointer; box-shadow: var(--shadow-md); transition: 0.3s; z-index: 6; }
                .avatar-edit-btn:hover:not(:disabled) { background: var(--primary); color: white; transform: scale(1.1); }
                .avatar-edit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .user-intro h2 { font-size: 2rem; margin-bottom: 0.4rem; letter-spacing: -1px; }
                .badge-row { display: flex; gap: 1rem; margin-top: 1rem; }
                .premium-badge { background: #f0fdf4; color: #166534; padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; border: 1px solid #dcfce7; }
                .premium-badge.second { background: #f5f7ff; color: var(--primary); border-color: #e0e7ff; }

                .profile-form { display: flex; flex-direction: column; gap: 2.5rem; }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .input-group { display: flex; flex-direction: column; gap: 0.8rem; }
                .input-group label { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
                
                .input-wrapper { position: relative; display: flex; align-items: center; }
                .input-wrapper input, .input-wrapper textarea { width: 100%; appearance: none; background: #f8fafc; border: 1.5px solid #edf2f7; padding: 1.25rem; border-radius: 16px; font-weight: 600; font-size: 1rem; transition: 0.3s; font-family: inherit; }
                .input-wrapper input:focus, .input-wrapper textarea:focus { background: white; border-color: var(--primary); outline: none; box-shadow: 0 0 0 5px var(--glass-glow); }
                .input-wrapper textarea { resize: vertical; }
                
                .readonly-input { background: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #64748b !important; cursor: not-allowed; }
                .lock-icon { position: absolute; right: 1.25rem; color: #94a3b8; }

                .full-width { grid-column: 1 / -1; }
                .mentor-selection { display: flex; gap: 1.5rem; margin-top: 0.5rem; }
                .mentor-card { flex: 1; display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: #f8fafc; border: 2px solid #edf2f7; border-radius: 16px; cursor: pointer; transition: 0.3s; position: relative; }
                .mentor-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
                .mentor-card.selected { background: white; border-color: var(--primary); box-shadow: 0 4px 15px rgba(220, 38, 38, 0.1); }
                .mentor-img { border-radius: 12px; object-fit: cover; border: 2px solid white; box-shadow: var(--shadow-sm); }
                .mentor-info h4 { margin: 0; font-size: 1rem; color: var(--foreground); }
                .mentor-info span { font-size: 0.8rem; color: var(--muted); font-weight: 600; }
                .radio-circle { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #cbd5e1; position: absolute; right: 1.25rem; transition: 0.3s; }
                .mentor-card.selected .radio-circle { border-color: var(--primary); border-width: 6px; }

                .form-actions { margin-top: 1rem; }
                .save-btn { display: flex; align-items: center; justify-content: center; gap: 0.75rem; min-width: 240px; }

                .profile-sidebar { display: flex; flex-direction: column; gap: 2.5rem; }
                .security-card, .integration-card { padding: 2.5rem; display: flex; flex-direction: column; gap: 1.2rem; }
                .security-card h3, .integration-card h3 { font-size: 1.1rem; display: flex; align-items: center; gap: 0.6rem; }
                .text-link-premium { background: transparent; border: none; color: var(--primary); font-weight: 700; font-size: 0.85rem; text-align: left; cursor: pointer; padding: 0; }
                
                .integration-item { display: flex; align-items: center; gap: 0.8rem; font-size: 0.9rem; font-weight: 600; color: #475569; padding: 1rem; background: rgba(255,255,255,0.5); border-radius: 12px; border: 1px solid var(--border); }
                .google-icon-mock { width: 24px; height: 24px; border-radius: 6px; background: white; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #4285f4; border: 1px solid #eee; }

                @media (max-width: 1024px) {
                  .profile-grid { grid-template-columns: 1fr; }
                  .avatar-section { flex-direction: column; text-align: center; gap: 1.5rem; }
                  .badge-row { justify-content: center; }
                  .profile-title-row { flex-direction: column; align-items: flex-start; gap: 2rem; }
                  .completion-tracker { width: 100%; }
                  .form-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </main>
    );
}
