'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCoachInfo } from '@/lib/coach';
import {
    Mic,
    Square,
    ChevronRight,
    AlertCircle,
    Loader2,
    Sparkles,
    Video,
    VideoOff,
    Volume2,
    Repeat
} from 'lucide-react';
import { QUESTIONS, DEFAULT_QUESTIONS } from '@/lib/data';

export default function InterviewPage() {
    return (
        <AuthGuard>
            <InterviewContent />
        </AuthGuard>
    );
}

function InterviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, userData } = useAuth();
    const domain = searchParams.get('domain');
    const difficulty = searchParams.get('difficulty');

    const coachInfo = getCoachInfo(userData?.coachGender);

    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [timer, setTimer] = useState(0);
    const timerRef = useRef(null);
    const videoRef = useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [stream, setStream] = useState(null);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationProgress, setEvaluationProgress] = useState(0);



    // Webcam Effect
    useEffect(() => {
        let activeStream = null;
        if (isVideoOn && navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(s => {
                    activeStream = s;
                    setStream(s);
                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                    }
                })
                .catch(err => {
                    console.warn("Webcam access denied or not available:", err);
                    setIsVideoOn(false);
                });
        }
        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isVideoOn]);
    const [recognition, setRecognition] = useState(null);
    const [error, setError] = useState(null);
    const [startTime, setStartTime] = useState(null);

    const [dynamicQuestions, setDynamicQuestions] = useState([]);
    const [responses, setResponses] = useState([]); // Store { transcript, timeTaken }
    const [evaluations, setEvaluations] = useState([]);

    useEffect(() => {
        const domainData = QUESTIONS[domain];
        let pool = (domainData && domainData[difficulty]) ? [...domainData[difficulty]] : [...DEFAULT_QUESTIONS.map(q => ({ text: q, idealAnswer: "", keywords: [] }))];

        // Shuffle and pick 5 unique questions
        const shuffled = pool.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDynamicQuestions(selected);
        setCurrentIdx(0);
        setEvaluations([]);
    }, [domain, difficulty]);

    // TTS Effect
    useEffect(() => {
        if (dynamicQuestions.length > 0 && typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel(); // Stop any previous speaking
            const currentQ = dynamicQuestions[currentIdx];
            const textToSpeak = typeof currentQ === 'string' ? currentQ : currentQ?.text;
            if (textToSpeak) {
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                
                // Try to use a better sounding voice if available
                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v => v.lang.includes('en-US') && (v.name.includes('Google') || v.name.includes('Female')));
                if (preferredVoice) utterance.voice = preferredVoice;

                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);
                
                window.speechSynthesis.speak(utterance);
            }
        }
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [currentIdx, dynamicQuestions]);


    useEffect(() => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = true;
            recog.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };
            recog.onerror = (e) => { setError(`Connectivity Issue: ${e.error}`); setIsRecording(false); };
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRecognition(recog);
        } else {
            setTimeout(() => setError('Studio audio requires a compatible browser.'), 0);
        }
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            setTranscript('');
            setStartTime(Date.now());
            recognition.start();
            setIsRecording(true);
            setError(null);
        }
    };

    const repeatQuestion = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const currentQ = dynamicQuestions[currentIdx];
            const textToSpeak = typeof currentQ === 'string' ? currentQ : currentQ?.text;
            if (textToSpeak) {
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v => v.lang.includes('en-US') && (v.name.includes('Google') || v.name.includes('Female')));
                if (preferredVoice) utterance.voice = preferredVoice;

                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);
                
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const handleNext = async () => {
        if (!transcript) {
            setError("Please share your thoughts before we proceed.");
            return;
        }

        const timeTaken = (Date.now() - startTime) / 1000;
        const currentResponse = { transcript, timeTaken, question: dynamicQuestions[currentIdx] };
        const updatedResponses = [...responses, currentResponse];
        setResponses(updatedResponses);

        if (currentIdx < 4) {
            // Instant transition for questions 1-4
            setCurrentIdx(currentIdx + 1);
            setTranscript('');
            setTimer(0);
            setStartTime(Date.now());
        } else {
            // Final Step - Parallel Evaluation
            setIsEvaluating(true);
            setEvaluationProgress(0);
            try {
                const evalPromises = updatedResponses.map((resp, idx) =>
                    fetch('/api/evaluate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(resp)
                    }).then(r => r.json())
                        .then(data => {
                            setEvaluationProgress(prev => prev + 1);
                            return data;
                        })
                        .catch(err => {
                            console.error('Evaluation error:', err);
                            setEvaluationProgress(prev => prev + 1);
                            return { score: { technical: 5, communication: 5, overall: 5 }, metrics: {} };
                        })
                );

                const allEvaluations = await Promise.all(evalPromises);

                const avgScore = allEvaluations.length
                    ? Number((allEvaluations.reduce((acc, curr) => acc + (curr.score?.overall || 0), 0) / allEvaluations.length).toFixed(2))
                    : 0;
                const finalResult = {
                    userId: user.uid,
                    domain,
                    difficulty,
                    evaluations: allEvaluations,
                    overallScore: avgScore,
                    timestamp: serverTimestamp()
                };

                // wrap addDoc in a timeout to avoid hanging indefinitely
                const firestoreTimeout = (promise, ms) => {
                    let id;
                    const timeout = new Promise((_, reject) => {
                        id = setTimeout(() => reject(new Error('firestore_timeout')), ms);
                    });
                    return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
                };

                let docRef = null;
                let navigateUrl = null;

                try {
                    docRef = await firestoreTimeout(
                        addDoc(collection(db, "interviews"), finalResult),
                        10000 // 10 seconds max
                    );
                    navigateUrl = `/results?id=${docRef.id}`;
                    console.log('Results saved to Firestore:', docRef.id);
                } catch (e) {
                    console.warn('Firestore write failed/timed out, using fallback:', e.message);
                    // Fallback: store in session and navigate
                    try {
                        sessionStorage.setItem('pendingResult', JSON.stringify(finalResult));
                        navigateUrl = `/results?fallback=true`;
                    } catch (storageErr) {
                        console.error('Session storage failed:', storageErr);
                        navigateUrl = `/results?fallback=true`;
                    }
                }

                // Ensure we navigate
                setIsEvaluating(false);
                if (navigateUrl) {
                    console.log('Navigating to:', navigateUrl);
                    router.push(navigateUrl);
                } else {
                    console.error('Failed to determine navigation URL');
                    router.push('/dashboard');
                }
            } catch (err) {
                console.error("Parallel Eval Error:", err);
                setIsEvaluating(false);
                setError("Processing complete. Redirecting to results...");
                // Still navigate even if there's an error
                setTimeout(() => {
                    sessionStorage.setItem('pendingResult', JSON.stringify({
                        userId: user.uid,
                        domain,
                        difficulty,
                        evaluations: [],
                        overallScore: 0,
                        timestamp: serverTimestamp()
                    }));
                    router.push('/results?fallback=true');
                }, 1500);
            }
        }
    };

    if (dynamicQuestions.length === 0) return <div className="loading"><Loader2 className="animate-spin" /></div>;

    return (
        <main className="interview-studio">
            <div className="workspace-bg" />

            {isEvaluating && (
                <div className="evaluation-overlay">
                    <div className="loader-box premium-glass">
                        <div className="moving-circles">
                            <div className="circle"></div>
                            <div className="circle"></div>
                            <div className="circle"></div>
                        </div>
                        <h3>Analyzing Your Responses...</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
                            Processing answer {evaluationProgress} of 5
                        </p>
                        <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${(evaluationProgress / 5) * 100}%`,
                                background: 'var(--primary)',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1rem' }}>
                            Creating your personalized report...
                        </p>
                    </div>
                </div>
            )}

            <div className="container studio-container animate-fade">
                <header className="studio-header">
                    <div className="header-pill premium-glass">
                        <div className="live-indicator"><span className="pulse-dot"></span> LIVE SESSION</div>
                        <div className="session-timer">{formatTime(timer)}</div>
                        <div className="session-meta">{domain} • {difficulty}</div>
                    </div>
                    <div className="progress-bar-container">
                        <div className="progress-fill" style={{ width: `${((currentIdx + 1) / 5) * 100}%` }}></div>
                    </div>
                </header>

                <section className="studio-grid">
                    <div className="question-island-top">
                        <div className="premium-glass question-card-premium">
                            <div className="studio-card-label-row">
                                <div className="studio-card-label">CURRENT INQUIRY</div>
                                <button className="repeat-btn" onClick={repeatQuestion} disabled={isSpeaking} title="Repeat Question">
                                    <Repeat size={14} /> Repeat
                                </button>
                            </div>
                            <h2 className="studio-question">
                                {typeof dynamicQuestions[currentIdx] === 'string'
                                    ? dynamicQuestions[currentIdx]
                                    : dynamicQuestions[currentIdx]?.text}
                            </h2>
                        </div>
                    </div>

                    <div className="studio-main-content">
                        <div className="coach-col">
                            <div className="premium-glass coach-stage-compact">
                                <div className="coach-frame-compact">
                                    <Image src={coachInfo.image} alt={`Coach ${coachInfo.name}`} className="coach-image-compact" fill style={{ objectFit: 'cover' }} priority />
                                    {(isRecording || isSpeaking) && <div className="voice-waves-compact">
                                        <span></span><span></span><span></span><span></span>
                                    </div>}
                                </div>
                                <div className="coach-caption-compact premium-glass">
                                    <Sparkles size={12} color="var(--primary)" />
                                    <span>Coach {coachInfo.name} is {isSpeaking ? 'speaking...' : 'listening...'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="center-col">
                            <div className="premium-glass transcript-studio">
                                <div className="ts-header">
                                    <div className="ts-label">REAL-TIME TRANSCRIPT</div>
                                    {isRecording && <div className="recording-status">Recording...</div>}
                                </div>
                                <div className="transcript-content">
                                    {transcript || "Your response will appear here as you speak..."}
                                </div>
                            </div>

                            <div className="control-deck">
                                <button
                                    className={`record-btn-compact ${isRecording ? 'recording' : ''} ${isSpeaking ? 'disabled' : ''}`}
                                    onClick={toggleRecording}
                                    disabled={isEvaluating || isSpeaking}
                                    title={isSpeaking ? "Coach is speaking..." : ""}
                                >
                                    {isSpeaking ? <Volume2 size={20} className="animate-pulse" /> : (isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />)}
                                    <span>{isSpeaking ? 'Listening to Coach...' : (isRecording ? 'Stop Recording' : 'Start Recording')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="user-col">
                            <div className="user-cam-compact premium-glass">
                                <div className="cam-header">
                                    <span>YOUR FEED</span>
                                    <button onClick={() => setIsVideoOn(!isVideoOn)} className="cam-toggle-btn">
                                        {isVideoOn ? <Video size={14} /> : <VideoOff size={14} />}
                                    </button>
                                </div>
                                <div className="cam-frame">
                                    {isVideoOn ? (
                                        <video ref={videoRef} autoPlay playsInline muted className="user-video" />
                                    ) : (
                                        <div className="cam-off-state"><VideoOff size={24} color="var(--muted)" /></div>
                                    )}
                                </div>
                            </div>
                            <button
                                className="btn-next-premium"
                                onClick={handleNext}
                                disabled={isRecording || isEvaluating}
                            >
                                {isEvaluating ? <Loader2 className="animate-spin" /> : (currentIdx === 4 ? 'Complete Session' : 'Next Question')}
                                {!isEvaluating && <ChevronRight size={20} />}
                            </button>
                        </div>
                    </div>
                </section>

                {error && <div className="studio-error"><AlertCircle size={18} /> {error}</div>}
            </div>

            <style jsx>{`
        .interview-studio { min-height: 100vh; background: #fafafa; overflow: hidden; position: relative; }
        .workspace-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 0% 0%, var(--glass-glow) 0%, transparent 50%), radial-gradient(circle at 100% 100%, var(--glass-glow) 0%, transparent 50%); opacity: 0.5; z-index: -1; }
        .studio-container { max-width: 1400px; margin: 0 auto; height: 100vh; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        
        .studio-header { display: flex; justify-content: space-between; align-items: center; }
        .header-pill { display: flex; align-items: center; gap: 1.5rem; padding: 0.6rem 1.25rem; border-radius: 100px; border: 1px solid var(--border); }
        .live-indicator { display: flex; align-items: center; gap: 0.6rem; font-size: 0.7rem; font-weight: 800; color: #ef4444; letter-spacing: 1px; }
        .pulse-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        .session-timer { background: rgba(0,0,0,0.05); padding: 0.3rem 0.8rem; border-radius: 8px; font-family: monospace; font-weight: 700; font-size: 0.9rem; color: var(--primary); border: 1px solid rgba(0,0,0,0.1); }
        .session-meta { font-size: 0.85rem; font-weight: 700; color: var(--muted); }
        
        .progress-bar-container { flex: 1; max-width: 400px; height: 6px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); transition: 0.5s; }

        .studio-grid { display: flex; flex-direction: column; gap: 1.5rem; flex: 1; overflow: hidden; }
        .question-island-top { width: 100%; }
        .question-card-premium { padding: 2rem 3rem; border-left: 6px solid var(--primary); }
        .studio-card-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
        .studio-card-label { font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 0; }
        .repeat-btn { display: flex; align-items: center; gap: 0.5rem; background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; cursor: pointer; font-size: 0.8rem; font-weight: 800; transition: 0.2s; padding: 0.4rem 0.8rem; border-radius: 100px; box-shadow: var(--shadow-sm); }
        .repeat-btn:hover:not(:disabled) { background: #ef4444; color: white; border-color: #ef4444; transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .repeat-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #f1f5f9; color: #94a3b8; border-color: #e2e8f0; }
        .studio-question { line-height: 1.3; letter-spacing: -1px; font-weight: 800; font-size: 1.8rem; }

        .studio-main-content { display: grid; grid-template-columns: 300px minmax(0, 1fr) 300px; gap: 2rem; flex: 1; overflow: hidden; min-height: 0; }
        
        .coach-col { display: flex; flex-direction: column; gap: 1.5rem; min-height: 0; }
        .user-col { display: flex; flex-direction: column; gap: 1.5rem; min-height: 0; justify-content: space-between; }
        .center-col { display: flex; flex-direction: column; gap: 1.5rem; min-height: 0; overflow: hidden; flex: 1; }

        .coach-stage-compact { padding: 0.5rem; position: relative; width: 100%; aspect-ratio: 4/5; border-radius: 20px; overflow: visible; background: white; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
        .coach-frame-compact { width: 100%; height: 100%; overflow: hidden; border-radius: 16px; position: relative; }
        .coach-image-compact { width: 100%; height: 100%; object-fit: cover; }

        .voice-waves-compact { position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); display: flex; gap: 3px; align-items: flex-end; height: 24px; }
        .voice-waves-compact span { width: 2px; background: white; border-radius: 10px; animation: wave 1s ease-in-out infinite; }
        @keyframes wave { 0%, 100% { height: 8px; } 50% { height: 24px; } }
        
        .coach-caption-compact { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); padding: 0.4rem 0.8rem; white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.65rem; color: var(--foreground); z-index: 10; box-shadow: var(--shadow-sm); }

        .transcript-studio { padding: 2rem; flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
        .ts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .ts-label { font-size: 0.7rem; font-weight: 800; color: var(--muted); letter-spacing: 1.5px; }
        .recording-status { font-size: 0.75rem; font-weight: 700; color: #ef4444; display: flex; align-items: center; gap: 0.5rem; }
        .recording-status::before { content: ''; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s infinite; }
        
        .transcript-content { font-size: 1.25rem; font-weight: 600; line-height: 1.6; color: var(--foreground); opacity: 0.9; overflow-y: auto; padding-right: 1rem; }
        .transcript-content::-webkit-scrollbar { width: 6px; }
        .transcript-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

        .control-deck { display: flex; gap: 1.5rem; align-items: center; padding: 0.5rem 0; width: 100%; }
        .record-btn-compact { flex: 1; padding: 1rem; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 0.8rem; font-weight: 800; font-size: 0.95rem; border: none; background: #000; color: #fff; cursor: pointer; transition: 0.3s; }
        .record-btn-compact.recording { background: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
        .record-btn-compact.disabled { opacity: 0.6; cursor: not-allowed; background: #94a3b8; }
        
        .user-cam-compact { width: 100%; padding: 0.5rem; border-radius: 20px; background: white; border: 1px solid var(--border); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.5rem; }
        .cam-header { display: flex; justify-content: space-between; align-items: center; padding: 0 0.5rem; font-size: 0.65rem; font-weight: 800; color: var(--muted); letter-spacing: 1px; }
        .cam-toggle-btn { background: transparent; border: none; cursor: pointer; color: var(--muted); display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .cam-toggle-btn:hover { color: var(--primary); }
        .cam-frame { width: 100%; aspect-ratio: 4/3; border-radius: 14px; overflow: hidden; background: #1e293b; position: relative; }
        .user-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        .cam-off-state { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
        .btn-next-premium { width: 100%; padding: 1rem 2rem; border-radius: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: 0.3s; }
        .btn-next-premium:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: white; }

        .evaluation-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .loader-box { padding: 4rem; border-radius: 40px; text-align: center; max-width: 550px; display: flex; flex-direction: column; align-items: center; gap: 2rem; border: 1px solid var(--border); box-shadow: var(--shadow-xl); background: white; }
        
        .moving-circles { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
        .moving-circles .circle { width: 18px; height: 18px; border-radius: 50%; background: var(--primary); animation: pulse-circle 1.5s infinite ease-in-out; }
        .moving-circles .circle:nth-child(2) { animation-delay: 0.2s; background: var(--secondary); }
        .moving-circles .circle:nth-child(3) { animation-delay: 0.4s; background: var(--accent); }
        
        @keyframes pulse-circle {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.5); opacity: 1; }
        }

        .loader-box h3 { font-size: 1.8rem; font-weight: 800; color: var(--foreground); letter-spacing: -1px; }
        .loader-box p { font-size: 0.95rem; color: var(--muted); line-height: 1.6; }

        .studio-error { background: #fee2e2; color: #ef4444; padding: 1rem 1.5rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; }

        @media (max-width: 1024px) {
          .studio-grid { height: auto; overflow: visible; }
          .studio-main-content { grid-template-columns: 1fr; }
          .coach-col { order: 2; }
          .center-col { order: 1; }
          .user-col { order: 3; }
          .transcript-studio { min-height: 400px; }
        }
      `}</style>
        </main>
    );
}
