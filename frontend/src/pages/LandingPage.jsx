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
                    <button onClick={() => navigate('/auth')} className="hidden md:block px-6 py-2 border border-[#FF6B2B]/20 text-[#FF6B2B] text-xs font-bold rounded hover:bg-[#FF6B2B]/5 transition-all">
                        Sign In
                    </button>
                </div>
            </nav>

            {/* 2. Hero Section */}
            <header className="relative pt-32 md:pt-48 pb-20 md:pb-32 px-6 md:px-8 overflow-hidden min-h-screen flex flex-col justify-center">
                <div className="absolute inset-0 bg-dot-grid pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] hero-glow pointer-events-none opacity-50 md:opacity-100"></div>
                <div className="max-w-7xl mx-auto relative z-10 w-full">
                    <p className="font-mono text-[#FF6B2B] mb-4 md:mb-6 tracking-[0.1em] md:tracking-[0.2em] uppercase text-[10px] md:text-xs animate-fade-up" style={{ animationDelay: '0.1s' }}>// INDIA'S LABOR INTELLIGENCE PLATFORM</p>
                    <h1 className="text-5xl sm:text-6xl md:text-[96px] lg:text-[110px] leading-[0.95] font-black mb-6 md:mb-8 flex flex-col animate-fade-up" style={{ animationDelay: '0.2s', fontFamily: '"Sora", "Noto Sans Devanagari", sans-serif' }}>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] block mb-1 md:mb-2">श्रमसेतु</span>
                        <span className="text-[#1A1714] dark:text-[#F0EDE8]">ShramSetu</span>
                    </h1>
                    <p className="text-xl sm:text-2xl md:text-4xl font-light text-[#1A1714]/70 dark:text-gray-400 mb-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>The bridge India's workforce has been waiting for.</p>
                    <p className="max-w-2xl text-base md:text-lg text-[#1A1714]/60 dark:text-gray-400 leading-relaxed mb-8 md:mb-10 animate-fade-up line-clamp-3 md:line-clamp-none" style={{ animationDelay: '0.4s' }}>
                        An AI-powered, verified, multilingual platform connecting 450 million blue-collar workers with trusted employers — solving trust, payments, skilling, and financial inclusion.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
                        <button onClick={handleHireEmployer} className="px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-[#FF6B2B] to-[#FFB347] rounded-sm font-mono font-bold text-white uppercase tracking-widest hover:scale-[1.02] transition-transform">Hire Workers</button>
                        <button className="px-8 md:px-10 py-4 md:py-5 border border-[#1A1714]/20 dark:border-white/20 rounded-sm font-mono font-bold text-[#1A1714] dark:text-white uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all">Watch Demo</button>
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
        </div>
    );
};

export default LandingPage;
