import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

function ForgotModal({ onClose }) {
  const [step, setStep]             = useState('email');
  const [email, setEmail]           = useState('');
  const [otp, setOtp]               = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);

  const sendOtp = async () => {
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent! Check your inbox.');
      setStep('otp');
    } catch (e) { toast.error(e.response?.data?.message || 'Error sending OTP'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setResetToken(data.resetToken);
      setStep('reset');
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid or expired OTP'); }
    finally { setLoading(false); }
  };

  const resetPass = async () => {
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword: password });
      toast.success('Password reset successfully! Please log in.');
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  const steps = ['email', 'otp', 'reset'];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className="card w-full max-w-sm p-8 shadow-card animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-textBase">
            {step === 'email' ? '🔐 Forgot Password' : step === 'otp' ? '📧 Verify OTP' : '🔑 New Password'}
          </h2>
          <button onClick={onClose} className="text-textMuted hover:text-textBase text-xl leading-none">✕</button>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                step === s ? 'bg-primary text-white' : steps.indexOf(step) > i ? 'bg-success text-white' : 'bg-elevated border border-border text-textMuted'
              }`}>{i + 1}</div>
              {i < 2 && <div className={`flex-1 h-px ${steps.indexOf(step) > i ? 'bg-success' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {step === 'email' && (
          <div className="flex flex-col gap-4">
            <p className="text-textDim text-sm">Enter your account email and we'll send you a one-time password.</p>
            <input className="input-field" type="email" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()} />
            <button onClick={sendOtp} disabled={loading} className="btn-primary py-3 text-sm shadow-glow">
              {loading ? 'Sending…' : 'Send OTP →'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="flex flex-col gap-4">
            <p className="text-textDim text-sm">
              Code sent to <strong className="text-textBase">{email}</strong>. Expires in 10 minutes.
            </p>
            <input className="input-field font-mono text-2xl tracking-[0.35em] text-center" maxLength={6}
              placeholder="000000" value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()} />
            <button onClick={verifyOtp} disabled={loading} className="btn-primary py-3 text-sm shadow-glow">
              {loading ? 'Verifying…' : 'Verify OTP →'}
            </button>
            <button onClick={() => { setStep('email'); setOtp(''); }} className="text-textMuted text-xs hover:text-textDim text-center transition-colors">
              ← Change email / Resend
            </button>
          </div>
        )}

        {step === 'reset' && (
          <div className="flex flex-col gap-4">
            <p className="text-textDim text-sm">Choose a strong new password for your account.</p>
            <input className="input-field" type="password" placeholder="New password (min 6 chars)"
              value={password} onChange={e => setPassword(e.target.value)} />
            <input className="input-field" type="password" placeholder="Confirm new password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && resetPass()} />
            <button onClick={resetPass} disabled={loading} className="btn-primary py-3 text-sm shadow-glow">
              {loading ? 'Resetting…' : 'Reset Password ✓'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]           = useState('login');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const switchMode = (m) => { setMode(m); setName(''); setEmail(''); setPassword(''); };

  const submit = async () => {
    if (!email || !password || (mode === 'register' && !name)) { toast.error('Fill in all fields.'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'register') { await register(name, email, password); toast.success('Account created! Welcome 🎉'); }
      else { await login(email, password); toast.success('Welcome back! 👋'); }
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg bg-grid flex items-center justify-center font-sans relative overflow-hidden px-4">
      <div className="absolute w-[700px] h-[700px] rounded-full pointer-events-none -top-64 -right-64"
           style={{ background: 'radial-gradient(circle,rgba(41,121,255,0.08) 0%,transparent 65%)' }} />
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none -bottom-40 -left-40"
           style={{ background: 'radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 65%)' }} />

      <div className="card w-full max-w-md p-10 shadow-card animate-scale-in relative z-10">
        <a href="/" className="inline-flex items-center gap-1.5 text-textMuted text-xs hover:text-textDim mb-6 transition-colors">
          ← Back to Home
        </a>
        <div className="text-center mb-8">
          <div className="text-3xl font-black gradient-text tracking-tight">◈ EduLive</div>
          <p className="text-textDim text-sm mt-1.5">Virtual Classroom Platform</p>
        </div>
        <div className="flex bg-elevated rounded-lg p-1 mb-7">
          {[['login','Sign In'],['register','Sign Up']].map(([m, label]) => (
            <button key={m} onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${mode === m ? 'bg-primary text-white' : 'text-textDim hover:text-textBase'}`}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <div className="mb-5 px-3 py-2.5 bg-warning/10 border border-warning/30 rounded-lg animate-slide-up">
            <p className="text-warning text-xs leading-relaxed">
              📌 New accounts default to <strong>Student</strong> role. An admin can upgrade your role anytime.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          {mode === 'register' && (
            <input className="input-field animate-slide-up" placeholder="Full Name"
              value={name} onChange={e => setName(e.target.value)} />
          )}
          <input className="input-field" type="email" placeholder="Email Address"
            value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input-field" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        {mode === 'login' && (
          <div className="text-right mt-2.5">
            <button onClick={() => setShowForgot(true)} className="text-accent text-xs hover:underline transition-colors">
              Forgot Password?
            </button>
          </div>
        )}

        <button onClick={submit} disabled={loading} className="btn-primary w-full mt-5 py-3.5 text-base shadow-glow">
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </span>
            : mode === 'login' ? 'Sign In →' : 'Create Account →'}
        </button>
        <p className="text-center text-textDim text-sm mt-5">
          {mode === 'login' ? 'No account? ' : 'Have an account? '}
          <span onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="text-accent cursor-pointer font-semibold hover:underline">
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
