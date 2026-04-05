import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, switchRole } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        // Scroll Reveal — fixes all opacity:0 sections
        const revealEls = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.transitionDelay = '0.05s';
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        
        revealEls.forEach(el => observer.observe(el));
        
        return () => observer.disconnect();
    }, []);

    const handleHireEmployer = async () => {
        if (isAuthenticated) {
            if (user.role === 'worker') {
                try {
                    await switchRole('both');
                    navigate('/employer');
                } catch (error) {
                    console.error("Failed to upgrade to employer role:", error);
                    navigate('/employer');
                }
            } else {
                navigate('/employer');
            }
        } else {
            navigate('/auth?role=employer');
        }
    };

    const handleJoinWorker = async () => {
        if (isAuthenticated) {
            if (user.role === 'employer') {
                try {
                    await switchRole('both');
                    navigate('/worker');
                } catch (error) {
                    console.error("Failed to upgrade to worker role:", error);
                    navigate('/worker');
                }
            } else {
                navigate('/worker');
            }
        } else {
            navigate('/auth?role=worker');
        }
    };

    return (
        <div className="landing-page-container font-body selection:bg-[#FF6B2B]/30 min-h-screen">
            {/* 1. Sticky TopAppBar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#0A0C0F]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 flex justify-between items-center px-8 py-4">
                <div className="flex items-center gap-8">
                    <span className="text-xl font-extrabold bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] bg-clip-text text-transparent" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>ShramSetu | श्रमसेतु</span>
                    <div className="hidden lg:flex gap-6 items-center">
                        <a className="text-[#FF6B2B] font-bold border-b-2 border-[#FF6B2B] pb-1 text-xs tracking-tight uppercase" href="#problem">Problem</a>
                        <a className="text-[#1A1714]/60 dark:text-gray-400 font-semibold hover:text-[#FF6B2B] transition-colors text-xs tracking-tight uppercase" href="#features">Features</a>
                        <a className="text-[#1A1714]/60 dark:text-gray-400 font-semibold hover:text-[#FF6B2B] transition-colors text-xs tracking-tight uppercase" href="#ai">AI Engine</a>
                        <a className="text-[#1A1714]/60 dark:text-gray-400 font-semibold hover:text-[#FF6B2B] transition-colors text-xs tracking-tight uppercase" href="#roadmap">Roadmap</a>
                        <a className="text-[#1A1714]/60 dark:text-gray-400 font-semibold hover:text-[#FF6B2B] transition-colors text-xs tracking-tight uppercase" href="#pricing">Pricing</a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 rounded-full">
                        {!isDarkMode ? <span className="material-symbols-outlined">dark_mode</span> : <span className="material-symbols-outlined">light_mode</span>}
                    </button>
                    <button onClick={() => navigate('/auth')} className="hidden md:block px-6 py-2 border border-[#FF6B2B]/20 text-[#FF6B2B] text-xs font-bold rounded hover:bg-[#FF6B2B]/5 transition-colors">
                        Sign In
                    </button>
                </div>
            </nav>

            {/* 2. Hero Section */}
            <header className="relative pt-32 md:pt-48 pb-20 md:pb-32 px-6 md:px-8 overflow-hidden min-h-screen flex flex-col justify-center">
                <div className="absolute inset-0 bg-dot-grid pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] hero-glow pointer-events-none opacity-50 md:opacity-100"></div>
                <div className="max-w-7xl mx-auto relative z-10 w-full">
                    <p className="font-mono text-[#FF6B2B] mb-4 md:mb-6 tracking-[0.1em] md:tracking-[0.2em] uppercase text-[10px] md:text-xs animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        // INDIA’S LABOR INTELLIGENCE PLATFORM
                    </p>
                    <h1 className="text-5xl sm:text-6xl md:text-[96px] lg:text-[110px] leading-[0.95] font-black mb-6 md:mb-8 flex flex-col animate-fade-up" style={{ animationDelay: '0.2s', fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif' }}>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] block mb-1 md:mb-2">श्रमसेतु</span>
                        <span className="text-[#1A1714] dark:text-[#F0EDE8]">ShramSetu</span>
                    </h1>
                    <p className="text-xl sm:text-2xl md:text-4xl font-light text-[#1A1714]/70 dark:text-gray-400 mb-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>The bridge India's workforce has been waiting for.</p>
                    <p className="max-w-2xl text-base md:text-lg text-[#1A1714]/60 dark:text-gray-400 leading-relaxed mb-8 md:mb-10 animate-fade-up line-clamp-3 md:line-clamp-none" style={{ animationDelay: '0.4s' }}>
                        An AI-powered, verified, multilingual platform connecting 450 million blue-collar workers with trusted employers — solving trust, payments, skilling, and financial inclusion.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
                        <button onClick={handleHireEmployer} className="px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] rounded-sm font-mono font-bold text-white uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-[#FF6B2B]/20 text-xs md:text-sm">Hire Workers</button>
                        <button className="px-8 md:px-10 py-4 md:py-5 border border-[#1A1714]/20 dark:border-white/20 rounded-sm font-mono font-bold text-[#1A1714] dark:text-white uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs md:text-sm">Watch Demo</button>
                    </div>
                    {!isAuthenticated && (
                        <div className="animate-fade-up flex items-center gap-2 group cursor-pointer" style={{ animationDelay: '0.6s' }} onClick={() => navigate('/auth')}>
                            <span className="text-xs font-mono text-[#1A1714]/40 dark:text-gray-500 uppercase tracking-widest">Already have an account?</span>
                            <span className="text-xs font-mono text-[#FF6B2B] font-bold uppercase tracking-widest group-hover:underline underline-offset-4">Sign In Here</span>
                            <span className="material-symbols-outlined text-[10px] text-[#FF6B2B] group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                        </div>
                    )}
                    <div className="h-14"></div> {/* Spacer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 animate-fade-up" style={{ animationDelay: '0.6s' }}>
                        <div className="border-l border-[#1A1714]/10 dark:border-white/10 pl-4 md:pl-6">
                            <span className="font-mono text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] bg-clip-text text-transparent block mb-1">450M+</span>
                            <span className="text-[10px] md:text-xs text-[#1A1714]/50 dark:text-gray-500 font-bold uppercase tracking-widest">Artisan Workers</span>
                        </div>
                        <div className="border-l border-[#1A1714]/10 dark:border-white/10 pl-4 md:pl-6">
                            <span className="font-mono text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] bg-clip-text text-transparent block mb-1">₹8.5T</span>
                            <span className="text-[10px] md:text-xs text-[#1A1714]/50 dark:text-gray-500 font-bold uppercase tracking-widest">Market Potential</span>
                        </div>
                        <div className="border-l border-[#1A1714]/10 dark:border-white/10 pl-4 md:pl-6">
                            <span className="font-mono text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] bg-clip-text text-transparent block mb-1">5%</span>
                            <span className="text-[10px] md:text-xs text-[#1A1714]/50 dark:text-gray-500 font-bold uppercase tracking-widest">Currently Trained</span>
                        </div>
                        <div className="border-l border-[#1A1714]/10 dark:border-white/10 pl-4 md:pl-6">
                            <span className="font-mono text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] bg-clip-text text-transparent block mb-1">22+</span>
                            <span className="text-[10px] md:text-xs text-[#1A1714]/50 dark:text-gray-500 font-bold uppercase tracking-widest">Dialects Supported</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. Vision Statement */}
            <section id="problem" className="px-6 md:px-8 pb-20 md:pb-32 reveal">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white dark:bg-[#111318] p-8 md:p-24 relative overflow-hidden group border border-[#1A1714]/5 dark:border-white/5">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#FF6B2B] to-transparent opacity-50"></div>
                        <div className="max-w-4xl mx-auto text-center">
                            <p className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight italic px-2" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>
                                "ShramSetu is not just a job board; it is the <span className="text-[#FF6B2B]">digital scaffolding</span> for the backbone of modern India's growth."
                            </p>
                            <div className="mt-12 inline-flex items-center gap-4">
                                <div className="h-[1px] w-12 bg-[#1A1714]/10 dark:bg-white/10"></div>
                                <span className="font-mono tracking-widest text-xs text-[#38debb] uppercase">Project Identity v2.0</span>
                                <div className="h-[1px] w-12 bg-[#1A1714]/10 dark:bg-white/10"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. The Problem */}
            <section className="px-8 py-32 bg-[#1A1714]/5 dark:bg-[#111318]/30 reveal">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <p className="font-mono text-[#FF6B2B] mb-4 tracking-widest uppercase">
                            // THE FRICTION
                        </p>
                        <h2 className="text-4xl font-extrabold" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Systemic Challenges</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#111318] p-10 border border-[#1A1714]/5 dark:border-white/5">
                            <span className="font-mono text-[#FF6B2B]/30 text-4xl block mb-6">01</span>
                            <h3 className="text-xl font-bold mb-4" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Verification Gap</h3>
                            <p className="text-[#1A1714]/60 dark:text-gray-400 leading-relaxed">No standardized method to verify technical skills of daily-wage workers, leading to massive trust deficits.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-10 border border-[#1A1714]/5 dark:border-white/5">
                            <span className="font-mono text-[#FF6B2B]/30 text-4xl block mb-6">02</span>
                            <h3 className="text-xl font-bold mb-4" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Payment Latency</h3>
                            <p className="text-[#1A1714]/60 dark:text-gray-400 leading-relaxed">Workers face 30-45 day cycles for short projects, causing financial instability and predatory borrowing.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-10 border border-[#1A1714]/5 dark:border-white/5">
                            <span className="font-mono text-[#FF6B2B]/30 text-4xl block mb-6">03</span>
                            <h3 className="text-xl font-bold mb-4" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Language Barriers</h3>
                            <p className="text-[#1A1714]/60 dark:text-gray-400 leading-relaxed">Technology remains inaccessible to 400M+ users due to complex interfaces and lack of local dialect support.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-10 border border-[#1A1714]/5 dark:border-white/5">
                            <span className="font-mono text-[#FF6B2B]/30 text-4xl block mb-6">04</span>
                            <h3 className="text-xl font-bold mb-4" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>No Credit Trail</h3>
                            <p className="text-[#1A1714]/60 dark:text-gray-400 leading-relaxed">A cash-heavy economy leaves no data for workers to secure formal loans, insurance, or social benefits.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-10 border border-[#1A1714]/5 dark:border-white/5">
                            <span className="font-mono text-[#FF6B2B]/30 text-4xl block mb-6">05</span>
                            <h3 className="text-xl font-bold mb-4" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Safety Blindspots</h3>
                            <p className="text-[#1A1714]/60 dark:text-gray-400 leading-relaxed">Informal sectors lack real-time safety auditing and rapid response emergency systems for site accidents.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-10 border border-[#1A1714]/5 dark:border-white/5">
                            <span className="font-mono text-[#FF6B2B]/30 text-4xl block mb-6">06</span>
                            <h3 className="text-xl font-bold mb-4" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Geography of Desperation</h3>
                            <p className="text-[#1A1714]/60 dark:text-gray-400 leading-relaxed">Workers move blindly across states without guaranteed shelter or pre-assigned work contracts.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Core Features */}
            <section id="features" className="px-8 py-32 reveal">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <p className="font-mono text-[#38debb] mb-4 tracking-widest uppercase">// SOLUTION STACK</p>
                        <h2 className="text-4xl font-extrabold" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Next-Gen Capabilities</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-[#111318] p-8 rounded-2xl border border-[#1A1714]/10 dark:border-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF6B2B]/20 relative group transition-all duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6B2B] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            <div className="mb-6 bg-[#FF6B2B]/10 w-16 h-16 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-4xl text-[#FF6B2B]">badge</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Aadhaar Skill ID</h3>
                            <p className="text-sm text-[#1A1714]/60 dark:text-gray-400 leading-relaxed mb-4">Blockchain-linked profile that carries verified certificates for every micro-skill learned.</p>
                            <ul className="text-xs space-y-2 text-[#1A1714]/70 dark:text-gray-300">
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#FF6B2B]">check_circle</span> Verifiable via QR Scan</li>
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#FF6B2B]">check_circle</span> Tamper-proof history</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-8 rounded-2xl border border-[#1A1714]/10 dark:border-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#38debb]/20 relative group transition-all duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#38debb] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            <div className="mb-6 bg-[#38debb]/10 w-16 h-16 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-4xl text-[#38debb]">location_on</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Hyperlocal Matching</h3>
                            <p className="text-sm text-[#1A1714]/60 dark:text-gray-400 leading-relaxed mb-4">AI engine that factors in commute, tools, and local dialect to find the perfect artisan-site fit.</p>
                            <ul className="text-xs space-y-2 text-[#1A1714]/70 dark:text-gray-300">
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#38debb]">check_circle</span> Commute optimization</li>
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#38debb]">check_circle</span> Tool-set matching</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-8 rounded-2xl border border-[#1A1714]/10 dark:border-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#a0caff]/20 relative group transition-all duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#a0caff] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            <div className="mb-6 bg-[#a0caff]/10 w-16 h-16 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-4xl text-[#a0caff]">handshake</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Handshake Attendance</h3>
                            <p className="text-sm text-[#1A1714]/60 dark:text-gray-400 leading-relaxed mb-4">Biometric-verified attendance that triggers automated daily milestone payments via UPI.</p>
                            <ul className="text-xs space-y-2 text-[#1A1714]/70 dark:text-gray-300">
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#a0caff]">check_circle</span> Real-time payroll trigger</li>
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#a0caff]">check_circle</span> Zero-fraud check-ins</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-8 rounded-2xl border border-[#1A1714]/10 dark:border-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#3B82F6]/20 relative group transition-all duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#3B82F6] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            <div className="mb-6 bg-[#3B82F6]/10 w-16 h-16 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-4xl text-[#3B82F6]">account_balance</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Credit-on-Work</h3>
                            <p className="text-sm text-[#1A1714]/60 dark:text-gray-400 leading-relaxed mb-4">Micro-credit lines based on project completion scores rather than traditional collateral.</p>
                            <ul className="text-xs space-y-2 text-[#1A1714]/70 dark:text-gray-300">
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#3B82F6]">check_circle</span> Instant salary advance</li>
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#3B82F6]">check_circle</span> Score-based interest</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-8 rounded-2xl border border-[#1A1714]/10 dark:border-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#F59E0B]/20 relative group transition-all duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#F59E0B] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            <div className="mb-6 bg-[#F59E0B]/10 w-16 h-16 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-4xl text-[#F59E0B]">verified_user</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>On-Demand Insurance</h3>
                            <p className="text-sm text-[#1A1714]/60 dark:text-gray-400 leading-relaxed mb-4">Daily-premium accident coverage that activates automatically when a worker clocks in.</p>
                            <ul className="text-xs space-y-2 text-[#1A1714]/70 dark:text-gray-300">
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#F59E0B]">check_circle</span> Zero paper onboarding</li>
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#F59E0B]">check_circle</span> Instant claim support</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-8 rounded-2xl border border-[#1A1714]/10 dark:border-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#10B981]/20 relative group transition-all duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#10B981] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                            <div className="mb-6 bg-[#10B981]/10 w-16 h-16 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-4xl text-[#10B981]">home</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Bridge Housing</h3>
                            <p className="text-sm text-[#1A1714]/60 dark:text-gray-400 leading-relaxed mb-4">Network of verified shelters for migrant workers with integrated health check-ups.</p>
                            <ul className="text-xs space-y-2 text-[#1A1714]/70 dark:text-gray-300">
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#10B981]">check_circle</span> Safety audited hubs</li>
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-[#10B981]">check_circle</span> Group boarding plans</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. How It Works */}
            <section className="px-8 py-32 bg-white dark:bg-[#111318] reveal">
                <div className="max-w-7xl mx-auto">
                    <p className="font-mono text-[#FF6B2B] text-center mb-4 tracking-widest uppercase">// USER FLOWS</p>
                    <h2 className="text-4xl font-extrabold text-center mb-20" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>The Dual Journey</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Journey 1: Ramesh */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-[#FF6B2B]/20 flex items-center justify-center text-4xl">👷</div>
                                <div>
                                    <h4 className="text-2xl font-bold">Ramesh Kumar</h4>
                                    <span className="font-mono text-xs text-[#FF6B2B] tracking-widest uppercase">Skilled Mason, Bihar</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#FF6B2B]">
                                    <span className="font-mono text-[10px] text-[#FF6B2B] block mb-2 uppercase">Step 01 / Voice Search</span>
                                    <p className="font-semibold text-sm">Sends a WhatsApp voice note in Bhojpuri: "Looking for tiling work near Noida."</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#FF6B2B]">
                                    <span className="font-mono text-[10px] text-[#FF6B2B] block mb-2 uppercase">Step 02 / AI Verification</span>
                                    <p className="font-semibold text-sm">AI audits his previous site videos to verify his finish quality and speed.</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#FF6B2B]">
                                    <span className="font-mono text-[10px] text-[#FF6B2B] block mb-2 uppercase">Step 03 / Bid Matching</span>
                                    <p className="font-semibold text-sm">Receives 3 job matches with guaranteed pay-rates and transport support.</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#FF6B2B]">
                                    <span className="font-mono text-[10px] text-[#FF6B2B] block mb-2 uppercase">Step 04 / Digital Entry</span>
                                    <p className="font-semibold text-sm">Arrives at site; QR check-in activates his daily health insurance cover.</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#FF6B2B]">
                                    <span className="font-mono text-[10px] text-[#FF6B2B] block mb-2 uppercase">Step 05 / Payout</span>
                                    <p className="font-semibold text-sm">Finishes milestone; UPI payment hits his bank account instantly.</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#FF6B2B]">
                                    <span className="font-mono text-[10px] text-[#FF6B2B] block mb-2 uppercase">Step 06 / Rating</span>
                                    <p className="font-semibold text-sm">Earns a 'Gold Tier' rating, unlocking higher pay for his next project.</p>
                                </div>
                            </div>
                        </div>
                        {/* Journey 2: Priya */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-[#38debb]/20 flex items-center justify-center text-4xl">👩‍💼</div>
                                <div>
                                    <h4 className="text-2xl font-bold">Priya Sharma</h4>
                                    <span className="font-mono text-xs text-[#38debb] tracking-widest uppercase">Site Lead, L&T Projects</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#38debb]">
                                    <span className="font-mono text-[10px] text-[#38debb] block mb-2 uppercase">Step 01 / Smart Posting</span>
                                    <p className="font-semibold text-sm">Tells AI Assistant: "Need 20 verified tile-masons for 2 weeks at Sector 62."</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#38debb]">
                                    <span className="font-mono text-[10px] text-[#38debb] block mb-2 uppercase">Step 02 / Batch Filter</span>
                                    <p className="font-semibold text-sm">AI presents a pre-filtered list of workers within 5km radius with 4+ ratings.</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#38debb]">
                                    <span className="font-mono text-[10px] text-[#38debb] block mb-2 uppercase">Step 03 / Auto-Contract</span>
                                    <p className="font-semibold text-sm">Platform auto-generates compliance documents and labor contracts.</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#38debb]">
                                    <span className="font-mono text-[10px] text-[#38debb] block mb-2 uppercase">Step 04 / Live Monitoring</span>
                                    <p className="font-semibold text-sm">Views a dashboard of real-time artisan attendance and progress metrics.</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#38debb]">
                                    <span className="font-mono text-[10px] text-[#38debb] block mb-2 uppercase">Step 05 / Escrow Release</span>
                                    <p className="font-semibold text-sm">One-click approval releases escrow funds to the worker's digital wallets.</p>
                                </div>
                                <div className="bg-[#1A1714]/5 dark:bg-white/5 p-6 border-l-4 border-[#38debb]">
                                    <span className="font-mono text-[10px] text-[#38debb] block mb-2 uppercase">Step 06 / Analytics</span>
                                    <p className="font-semibold text-sm">Receives productivity reports to optimize her next hiring cycle.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. AI Engine */}
            <section id="ai" className="px-8 py-32 bg-[#1A1714]/5 dark:bg-[#0A0C0F] reveal">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <p className="font-mono text-[#FF6B2B] mb-4 tracking-widest uppercase">// CORE TECHNOLOGY</p>
                            <h2 className="text-4xl font-extrabold" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Powered by Gemini 2.0</h2>
                        </div>
                        <div className="px-6 py-2 bg-black/5 dark:bg-white/5 border border-[#1A1714]/10 dark:border-white/10 rounded-full font-mono text-[10px] tracking-widest">
                            SYSTEM_STATUS: <span className="text-[#38debb]">OPTIMIZED</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#111318] p-6 border border-[#1A1714]/5 dark:border-white/5 group hover:border-[#FF6B2B]/50 transition-colors">
                            <span className="font-mono text-[10px] text-[#a0caff] px-2 py-0.5 bg-[#a0caff]/10 rounded block w-fit mb-4">GEMINI_MULTIMODAL</span>
                            <p className="font-bold mb-2">Visual Skill Audit</p>
                            <p className="text-xs text-[#1A1714]/50 dark:text-gray-500">Analyzing tool handling from worker videos with 94% accuracy.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-6 border border-[#1A1714]/5 dark:border-white/5 group hover:border-[#FF6B2B]/50 transition-colors">
                            <span className="font-mono text-[10px] text-[#FF6B2B] px-2 py-0.5 bg-[#FF6B2B]/10 rounded block w-fit mb-4">NEW</span>
                            <p className="font-bold mb-2">Dialect Routing</p>
                            <p className="text-xs text-[#1A1714]/50 dark:text-gray-500">Real-time semantic translation of 22+ local Indian dialects.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-6 border border-[#1A1714]/5 dark:border-white/5 group hover:border-[#FF6B2B]/50 transition-colors">
                            <span className="font-mono text-[10px] text-[#38debb] px-2 py-0.5 bg-[#38debb]/10 rounded block w-fit mb-4">STABLE</span>
                            <p className="font-bold mb-2">Demand Forecaster</p>
                            <p className="text-xs text-[#1A1714]/50 dark:text-gray-500">Predicting urban labor shortages 2 weeks ahead of time.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-6 border border-[#1A1714]/5 dark:border-white/5 group hover:border-[#FF6B2B]/50 transition-colors">
                            <span className="font-mono text-[10px] text-[#1A1714]/50 dark:text-white px-2 py-0.5 bg-[#1A1714]/10 dark:bg-white/10 rounded block w-fit mb-4">CORE</span>
                            <p className="font-bold mb-2">Fraud Prevention</p>
                            <p className="text-xs text-[#1A1714]/50 dark:text-gray-500">Analyzing biometric telemetry to prevent proxy attendance.</p>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-6 border border-[#1A1714]/5 dark:border-white/5 md:col-span-2">
                            <p className="font-bold mb-2">Agentic Matching Engine</p>
                            <p className="text-xs text-[#1A1714]/50 dark:text-gray-400 mb-4">Goes beyond keywords to match worker behavior history with job site cultural demands.</p>
                            <div className="h-2 w-full bg-[#1A1714]/5 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#FF6B2B] w-[88%]"></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#111318] p-6 border border-[#1A1714]/5 dark:border-white/5 md:col-span-2">
                            <p className="font-bold mb-2">Insurance Risk Matrix</p>
                            <p className="text-xs text-[#1A1714]/50 dark:text-gray-400 mb-4">Dynamic calculation of micro-premiums based on real-time site hazard data.</p>
                            <div className="h-2 w-full bg-[#1A1714]/5 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#38debb] w-[72%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. Expansion Layer */}
            <section id="roadmap" className="px-8 py-32 reveal">
                <div className="max-w-7xl mx-auto">
                    <p className="font-mono text-[#FF6B2B] mb-4 tracking-widest uppercase">// PHASE 2 ROADMAP</p>
                    <h2 className="text-4xl font-extrabold mb-16" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Geographic & Sector Scale</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-8 bg-white dark:bg-[#111318] relative group overflow-hidden border border-[#1A1714]/5 dark:border-white/5">
                            <span className="absolute -right-4 -bottom-4 text-9xl opacity-5 dark:opacity-5">🚜</span>
                            <h4 className="font-bold text-xl mb-6">Agri-Labor Hubs</h4>
                            <ul className="text-xs space-y-4 text-[#1A1714]/60 dark:text-gray-400 font-medium">
                                <li className="flex items-start gap-2">→ Crop-specific hiring cycles</li>
                                <li className="flex items-start gap-2">→ Harvester rental logistics</li>
                                <li className="flex items-start gap-2">→ Agri-equipment micro-leases</li>
                                <li className="flex items-start gap-2">→ Farm-stay verified lodging</li>
                                <li className="flex items-start gap-2">→ Pests/Weather alerts</li>
                            </ul>
                        </div>
                        <div className="p-8 bg-white dark:bg-[#111318] relative group overflow-hidden border border-[#1A1714]/5 dark:border-white/5">
                            <span className="absolute -right-4 -bottom-4 text-9xl opacity-5">🏗️</span>
                            <h4 className="font-bold text-xl mb-6">Smart Cities</h4>
                            <ul className="text-xs space-y-4 text-[#1A1714]/60 dark:text-gray-400 font-medium">
                                <li className="flex items-start gap-2">→ Integrated site supply chains</li>
                                <li className="flex items-start gap-2">→ Public infra maintenance</li>
                                <li className="flex items-start gap-2">→ Smart PPE inventory tracking</li>
                                <li className="flex items-start gap-2">→ Urban greening workforce</li>
                                <li className="flex items-start gap-2">→ IoT-linked hazard maps</li>
                            </ul>
                        </div>
                        <div className="p-8 bg-white dark:bg-[#111318] relative group overflow-hidden border border-[#1A1714]/5 dark:border-white/5">
                            <span className="absolute -right-4 -bottom-4 text-9xl opacity-5">🚢</span>
                            <h4 className="font-bold text-xl mb-6">Logistics Nets</h4>
                            <ul className="text-xs space-y-4 text-[#1A1714]/60 dark:text-gray-400 font-medium">
                                <li className="flex items-start gap-2">→ Real-time shift loading</li>
                                <li className="flex items-start gap-2">→ Port-side heavy ops teams</li>
                                <li className="flex items-start gap-2">→ Multi-modal freight labor</li>
                                <li className="flex items-start gap-2">→ Rapid response delivery</li>
                                <li className="flex items-start gap-2">→ Warehouse safety certification</li>
                            </ul>
                        </div>
                        <div className="p-8 bg-white dark:bg-[#111318] relative group overflow-hidden border border-[#1A1714]/5 dark:border-white/5">
                            <span className="absolute -right-4 -bottom-4 text-9xl opacity-5">⚙️</span>
                            <h4 className="font-bold text-xl mb-6">MSME Clusters</h4>
                            <ul className="text-xs space-y-4 text-[#1A1714]/60 dark:text-gray-400 font-medium">
                                <li className="flex items-start gap-2">→ Precision tool training</li>
                                <li className="flex items-start gap-2">→ Factory safety audit scoring</li>
                                <li className="flex items-start gap-2">→ Cluster-based bulk hiring</li>
                                <li className="flex items-start gap-2">→ Industrial apprentice sync</li>
                                <li className="flex items-start gap-2">→ Quality control certified</li>
                            </ul>
                        </div>
                        <div className="p-8 bg-white dark:bg-[#111318] relative group overflow-hidden border border-[#1A1714]/5 dark:border-white/5">
                            <span className="absolute -right-4 -bottom-4 text-9xl opacity-5">🌏</span>
                            <h4 className="font-bold text-xl mb-6">Global Connect</h4>
                            <ul className="text-xs space-y-4 text-[#1A1714]/60 dark:text-gray-400 font-medium">
                                <li className="flex items-start gap-2">→ Visa compliance AI support</li>
                                <li className="flex items-start gap-2">→ Language prep & accents</li>
                                <li className="flex items-start gap-2">→ Global payroll engine</li>
                                <li className="flex items-start gap-2">→ Expat artisan insurance</li>
                                <li className="flex items-start gap-2">→ Skill standards mapping</li>
                            </ul>
                        </div>
                        <div className="p-8 bg-white dark:bg-[#111318] relative group overflow-hidden border border-[#1A1714]/5 dark:border-white/5">
                            <span className="absolute -right-4 -bottom-4 text-9xl opacity-5">🎓</span>
                            <h4 className="font-bold text-xl mb-6">Shram Academy</h4>
                            <ul className="text-xs space-y-4 text-[#1A1714]/60 dark:text-gray-400 font-medium">
                                <li className="flex items-start gap-2">→ AR-based tool simulations</li>
                                <li className="flex items-start gap-2">→ Expert mentorship matching</li>
                                <li className="flex items-start gap-2">→ Local dialect video modules</li>
                                <li className="flex items-start gap-2">→ Skill swap marketplaces</li>
                                <li className="flex items-start gap-2">→ Micro-credential badges</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 10. Pricing */}
            <section id="pricing" className="px-8 py-32 bg-white dark:bg-[#0A0C0F] reveal">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <p className="font-mono text-[#38debb] mb-4 tracking-widest uppercase">// PAY‑PER‑HIRE PRICING</p>
                        <h2 className="text-4xl font-extrabold" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Fair Pricing, Only When You Hire</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Worker Plan */}
                        <div className="bg-[#1A1714]/5 dark:bg-[#111318] p-10 flex flex-col h-full border border-[#1A1714]/5 dark:border-white/5">
                            <h3 className="text-xl font-bold mb-2">Worker</h3>
                            <p className="text-[#1A1714]/50 dark:text-gray-400 text-sm mb-8">Pay only after you get hired.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-bold">₹49</span>
                                <span className="text-sm text-[#1A1714]/50">/ hire</span>
                                <p className="text-xs text-[#1A1714]/50 dark:text-gray-500 mt-2">No monthly subscription. Only on successful hire.</p>
                            </div>
                            <ul className="space-y-4 mb-12 flex-grow">
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#38debb] text-sm">check_circle</span> Digital Verified Profile</li>
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#38debb] text-sm">check_circle</span> Direct UPI Payments</li>
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#38debb] text-sm">check_circle</span> Pay Only When Hired</li>
                            </ul>
                            <button onClick={() => navigate('/auth?role=worker')} className="w-full py-4 border border-[#1A1714]/20 dark:border-white/20 font-mono uppercase text-xs tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                Start Journey
                            </button>
                        </div>
                        {/* Employer Plan */}
                        <div className="bg-[#1A1714]/5 dark:bg-[#111318] p-10 flex flex-col h-full border-2 border-[#FF6B2B] relative shadow-2xl">
                            <div className="absolute -top-4 right-8 bg-[#FF6B2B] text-white px-4 py-1 font-mono text-[10px] tracking-widest">SYSTEM_RECOMMENDED</div>
                            <h3 className="text-xl font-bold mb-2">Employer</h3>
                            <p className="text-[#1A1714]/50 dark:text-gray-400 text-sm mb-8">Post jobs free. Pay only when you hire.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-bold">₹199</span>
                                <span className="text-sm text-[#1A1714]/50">/ hire</span>
                                <p className="text-xs text-[#1A1714]/50 dark:text-gray-500 mt-2">No subscription. Only on successful hire.</p>
                            </div>
                            <ul className="space-y-4 mb-12 flex-grow">
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#FF6B2B] text-sm">check_circle</span> Unlimited Job Posting</li>
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#FF6B2B] text-sm">check_circle</span> Verified Worker Access</li>
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#FF6B2B] text-sm">check_circle</span> AI Matching & Shortlist Tools</li>
                            </ul>
                            <button onClick={() => navigate('/auth?role=employer')} className="w-full py-4 bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] text-white font-mono uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
                                Subscribe Now
                            </button>
                        </div>
                        {/* Enterprise Plan */}
                        <div className="bg-[#1A1714]/5 dark:bg-[#111318] p-10 flex flex-col h-full border border-[#1A1714]/5 dark:border-white/5">
                            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                            <p className="text-[#1A1714]/50 dark:text-gray-400 text-sm mb-8">For large contractors and high‑volume hiring.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-bold">Custom</span>
                            </div>
                            <ul className="space-y-4 mb-12 flex-grow">
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#38debb] text-sm">check_circle</span> Bulk Hiring Workflows</li>
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#38debb] text-sm">check_circle</span> Dedicated Success Manager</li>
                                <li className="flex items-center gap-3 text-sm"><span className="material-symbols-outlined text-[#38debb] text-sm">check_circle</span> Full API Integration</li>
                            </ul>
                            <button className="w-full py-4 border border-[#1A1714]/20 dark:border-white/20 font-mono uppercase text-xs tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                Contact Sales
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 12. Final CTA */}
            <section className="px-8 pb-32 reveal">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white dark:bg-[#111318] p-12 md:p-24 rounded-2xl relative overflow-hidden text-center border border-[#1A1714]/5 dark:border-white/5">
                        <div className="absolute inset-0 bg-dot-grid opacity-10"></div>
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#FF6B2B]/10 blur-[100px]"></div>
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#38debb]/5 blur-[100px]"></div>
                        <div className="relative z-10 max-w-4xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-extrabold mb-12 leading-tight" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>
                                Every artisan deserves to be <span className="text-[#FF6B2B]">seen</span>, <span className="text-[#FF6B2B]">trusted</span>, paid fairly, and <span className="text-[#FF6B2B]">protected</span>.
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={handleHireEmployer} className="px-10 py-5 bg-[#FF6B2B] rounded-sm font-mono font-bold text-white uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[#FF6B2B]/20">HIRE AS EMPLOYER</button>
                                <button onClick={handleJoinWorker} className="px-10 py-5 bg-black/5 dark:bg-white/5 border border-[#1A1714]/10 dark:border-white/10 rounded-sm font-mono font-bold text-[#1A1714] dark:text-white uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-colors">JOIN AS A WORKER</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 13. Footer */}
            <footer className="bg-[#1A1714]/5 dark:bg-[#0A0C0F] w-full py-16 px-8 border-t border-[#1A1714]/5 dark:border-white/5 reveal">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12 max-w-7xl mx-auto">
                    <div className="md:col-span-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] bg-clip-text text-transparent block mb-6" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>ShramSetu | श्रमसेतु</span>
                        <p className="text-sm leading-relaxed text-[#1A1714]/50 dark:text-gray-500 max-w-xs">
                            Building the digital infrastructure for India's 450 million unorganized workers. Verified skills, guaranteed payments, and safety.
                        </p>
                    </div>
                    <div>
                        <h5 className="text-[#1A1714] dark:text-white font-bold mb-6 text-sm uppercase tracking-widest" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Platform</h5>
                        <ul className="space-y-4">
                            <li><a className="text-[#1A1714]/50 dark:text-gray-500 hover:text-[#FF6B2B] transition-colors text-xs font-semibold" href="#features">Worker Profiles</a></li>
                            <li><a className="text-[#1A1714]/50 dark:text-gray-500 hover:text-[#FF6B2B] transition-colors text-xs font-semibold" href="#features">Employer Dashboard</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-[#1A1714] dark:text-white font-bold mb-6 text-sm uppercase tracking-widest" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Sectors</h5>
                        <ul className="space-y-4">
                            <li><a className="text-[#1A1714]/50 dark:text-gray-500 hover:text-[#FF6B2B] transition-colors text-xs font-semibold" href="#roadmap">Real Estate</a></li>
                            <li><a className="text-[#1A1714]/50 dark:text-gray-500 hover:text-[#FF6B2B] transition-colors text-xs font-semibold" href="#roadmap">Agri-Hubs</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-[#1A1714] dark:text-white font-bold mb-6 text-sm uppercase tracking-widest" style={{fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif'}}>Legal</h5>
                        <ul className="space-y-4">
                            <li><p className="text-[#1A1714]/50 dark:text-gray-500 text-xs font-semibold cursor-pointer">Privacy Policy</p></li>
                            <li><p className="text-[#1A1714]/50 dark:text-gray-500 text-xs font-semibold cursor-pointer">Terms of Use</p></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-[#1A1714]/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs text-[#1A1714]/40 dark:text-gray-500 font-mono">© 2025 ShramSetu Technologies. India Built.</p>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] text-[#38debb] font-mono animate-pulse">● LIVE_SERVER_CONNECT</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
