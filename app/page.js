'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Sparkles, ShieldCheck, Heart, ArrowRight, AlertCircle, Ghost, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { db } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { loginAsGuest } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [coachGender, setCoachGender] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!loading && user) {
      if (user.emailVerified) {
        router.push('/dashboard');
      } else {
        setIsVerifying(true);
      }
    }
  }, [user, loading, router]);

  const validateForm = () => {
    const errors = {};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = "Please enter a valid corporate email.";
    }
    if (password.length < 8) {
      errors.password = "Security key must be at least 8 characters.";
    }
    if (!isLogin && !fullName.trim()) {
      errors.fullName = "Full name is required for profile creation.";
    }
    if (!isLogin && !coachGender) {
      errors.coachGender = "Please select your preferred coach gender.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name before sending verification
        await updateProfile(userCredential.user, { displayName: fullName });
        // Store coach preference in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          coachGender,
          fullName,
          email,
          createdAt: new Date()
        });
        await sendEmailVerification(userCredential.user);
        setIsVerifying(true);
      }
    } catch (err) {
      console.error(err);
      let message = err.message.replace('Firebase: ', '');

      const errorMap = {
        'auth/api-key-not-valid': "Firebase configuration is incomplete. Please ensure you have added your actual API keys in .env.local file.",
        'auth/invalid-credential': "The email or security key provided is incorrect.",
        'auth/email-already-in-use': "An account with this email already exists.",
        'auth/too-many-requests': "Too many failed attempts. Please try again later.",
      };

      for (const [code, mappedMsg] of Object.entries(errorMap)) {
        if (message.includes(code)) {
          message = mappedMsg;
          break;
        }
      }

      setError(message);

      // Mock Registration Fallback
      if (message.includes("config") || message.includes("API key")) {
        const mockBtn = document.getElementById('mock-registration-trigger');
        if (mockBtn) mockBtn.style.display = 'flex';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        setError("A new secure link has been dispatched to your inbox.");
      } catch (err) {
        setError("Resend failed. Please wait a moment and try again.");
      }
    }
  };

  if (isVerifying) {
    return (
      <main className="premium-auth">
        <div className="workspace-bg" />
        <div className="container center-flex">
          <div className="premium-glass verify-box animate-fade">
            <div className="status-indicator">
              <div className="pulse-dot"></div>
              <span>Awaiting Verification</span>
            </div>
            <h1 className="text-5xl">Check Your Invitation</h1>
            <p className="muted text-lg">
              We&apos;ve sent a secure access link to <span className="highlight">{email}</span>.
              The first step to your new career starts in your inbox.
            </p>
            <div className="action-stack">
              <button onClick={() => window.location.href = '/dashboard'} className="btn-premium">
                Enter Workspace
                <ArrowRight size={20} />
              </button>
              <div className="verify-actions">
                <button onClick={handleResendLink} className="resend-link">
                  <MailCheck size={16} />
                  Resend Link
                </button>
                <div className="divider-v"></div>
                <button onClick={() => setIsVerifying(false)} className="btn-secondary-transparent">
                  Use a different email
                </button>
              </div>
            </div>
          </div>
        </div>
        <style jsx>{`
          .premium-auth { min-height: 100vh; position: relative; overflow: hidden; }
          .center-flex { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .verify-box { max-width: 600px; padding: 4rem; text-align: center; }
          .status-indicator { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 2rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; }
          .pulse-dot { width: 10px; height: 10px; background: var(--primary); border-radius: 50%; animation: pulse 2s infinite; }
          @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); } }
          h1 { margin-bottom: 1.5rem; letter-spacing: -2px; }
          .highlight { color: var(--primary); font-weight: 700; }
          .action-stack { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 3rem; }
          .verify-actions { display: flex; align-items: center; justify-content: center; gap: 1rem; }
          .resend-link { background: transparent; border: none; color: var(--primary); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; transition: 0.3s; }
          .resend-link:hover { opacity: 0.7; }
          .divider-v { width: 1px; height: 16px; background: #edf2f7; }
          .btn-secondary-transparent { background: transparent; border: none; color: var(--muted); font-weight: 600; cursor: pointer; padding: 0.5rem; transition: 0.3s; font-size: 0.85rem; }
          .btn-secondary-transparent:hover { color: var(--foreground); }
        `}</style>
      </main>
    );
  }

  return (
    <main className="premium-auth">
      <div className="workspace-bg" />
      <div className="container auth-layout">
        <section className="brand-panel animate-fade">
          <div className="luxury-logo">
            <Image src="/logo.png" alt="AnInterview Logo" width={40} height={40} className="logo-img" style={{ borderRadius: '8px' }} />
            <span>AnInterview</span>
          </div>
          <h1 className="display-title">Elevate Your <br /><span className="gradient-text">Professional</span> <br /> Presence.</h1>
          <p className="description text-lg">
            Experience the world&apos;s most human-centric interview coaching platform.
            Real-time behavioral insights, powered by sophisticated AI.
          </p>
          <div className="value-props">
            <div className="prop">
              <ShieldCheck size={20} />
              <span>Enterprise Grade Security</span>
            </div>
            <div className="prop">
              <Heart size={20} />
              <span>Designed for Human Growth</span>
            </div>
          </div>
        </section>

        <section className="form-panel animate-fade" style={{ animationDelay: '0.2s' }}>
          <div className="premium-glass auth-card">
            <div className="auth-header">
              <h2>{isLogin ? 'Member Login' : 'Join the Elite'}</h2>
              <p className="muted">Enter your credentials to access the lounge.</p>
            </div>

            <form onSubmit={handleAuth} className="modern-form">
              {error && (
                <div className="error-banner animate-fade">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div id="mock-registration-trigger" className="mock-registration-hint animate-fade" style={{ display: 'none' }}>
                <div className="hint-icon"><Sparkles size={16} /></div>
                <div className="hint-text">
                  <p>Configuration Incomplete? No problem.</p>
                  <button type="button" onClick={() => loginAsGuest(fullName || 'Guest Architect')} className="btn-link">
                    Proceed as {fullName || 'Guest Architect'} (Local Session)
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Corporate Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  required
                  className={validationErrors.email ? 'input-error' : ''}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    className={validationErrors.fullName ? 'input-error' : ''}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  {validationErrors.fullName && <span className="error-text">{validationErrors.fullName}</span>}
                </div>
              )}

              {!isLogin && (
                <div className="input-group">
                  <label>Preferred Coach Gender</label>
                  <div className="gender-options">
                    <label className="gender-option">
                      <input
                        type="radio"
                        name="coachGender"
                        value="male"
                        checked={coachGender === 'male'}
                        onChange={(e) => setCoachGender(e.target.value)}
                      />
                      <span>Male (Gaddiel)</span>
                    </label>
                    <label className="gender-option">
                      <input
                        type="radio"
                        name="coachGender"
                        value="female"
                        checked={coachGender === 'female'}
                        onChange={(e) => setCoachGender(e.target.value)}
                      />
                      <span>Female (Devikaa)</span>
                    </label>
                  </div>
                  {validationErrors.coachGender && <span className="error-text">{validationErrors.coachGender}</span>}
                </div>
              )}

              <div className="input-group">
                <label>Security Key (Password)</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className={validationErrors.password ? 'input-error' : ''}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
              </div>

              <button type="submit" className="btn-premium w-full" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isLogin ? 'Enter Workspace' : 'Create Profile')}
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </form>

            <div className="auth-footer-toggle">
              <span className="muted">{isLogin ? "Don't have an account?" : "Already a member?"}</span>
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="toggle-btn">
                {isLogin ? 'Request Access' : 'Sign In'}
              </button>
            </div>

            <div className="guest-entry">
              <div className="divider"><span>OR</span></div>
              <button onClick={() => loginAsGuest()} className="guest-btn">
                <Ghost size={18} />
                <span>Try as Guest</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .premium-auth { min-height: 100vh; position: relative; overflow: hidden; display: flex; align-items: center; }
        .auth-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 4rem; align-items: center; width: 100%; }
        
        .luxury-logo { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 2rem; margin-bottom: 3rem; }
        .display-title { font-size: 5rem; line-height: 0.95; letter-spacing: -4px; color: #1a1b1e; margin-bottom: 2rem; }
        .description { color: var(--muted); max-width: 520px; line-height: 1.6; margin-bottom: 3rem; }
        
        .value-props { display: flex; gap: 2rem; }
        .prop { display: flex; align-items: center; gap: 0.75rem; color: #4a5568; font-weight: 600; font-size: 0.9rem; }
        .prop svg { color: var(--primary); }

        .auth-card { padding: 3.5rem; background: rgba(255, 255, 255, 0.9); }
        .auth-header { margin-bottom: 2.5rem; }
        .auth-header h2 { font-size: 2rem; margin-bottom: 0.5rem; letter-spacing: -1px; }

        .modern-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.75rem; }
        .input-group label { font-size: 0.85rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
        .input-group input { background: #f8fafc; border: 1.5px solid #edf2f7; padding: 1.1rem; border-radius: 16px; font-weight: 500; transition: all 0.3s; width: 100%; }
        .input-group input:focus { background: white; border-color: var(--primary); box-shadow: 0 0 0 5px var(--glass-glow); outline: none; }
        .input-group input.input-error { border-color: #ef4444; background: #fffafb; }
        
        .gender-options { display: flex; gap: 1rem; }
        .gender-option { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; }
        .gender-option input[type="radio"] { accent-color: var(--primary); }
        
        .error-text { font-size: 0.75rem; color: #ef4444; font-weight: 600; margin-top: -0.5rem; }

        .password-wrapper { position: relative; }
        .password-toggle { 
          position: absolute; 
          right: 1.25rem; 
          top: 50%; 
          transform: translateY(-50%); 
          background: transparent; 
          border: none; 
          color: var(--muted); 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          transition: 0.3s; 
        }
        .password-toggle:hover { color: var(--primary); }
        
        .error-banner { 
          background: #fee2e2; 
          color: #ef4444; 
          padding: 1rem; 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          gap: 0.75rem; 
          font-size: 0.85rem; 
          font-weight: 600;
          border: 1px solid #fecaca;
        }

        .mock-registration-hint {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 1.25rem;
          border-radius: 16px;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .hint-icon { color: var(--primary); margin-top: 0.2rem; }
        .hint-text p { font-size: 0.85rem; font-weight: 700; color: #0369a1; margin-bottom: 0.25rem; }
        .btn-link { background: transparent; border: none; color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline; padding: 0; font-size: 0.85rem; }
        
        .w-full { width: 100%; }
        .auth-footer-toggle { margin-top: 2.5rem; text-align: center; font-size: 0.95rem; }
        .toggle-btn { background: transparent; border: none; color: var(--primary); font-weight: 700; margin-left: 0.5rem; cursor: pointer; text-decoration: underline; }

        @media (max-width: 1100px) {
          .auth-layout { grid-template-columns: 1fr; text-align: center; padding-top: 5rem; }
          .brand-panel { display: flex; flex-direction: column; align-items: center; }
          .display-title { font-size: 3.5rem; }
          .value-props { justify-content: center; }
          .auth-card { margin: 0 auto; width: 100%; max-width: 500px; }
        }

        .guest-entry {
          margin-top: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--muted);
          font-size: 0.8rem;
          letter-spacing: 2px;
          font-weight: 700;
        }

        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #edf2f7;
        }

        .guest-btn {
          width: 100%;
          padding: 1.1rem;
          border-radius: 16px;
          background: white;
          border: 1.5px solid #edf2f7;
          color: #1a1b1e;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .guest-btn:hover {
          border-color: var(--primary);
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05);
        }
      `}</style>
    </main>
  );
}
