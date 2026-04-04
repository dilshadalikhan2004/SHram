import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../context/TranslationContext';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import ChatPanel from '../../components/ChatPanel';
import {
  Mic, HelpCircle, MessageSquare, AlertTriangle, ChevronRight, ChevronDown, Search
} from 'lucide-react';

const FAQ_ITEMS = [
  { q: 'How do I get paid?', qHi: 'मुझे भुगतान कैसे मिलेगा?', a: 'After completing a job, the employer releases payment from escrow. Funds are sent to your UPI within 24 hours.' },
  { q: 'How does the handshake work?', qHi: 'हैंडशेक कैसे काम करता है?', a: 'When you arrive at the job site, the employer gives you a 4-digit code. Enter it in the app to confirm your attendance.' },
  { q: 'What is my reliability score?', qHi: 'मेरा विश्वसनीयता स्कोर क्या है?', a: 'Your reliability score is calculated based on job completion rate, punctuality, employer ratings, and profile completeness.' },
  { q: 'How do I withdraw earnings early?', qHi: 'मैं जल्दी कमाई कैसे निकालूं?', a: 'Go to Wallet → Earned Wage Access. You can withdraw up to 60% of your earned wages before the scheduled payday.' },
  { q: 'How do I verify my skills?', qHi: 'मैं अपने कौशल कैसे सत्यापित करूं?', a: 'Go to Profile → Skills Verification → Take the test for your trade. Verified skills get a badge and improve your match score.' },
  { q: 'Can I raise a dispute?', qHi: 'क्या मैं विवाद उठा सकता हूं?', a: 'Yes. Tap "Raise a Dispute" below, describe the issue, and our team will review within 48 hours.' },
  { q: 'What is a squad?', qHi: 'स्क्वॉड क्या है?', a: 'A squad is a team of workers who bid on jobs together. Create one from the Squads page and invite trusted workers.' },
];

const WorkerSupport = () => {
  const { t, language } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [voiceResult, setVoiceResult] = useState('');

  const handleVoiceResult = (text) => {
    setVoiceResult(text);
    // Try to find matching FAQ
    const match = FAQ_ITEMS.findIndex(f => {
      const question = (language === 'hi' ? f.qHi : f.q).toLowerCase();
      return text.toLowerCase().split(' ').some(word => question.includes(word));
    });
    if (match >= 0) setOpenFaq(match);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-['Space_Grotesk']">Help Center</p>
        <h2 className="text-3xl font-black font-['Space_Grotesk'] text-foreground tracking-tighter">Support</h2>
      </div>

      {/* Voice Help */}
      <div className="p-10 glass-card rounded-[2.5rem] border-primary/20 relative overflow-hidden group text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-2xl font-['Space_Grotesk'] text-foreground tracking-tight">Voice Help</h3>
            <p className="text-sm text-muted-foreground font-['Manrope'] mt-2">Speak your question in any language</p>
          </div>
          <div className="flex justify-center">
            <VoiceSearchButton
              onResult={handleVoiceResult}
              className="w-16 h-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-110 transition-transform flex items-center justify-center"
            />
          </div>
          {voiceResult && (
            <div className="mt-4 p-4 rounded-2xl bg-muted/20 border border-white/5 text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-['Space_Grotesk'] mb-1">You said:</p>
              <p className="text-sm text-foreground font-['Space_Grotesk'] font-bold">"{voiceResult}"</p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-['Space_Grotesk'] mb-4">
          <HelpCircle className="w-4 h-4 inline mr-2" /> Frequently Asked Questions
        </h3>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className={`rounded-2xl border transition-all overflow-hidden ${openFaq === i ? 'border-primary/20 bg-primary/5' : 'border-white/5 hover:border-white/10'}`}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-5 flex items-center justify-between text-left">
              <span className="font-black text-sm text-foreground font-['Space_Grotesk'] tracking-tight pr-4">
                {language === 'hi' ? item.qHi : item.q}
              </span>
              {openFaq === i ? <ChevronDown className="w-5 h-5 text-primary shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground/40 shrink-0" />}
            </button>
            {openFaq === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-5">
                <p className="text-sm text-muted-foreground font-['Manrope'] leading-relaxed">{item.a}</p>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Raise Dispute */}
      <div className="p-8 glass-card rounded-[2.5rem] border-white/5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-black text-xl font-['Space_Grotesk'] text-foreground tracking-tight">Raise a Dispute</h3>
            <p className="text-xs text-muted-foreground font-['Space_Grotesk'] font-medium">Report an issue with a job or employer</p>
          </div>
        </div>

        {showDispute ? (
          <div className="space-y-4">
            <textarea
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
              rows={4}
              className="w-full p-4 rounded-2xl bg-muted/20 border border-white/10 text-foreground font-['Space_Grotesk'] text-sm focus:outline-none focus:border-primary/30 resize-none placeholder:text-muted-foreground/40"
              placeholder="Describe your issue in detail..."
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDispute(false); setDisputeText(''); }} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-muted/40 border border-white/10 text-foreground font-['Space_Grotesk']">Cancel</button>
              <button className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white font-['Space_Grotesk'] shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">Submit Dispute</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDispute(true)} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all font-['Space_Grotesk']">
            Open Dispute Form
          </button>
        )}
      </div>

      {/* Chat with Support */}
      <button onClick={() => setShowChat(true)} className="w-full p-6 glass-card rounded-[2rem] border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-black text-lg font-['Space_Grotesk'] text-foreground tracking-tight">Chat with Support</h3>
            <p className="text-xs text-muted-foreground font-['Space_Grotesk'] font-medium">Talk to our team directly</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </button>

      {showChat && <ChatPanel onClose={() => setShowChat(false)} initialUserId="support" />}
    </motion.div>
  );
};

export default WorkerSupport;
