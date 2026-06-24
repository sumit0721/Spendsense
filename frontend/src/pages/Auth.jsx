import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

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
                    <button type="button" className="text-[14px] font-medium text-on-surface hover:underline">
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
