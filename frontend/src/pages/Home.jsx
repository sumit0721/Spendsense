import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Sparkles, CheckCircle, ShoppingBag, Banknote, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
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
      <nav className="bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-10 py-4 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-[24px] font-bold text-on-surface cursor-pointer">SpendSense</span>
            <div className="hidden md:flex gap-6 items-center">
              <a href="#features" className="text-on-surface-variant text-[14px] font-medium hover:text-on-surface transition-colors">Features</a>
              <a href="#how-it-works" className="text-on-surface-variant text-[14px] font-medium hover:text-on-surface transition-colors">How it Works</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-sm">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-on-surface-variant text-[14px] font-medium px-4 py-2 hover:bg-surface-container-low rounded-lg transition-all">
                  Login
                </Link>
                <Link to="/auth" className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-black transition-all active:scale-95">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

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
                  <div className="bg-surface-container-low rounded-xl p-6 h-32 flex items-center justify-center text-on-surface-variant">
                    <span className="text-[14px]">📊 Anomaly detection visualization</span>
                  </div>
                </div>
              </div>

              {/* AI Advisor */}
              <div className="md:col-span-5 reveal opacity-0 translate-y-8 transition-all duration-700" style={{ transitionDelay: '100ms' }}>
                <div className="bg-primary-container p-10 rounded-2xl h-full flex flex-col justify-between overflow-hidden relative group hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                      <Sparkles size={24} className="text-on-primary" />
                    </div>
                    <h3 className="text-[24px] font-semibold text-on-primary mb-4">Data-Driven AI Advisor</h3>
                    <p className="text-[16px] text-on-primary-container">
                      Receive personalized financial strategies based on your unique spending habits and academic goals.
                    </p>
                  </div>
                  <div className="mt-8 relative z-10">
                    <div className="bg-surface-container-lowest/5 border border-white/10 rounded-lg p-4 text-[12px] font-semibold text-on-primary/80 italic group-hover:bg-white/10 transition-colors">
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
                      Connect all your bank accounts, credit cards, and digital wallets into a single, unified view.
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
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
                            <ShoppingBag size={18} className="text-on-surface-variant" />
                          </div>
                          <div>
                            <div className="text-[14px] font-medium">Campus Bookstore</div>
                            <div className="text-[12px] text-on-surface-variant">Education • 2h ago</div>
                          </div>
                        </div>
                        <div className="text-[14px] font-medium">-₹84.20</div>
                      </div>
                      <div className="bg-surface-container-lowest p-4 rounded-lg flex justify-between items-center shadow-sm opacity-60 group-hover:translate-x-2 transition-transform duration-500">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
                            <Banknote size={18} className="text-on-surface-variant" />
                          </div>
                          <div>
                            <div className="text-[14px] font-medium">Workplace Deposit</div>
                            <div className="text-[12px] text-on-surface-variant">Income • Yesterday</div>
                          </div>
                        </div>
                        <div className="text-[14px] font-medium text-[#EA580C]">+₹1,250.00</div>
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
                { num: '1', title: 'Connect Securely', desc: 'Link your accounts with read-only access using bank-level security protocols.' },
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
                className="inline-block bg-white text-on-surface px-10 py-4 rounded-xl text-[14px] font-medium hover:bg-surface-container-low transition-all active:scale-95"
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
              © 2024 SpendSense. Financial clarity for the next generation.
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h5 className="text-[14px] font-medium text-on-surface mb-4">Platform</h5>
              <ul className="space-y-3">
                <li><a href="#" className="text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">Dashboard</a></li>
                <li><a href="#" className="text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">AI Advisor</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[14px] font-medium text-on-surface mb-4">Company</h5>
              <ul className="space-y-3">
                <li><a href="#" className="text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">Contact</a></li>
                <li><a href="#" className="text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[14px] font-medium text-on-surface mb-4">Legal</h5>
              <ul className="space-y-3">
                <li><a href="#" className="text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-[12px] text-on-surface-variant hover:text-[#EA580C] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
