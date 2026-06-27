import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Sparkles, CheckCircle, ShoppingBag, Banknote, Brain, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Scroll reveal on mount
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-surface text-on-surface overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-surface shadow-sm border-b border-outline-variant transition-colors duration-300">
        <div className="flex justify-between items-center w-full px-4 md:px-10 py-4 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-4 md:gap-8">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-[20px] md:text-[24px] font-bold text-on-surface cursor-pointer tracking-tight">SpendSense</span>
            <div className="hidden md:flex gap-6 items-center">
              <a href="#features" className="text-on-surface-variant text-[14px] font-medium hover:text-on-surface transition-colors">Features</a>
              <a href="#how-it-works" className="text-on-surface-variant text-[14px] font-medium hover:text-on-surface transition-colors">How it Works</a>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 hover:bg-surface-container-low border border-outline-variant/60 hover:border-outline-variant text-on-surface-variant hover:text-primary rounded-lg transition-all focus:outline-none flex"
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <Link to="/dashboard" className="hidden sm:inline-flex bg-primary text-on-primary px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-sm">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:block text-on-surface-variant text-[14px] font-medium px-4 py-2 hover:bg-surface-container-low rounded-lg transition-all">
                  Login
                </Link>
                <Link to="/auth" className="hidden sm:inline-flex bg-primary text-on-primary px-6 py-2.5 rounded-lg text-[14px] font-medium hover:opacity-90 transition-all active:scale-95 shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer for Landing Page */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80%] bg-surface h-full flex flex-col shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <span className="text-[18px] font-bold text-primary tracking-tight">SpendSense</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-4">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-on-surface font-medium py-2 border-b border-outline-variant/50">Features</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-on-surface font-medium py-2 border-b border-outline-variant/50">How it Works</a>

              <div className="mt-auto flex flex-col gap-3 pb-safe">
                {user ? (
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary text-on-primary text-center px-4 py-3 rounded-xl font-medium shadow-sm">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="bg-surface-container-low text-on-surface text-center px-4 py-3 rounded-xl font-medium">
                      Login
                    </Link>
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary text-on-primary text-center px-4 py-3 rounded-xl font-medium shadow-sm">
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[600px] flex items-center overflow-hidden pt-20">
          <div className="max-w-[1280px] mx-auto px-10 grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
              <span className="inline-block bg-anomaly-bg text-anomaly-text px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider mb-6">
                Financial Intelligence
              </span>
              <h1 className="text-[48px] leading-[1.1] tracking-[-0.02em] font-bold mb-6 text-on-surface">
                Your Money, <span className="text-[#EA580C]">Explained.</span>
              </h1>
              <p className="text-[18px] leading-[1.6] text-on-surface-variant mb-10 max-w-lg">
                The ultimate AI-driven financial oversight tool designed specifically for the next generation.
                Securely track spending, predict future budgets, and get academic-level financial advice.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={user ? "/dashboard" : "/auth"}
                  className="bg-primary text-on-primary px-8 py-4 rounded-xl text-[14px] font-medium hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  Launch Dashboard
                </Link>
                <Link
                  to={user ? "/advisor" : "/auth"}
                  className="bg-surface-container-lowest border border-outline-variant text-on-surface px-8 py-4 rounded-xl text-[14px] font-medium hover:bg-surface-container-low hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                >
                  <Brain size={18} />
                  Try AI Advisor
                </Link>
              </div>
            </div>
            <div className="relative reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
              <div className="bg-surface-container-lowest/80 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-2xl">
                <div className="bg-surface-container-low rounded-xl p-6 space-y-4">
                  {/* Mini dashboard preview */}
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-semibold">Monthly Overview</span>
                    <span className="text-[12px] text-on-surface-variant">Oct 2024</span>
                  </div>
                  <div className="text-[32px] font-bold tabular-nums">₹1,240.50</div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[13px]">
                      <span>Rent</span><span className="tabular-nums font-medium">₹750.00</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[60%] rounded-full" />
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span>Groceries</span><span className="tabular-nums font-medium">₹210.30</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full w-[17%] rounded-full" />
                    </div>
                    <div className="flex justify-between text-[13px] text-anomaly-text font-bold">
                      <span className="flex items-center gap-1">Dining <AlertTriangle size={12} /></span>
                      <span className="tabular-nums">₹185.00</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-anomaly-border h-full w-[15%] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative blurs */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-anomaly-bg/30 rounded-full blur-3xl -z-10 animate-pulse" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary-container/40 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-24 bg-surface-container-lowest" id="features">
          <div className="max-w-[1280px] mx-auto px-10">
            <div className="text-center mb-16 reveal opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold mb-4 text-on-surface">
                Powerful insights at your fingertips.
              </h2>
              <p className="text-[16px] text-on-surface-variant max-w-xl mx-auto">
                Precision engineering meets intuitive design to help you master your finances without the complexity of traditional banking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Anomaly Detection */}
              <div className="md:col-span-7 reveal opacity-0 translate-y-8 transition-all duration-700">
                <div className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-[#EA580C]/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertTriangle size={24} className="text-[#EA580C]" />
                    </div>
                    <h3 className="text-[24px] font-semibold text-on-surface">Smart Anomaly Detection</h3>
                  </div>
                  <p className="text-[16px] text-on-surface-variant mb-8">
                    Our neural network scans every transaction in real-time, instantly identifying suspicious activities or unexpected spikes in your monthly subscriptions.
                  </p>
                  <div className="bg-surface-container-low rounded-xl p-6 h-48 flex items-center justify-center text-on-surface-variant overflow-hidden">
                    <img src="/anomaly_detection.png" alt="Anomaly detection visualization" className="w-full h-full object-cover rounded-lg shadow-md" />
                  </div>
                </div>
              </div>

              {/* AI Advisor */}
              <div className="md:col-span-5 reveal opacity-0 translate-y-8 transition-all duration-700" style={{ transitionDelay: '100ms' }}>
                <div className="bg-[#0f172a] p-10 rounded-2xl h-full flex flex-col justify-between overflow-hidden relative group hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                      <Sparkles size={24} className="text-white" />
                    </div>
                    <h3 className="text-[24px] font-semibold text-white mb-4">Data-Driven AI Advisor</h3>
                    <p className="text-[16px] text-white/80">
                      Receive personalized financial strategies based on your unique spending habits and academic goals.
                    </p>
                  </div>
                  <div className="mt-8 relative z-10">
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-[13px] font-medium text-white italic group-hover:bg-white/20 transition-colors">
                      "Based on your recent cafe visits, you could save ₹45/mo by switching to a prepaid campus meal plan."
                    </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 border-4 border-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                </div>
              </div>

              {/* Simplified Transactions */}
              <div className="md:col-span-12 reveal opacity-0 translate-y-8 transition-all duration-700" style={{ transitionDelay: '200ms' }}>
                <div className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant flex flex-col md:flex-row gap-10 items-center group hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div className="md:w-1/2">
                    <h3 className="text-[24px] font-semibold mb-4 text-on-surface">Simplified Transactions</h3>
                    <p className="text-[16px] text-on-surface-variant mb-6">
                      Log your expenses manually or extract transaction details instantly from your receipts.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-[14px] font-medium text-on-surface">
                        <CheckCircle size={20} className="text-[#EA580C]" /> 256-bit AES encryption
                      </li>
                      <li className="flex items-center gap-3 text-[14px] font-medium text-on-surface">
                        <CheckCircle size={20} className="text-[#EA580C]" /> Automatic categorization
                      </li>
                    </ul>
                  </div>
                  <div className="md:w-1/2 w-full">
                    <div className="bg-surface-container-low rounded-xl p-6 space-y-4">
                      <div className="bg-surface-container-lowest p-4 rounded-lg flex justify-between items-center shadow-sm group-hover:-translate-x-2 transition-transform duration-500">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 shrink-0 bg-surface-container-high rounded-full flex items-center justify-center">
                            <ShoppingBag size={18} className="text-on-surface-variant" />
                          </div>
                          <div className="truncate">
                            <div className="text-[14px] font-medium truncate">Campus Bookstore</div>
                            <div className="text-[12px] text-on-surface-variant truncate">Education • 2h ago</div>
                          </div>
                        </div>
                        <div className="text-[14px] font-medium shrink-0 ml-2">-₹84.20</div>
                      </div>
                      <div className="bg-surface-container-lowest p-4 rounded-lg flex justify-between items-center shadow-sm opacity-60 group-hover:translate-x-2 transition-transform duration-500">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 shrink-0 bg-surface-container-high rounded-full flex items-center justify-center">
                            <Banknote size={18} className="text-on-surface-variant" />
                          </div>
                          <div className="truncate">
                            <div className="text-[14px] font-medium truncate">Workplace Deposit</div>
                            <div className="text-[12px] text-on-surface-variant truncate">Income • Yesterday</div>
                          </div>
                        </div>
                        <div className="text-[14px] font-medium text-[#EA580C] shrink-0 ml-2">+₹1,250.00</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-surface" id="how-it-works">
          <div className="max-w-[1280px] mx-auto px-10">
            <div className="text-center mb-20 reveal opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold mb-4 text-on-surface">How it Works</h2>
              <p className="text-[16px] text-on-surface-variant">Achieve financial clarity in three simple steps.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant -z-10 -translate-y-1/2" />
              {[
                { num: '1', title: 'Record Easily', desc: 'Log your expenses manually or upload receipts for instant transaction extraction.' },
                { num: '2', title: 'Analyze Trends', desc: 'Our AI processes your data to find hidden leaks and optimizing opportunities.' },
                { num: '3', title: 'Master Your Money', desc: "Execute on your AI advisor's recommendations and watch your net worth grow." },
              ].map(({ num, title, desc }, i) => (
                <div key={num} className="reveal opacity-0 translate-y-8 transition-all duration-700 text-center group" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto mb-8 relative border-[8px] border-surface group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <span className="text-[24px] font-semibold">{num}</span>
                  </div>
                  <h4 className="text-[24px] font-semibold mb-4 text-on-surface">{title}</h4>
                  <p className="text-[16px] text-on-surface-variant">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-surface-container-low px-10">
          <div className="max-w-[1280px] mx-auto bg-primary rounded-3xl p-16 text-center reveal opacity-0 translate-y-8 transition-all duration-700 overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-[48px] leading-[1.1] tracking-[-0.02em] font-bold text-on-primary mb-6">Ready for financial clarity?</h2>
              <p className="text-on-primary-container text-[18px] leading-[1.6] mb-10 max-w-2xl mx-auto">
                Join students who are taking control of their financial future with SpendSense.
              </p>
              <Link
                to={user ? "/dashboard" : "/auth"}
                className="inline-block bg-on-primary text-primary px-10 py-4 rounded-xl text-[14px] font-bold hover:opacity-90 transition-all active:scale-95 shadow-md"
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-10 py-12 max-w-[1280px] mx-auto">
          <div className="space-y-6">
            <span className="text-[18px] font-bold text-on-surface">SpendSense</span>
            <p className="text-[16px] text-on-surface-variant max-w-sm">
              Empowering students with AI-driven financial clarity and academic-grade security.
            </p>
            <div className="text-[12px] font-semibold text-on-surface-variant">
              © 2026 SpendSense. Financial clarity for the next generation.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h5 className="text-[14px] font-medium text-on-surface mb-4">Platform</h5>
              <ul className="space-y-3">
                <li><Link to="/dashboard" className="text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">Dashboard</Link></li>
                <li><Link to="/advisor" className="text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">AI Advisor</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[14px] font-medium text-on-surface mb-4">Connect</h5>
              <ul className="space-y-3">
                <li>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X (Twitter)
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
