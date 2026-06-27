import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../services/api';

export default function Auth() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'register' ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = Email, 2 = OTP & New Password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ loading: false, error: null, success: false });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface dark:bg-dark-surface min-h-screen flex flex-col selection:bg-primary selection:text-on-primary overflow-hidden transition-colors duration-300">
      <main className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-surface-container-high via-transparent to-surface blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div
            className={`bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-xl p-8 card-shadow animate-slide-up ${
              shake ? 'animate-shake' : ''
            }`}
          >
            {/* Branding */}
            <div className="text-center mb-8">
              <h1 className="text-[24px] leading-[32px] tracking-[-0.01em] font-bold text-on-surface mb-1">
                SpendSense
              </h1>
              <p className="text-[16px] text-on-surface-variant">
                Analytical finance for students.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Name field (register only) */}
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[14px] font-medium text-on-surface-variant px-1" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-[16px] focus:outline-none focus:border-primary transition-all placeholder:text-outline"
                    placeholder="Alex Chen"
                    required={!isLogin}
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[14px] font-medium text-on-surface-variant px-1" htmlFor="auth-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-[16px] focus:outline-none focus:border-primary transition-all placeholder:text-outline"
                    placeholder="name@university.edu"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[14px] font-medium text-on-surface-variant" htmlFor="auth-password">
                    Password
                  </label>
                  {isLogin && (
                    <button type="button" onClick={() => setShowForgot(true)} className="text-[14px] font-medium text-on-surface hover:underline">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-[16px] focus:outline-none focus:border-primary transition-all"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary text-[14px] font-medium py-3 px-6 rounded-lg hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant text-[14px] font-medium py-3 px-6 rounded-lg hover:bg-surface-container-high transition-all active:scale-[0.98]"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                >
                  {isLogin ? 'Create Account' : 'Back to Sign In'}
                </button>
              </div>
            </form>

            {/* Error message */}
            {error && (
               <div className="mt-4 p-3 bg-error-container text-on-error-container text-[14px] font-medium rounded-lg flex items-start gap-2 animate-fade-in">
                <span className="text-[16px]">⚠</span>
                <span>{error}</span>
              </div>
            )}
          </div>
          
          {/* Forgot Password Overlay */}
          {showForgot && (
            <div className="absolute inset-0 z-20 bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-xl p-8 card-shadow animate-slide-up flex flex-col overflow-y-auto">
              <button 
                onClick={() => { setShowForgot(false); setForgotStatus({ loading: false, error: null, success: false }); setForgotStep(1); }}
                className="self-start p-2 -ml-2 mb-4 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="text-center mb-6">
                <div className="inline-flex p-3 bg-primary/10 text-primary rounded-full mb-3">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-[20px] font-bold text-on-surface mb-2">Reset Password</h2>
                <p className="text-[14px] text-on-surface-variant">
                  {forgotStep === 1 
                    ? "Enter your email address and we'll send you a 6-digit OTP." 
                    : "Enter your OTP and new password to reset your account."}
                </p>
              </div>

              {forgotStep === 1 ? (
                <form 
                  className="space-y-4 mt-2" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setForgotStatus({ loading: true, error: null, success: false });
                    try {
                      await forgotPassword(forgotEmail);
                      // Clear success state so the step 2 form inputs will render
                      setForgotStatus({ loading: false, error: null, success: false });
                      setForgotStep(2); // Move to OTP step
                    } catch (err) {
                      setForgotStatus({ loading: false, error: err.response?.data?.message || 'Failed to send OTP', success: false });
                    }
                  }}
                >
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-[16px] focus:outline-none focus:border-primary transition-all placeholder:text-outline"
                      placeholder="name@university.edu"
                    />
                  </div>
                  
                  {forgotStatus.error && (
                    <div className="p-2 text-error text-[13px] font-medium text-center">
                      {forgotStatus.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotStatus.loading}
                    className="w-full bg-primary text-on-primary text-[14px] font-medium py-3 px-6 rounded-lg hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm flex items-center justify-center disabled:opacity-50 mt-4"
                  >
                    {forgotStatus.loading ? <span className="animate-spin">⟳</span> : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form 
                  className="space-y-4 mt-2" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (newPassword !== confirmPassword) {
                      setForgotStatus({ loading: false, error: "Passwords do not match", success: false });
                      return;
                    }
                    setForgotStatus({ loading: true, error: null, success: false });
                    try {
                      const { resetPassword } = await import('../services/api');
                      await resetPassword(forgotEmail, otp, newPassword);
                      setForgotStatus({ loading: false, error: null, success: true });
                      setTimeout(() => {
                        window.location.href = '/dashboard';
                      }, 2000);
                    } catch (err) {
                      setForgotStatus({ loading: false, error: err.response?.data?.message || 'Failed to reset password', success: false });
                    }
                  }}
                >
                  {forgotStatus.success ? (
                    <div className="flex flex-col items-center py-4">
                      <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-center w-full">
                        <p className="text-[14px] font-medium text-success mb-1">Password reset successfully!</p>
                        <p className="text-[13px] text-on-surface-variant">Redirecting to your dashboard...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-success/10 text-success rounded-lg text-center text-[13px] font-medium border border-success/20">
                        An OTP has been sent to your email.
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-[18px] text-center tracking-[0.5em] font-bold focus:outline-none focus:border-primary transition-all placeholder:text-outline placeholder:tracking-normal placeholder:font-normal"
                          placeholder="6-digit OTP"
                        />
                      </div>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-[16px] focus:outline-none focus:border-primary transition-all"
                          placeholder="New Password"
                        />
                      </div>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-[16px] focus:outline-none focus:border-primary transition-all"
                          placeholder="Confirm New Password"
                        />
                      </div>
                      
                      {forgotStatus.error && (
                        <div className="p-2 text-error text-[13px] font-medium text-center">
                          {forgotStatus.error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={forgotStatus.loading}
                        className="w-full bg-primary text-on-primary text-[14px] font-medium py-3 px-6 rounded-lg hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm flex items-center justify-center disabled:opacity-50 mt-4"
                      >
                        {forgotStatus.loading ? <span className="animate-spin">⟳</span> : 'Reset Password'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setForgotStep(1)}
                        className="w-full text-center text-[13px] text-on-surface-variant hover:text-primary mt-2"
                      >
                        Didn't receive an OTP? Try again.
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Security badge */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-surface-container-low rounded-full border border-outline-variant">
              <ShieldCheck size={14} className="text-on-surface-variant" />
              <p className="text-[12px] text-on-surface-variant">
                Secure, bank-level encryption for your data.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[14px] font-medium text-on-surface-variant border-t border-outline-variant dark:border-dark-outline-variant bg-surface-container-lowest dark:bg-dark-surface-container-lowest">
        <div className="flex flex-wrap justify-center gap-6">
          <a href="#" className="hover:text-on-surface transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-on-surface transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-on-surface transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
