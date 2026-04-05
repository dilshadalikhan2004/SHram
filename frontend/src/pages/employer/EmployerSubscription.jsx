import React from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Building2, Crown, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

const EmployerSubscription = () => {
    const navigate = useNavigate();

    const handleContactSales = () => {
        window.location.href = "mailto:sales@shramsetu.com?subject=Enterprise Inquiry";
    };

    const tiers = [
        {
            name: "Worker",
            tagline: "Pay only after you get hired",
            price: 49,
            priceUnit: "/hire",
            features: [
                "Digital Verified Profile",
                "Direct UPI Payments",
                "Pay only when hired"
            ],
            icon: Shield,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30",
            buttonText: "Join as Worker",
            action: () => navigate('/auth?role=worker')
        },
        {
            name: "Employer",
            tagline: "Post jobs free. Pay only when you hire",
            price: 199,
            priceUnit: "/hire",
            features: [
                "Unlimited job posting",
                "Verified worker access",
                "AI matching & shortlist tools"
            ],
            icon: Building2,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/40",
            ribbon: "Recommended",
            buttonText: "Post a Job",
            action: () => navigate('/auth?role=employer')
        },
        {
            name: "Enterprise",
            tagline: "High-volume hiring & custom workflows",
            priceLabel: "Custom",
            priceUnit: "",
            features: [
                "Bulk hiring workflows",
                "Dedicated success manager",
                "Full API integration"
            ],
            icon: Crown,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30",
            buttonText: "Contact Sales",
            action: handleContactSales,
            showExternal: true
        }
    ];

    return (
        <div className="space-y-12 pb-20 employer-theme">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none"
                    >
                        Fair <span className="text-orange-500 italic">Pricing</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Pay per hire — no monthly subscriptions
                    </p>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-end mt-12">
                {tiers.map((tier, idx) => {
                    const Icon = tier.icon;
                    const isRecommended = tier.ribbon;

                    return (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative rounded-[2.5rem] p-8 flex flex-col h-full bg-black/60 shadow-2xl backdrop-blur-xl border ${tier.border} ${isRecommended ? 'xl:-translate-y-4' : ''} transition-all duration-300 hover:-translate-y-2`}
                        >
                            {/* Ribbon */}
                            {tier.ribbon && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-orange-500 text-white text-[10px] uppercase font-black tracking-widest rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)] whitespace-nowrap">
                                    {tier.ribbon}
                                </div>
                            )}

                            {/* Glow Effect */}
                            <div className={`absolute inset-0 ${tier.bg} opacity-20 pointer-events-none rounded-[2.5rem]`} />

                            <div className="flex-1 space-y-6 relative z-10 block">
                                <div className="space-y-2">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tier.bg} border ${tier.border}`}> 
                                        <Icon className={`w-6 h-6 ${tier.color}`} />
                                    </div>
                                    <h3 className="text-2xl font-black font-['Space_Grotesk'] text-white tracking-tight uppercase pt-2">
                                        {tier.name}
                                    </h3>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 h-8">
                                        {tier.tagline}
                                    </p>
                                </div>

                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-black font-['Space_Grotesk'] text-white">
                                        {tier.priceLabel ? tier.priceLabel : `₹${tier.price.toLocaleString()}`}
                                    </span>
                                    {tier.priceUnit && (
                                        <span className="text-xs uppercase font-bold text-muted-foreground/60 pb-1 ml-1">{tier.priceUnit}</span>
                                    )}
                                </div>

                                <div className="w-full h-px bg-white/10" />

                                <ul className="space-y-4 pb-8">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex flex-col sm:flex-row items-start gap-3 text-sm font-medium text-muted-foreground/80">
                                            <div className="mt-0.5 rounded-full bg-white/5 p-1 border border-white/10 shrink-0">
                                                <Check className={`w-3 h-3 ${tier.color}`} />
                                            </div>
                                            <span className="leading-snug">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Button Box */}
                            <div className="pt-6 mt-auto border-t border-white/5 relative z-10 block">
                                <Button
                                    onClick={tier.action}
                                    className={`w-full h-12 rounded-xl text-xs uppercase font-black tracking-widest transition-all ${
                                        isRecommended 
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/20' 
                                            : tier.priceLabel
                                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {tier.buttonText}
                                        {tier.showExternal && <ExternalLink className="w-4 h-4" />}
                                    </span>
                                </Button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default EmployerSubscription;