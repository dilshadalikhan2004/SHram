import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Shield, Crown, Building2, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployerSubscription = () => {
    const [loadingTier, setLoadingTier] = useState(null);

    const handleSubscribe = async (tierName, priceId, price) => {
        if (price === 0) {
            toast.success("Free plan activated automatically.");
            return;
        }

        setLoadingTier(tierName);
        try {
            const token = localStorage.getItem('token');
            // Assuming we are integrating with actual Stripe checkout on the backend
            const response = await axios.post(`${API_URL}/api/subscription/create-checkout`, 
                { tier: tierName, priceId: priceId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.url) {
                // Redirect to stripe checkout
                window.location.href = response.data.url;
            } else if (response.data?.clientSecret) {
                // Return fallback if using custom UI (for later integrations)
                toast.error("Custom stripe UI not configured, expecting checkout URL.");
            }
        } catch (error) {
            console.error("Subscription Error:", error);
            toast.error("Failed to initialize checkout. Verify uplink and API keys.");
        } finally {
            setLoadingTier(null);
        }
    };

    const handleContactSales = () => {
        window.location.href = "mailto:sales@shramsetu.com?subject=Enterprise Inquiry";
    };

    const tiers = [
        {
            name: "Starter",
            tagline: "Small employers trying the platform",
            price: 0,
            priceId: null,
            features: [
                "Post 1 job/month",
                "Access to limited worker profiles (10 views)",
                "Basic search filters",
                "No AI recommendations",
                "No priority listing"
            ],
            icon: Shield,
            color: "text-muted-foreground",
            bg: "bg-white/5",
            border: "border-white/10",
            buttonText: "Current Plan",
            action: () => handleSubscribe("Starter", null, 0)
        },
        {
            name: "Basic",
            tagline: "Small businesses hiring occasionally",
            price: 499,
            priceId: "price_basic_499", // To be defined in Stripe
            features: [
                "Post up to 5 jobs/month",
                "View 50 worker profiles",
                "Basic AI matching",
                "Chat with candidates",
                "Email support"
            ],
            icon: Zap,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            buttonText: "Upgrade to Basic",
            action: () => handleSubscribe("Basic", "price_basic_499", 499)
        },
        {
            name: "Pro",
            tagline: "Growing companies hiring regularly",
            price: 1499,
            priceId: "price_pro_1499", // To be defined in Stripe
            features: [
                "Unlimited job postings",
                "Unlimited profile access",
                "AI-powered smart recommendations",
                "Candidate ranking system",
                "Priority listing (jobs appear higher)",
                "Advanced filters (skills, location, etc.)",
                "Analytics dashboard"
            ],
            icon: Star,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500",
            ribbon: "Most Recommended",
            buttonText: "Upgrade to Pro",
            buttonVariant: "primary",
            action: () => handleSubscribe("Pro", "price_pro_1499", 1499)
        },
        {
            name: "Enterprise",
            tagline: "Large recruiters / agencies",
            price: 4999,
            priceSuffix: "+",
            priceId: "price_enterprise_4999", // Custom quote technically
            features: [
                "Everything in Pro",
                "Dedicated account manager",
                "Bulk hiring tools",
                "API access",
                "Custom AI hiring assistant",
                "Team collaboration dashboard",
                "SLA support"
            ],
            icon: Crown,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30",
            buttonText: "Contact Sales",
            action: handleContactSales
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
                        Terminal <span className="text-orange-500 italic">Upgrades</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Expand your hiring capabilities and unlock premium tools
                    </p>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-end mt-12">
                {tiers.map((tier, idx) => {
                    const Icon = tier.icon;
                    const isPro = tier.name === "Pro";

                    return (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative rounded-[2.5rem] p-8 flex flex-col h-full bg-black/60 shadow-2xl backdrop-blur-xl border ${tier.border} ${isPro ? 'xl:-translate-y-4' : ''} transition-all duration-300 hover:-translate-y-2`}
                        >
                            {/* Pro Ribbon */}
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
                                        ₹{tier.price.toLocaleString()}
                                    </span>
                                    {tier.priceSuffix && (
                                        <span className="text-xl font-bold text-white/70 pb-1">{tier.priceSuffix}</span>
                                    )}
                                    <span className="text-xs uppercase font-bold text-muted-foreground/60 pb-1 ml-1">/mo</span>
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
                                    disabled={loadingTier === tier.name || tier.price === 0}
                                    className={`w-full h-12 rounded-xl text-xs uppercase font-black tracking-widest transition-all ${
                                        isPro 
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/20' 
                                            : tier.price === 0
                                                ? 'bg-white/5 text-muted-foreground/50 border border-white/5'
                                                : tier.color === 'text-emerald-500' 
                                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                    }`}
                                >
                                    {loadingTier === tier.name ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                            Initializing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            {tier.buttonText}
                                            {tier.price === 4999 && <ExternalLink className="w-4 h-4" />}
                                        </span>
                                    )}
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
