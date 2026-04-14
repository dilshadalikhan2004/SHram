import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, Award, CheckCircle2, XCircle, ChevronRight, Terminal, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const SkillsAssessmentPage = () => {
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/skills/tests`);
      setTests(response.data);
    } catch (error) {
      toast.error('Failed to load assessment tests');
    } finally {
      setLoading(false);
    }
  };

  const startTest = (test) => {
    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setResult(null);
  };

  const handleAnswerSelect = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < activeTest.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(i => i - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.length < activeTest.questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/skills/submit`, {
        test_id: activeTest.id,
        answers: answers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(response.data);
      toast.success(response.data.passed ? 'Assessment passed!' : 'Assessment failed');
    } catch (error) {
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-muted/30 border border-white/5 flex items-center justify-center glass-card">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-['Space_Grotesk'] font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Assessment Modules...</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background py-16 px-4 selection:bg-primary relative overflow-hidden font-['Manrope']">
         {/* Decorative Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-2xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="text-center"
          >
            <div className="glass-card rounded-[3rem] p-1 shadow-2xl mb-12">
              <div className="bg-muted/10 rounded-[2.8rem] py-16 px-8 border border-white/5">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12, delay: 0.2 }}
                  className={`mx-auto w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl ${result.passed ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}
                >
                  {result.passed ? <Award className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
                </motion.div>
                
                <div className="space-y-4">
                  <h1 className="text-5xl font-black font-['Space_Grotesk'] tracking-tighter uppercase">{result.passed ? 'Verification Success' : 'Integrity Check Failed'}</h1>
                  <p className="text-xl text-muted-foreground font-['Space_Grotesk'] font-medium">
                    Diagnostic Score: <span className="text-foreground font-bold">{result.score}%</span> — {activeTest.title}
                  </p>
                </div>

                <div className="mt-12 p-8 rounded-[2rem] bg-muted/20 border border-white/5 glass-card relative overflow-hidden">
                  {result.passed && (
                    <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute bottom-0 left-0 h-1 bg-primary blur-[2px]" />
                  )}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verification Class</span>
                    <Badge className={`px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] ${result.passed ? 'bg-primary/20 text-primary border-primary/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                      {result.passed ? 'VERIFIED EXPERT' : 'RE-EVALUATION REQUIRED'}
                    </Badge>
                  </div>
                  {result.passed ? (
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium flex items-start gap-4 text-left">
                      <CheckCircle2 className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                      Digital badge successfully injected into your profile matrix. Employers now see your verified {activeTest.category} credentials.
                    </p>
                  ) : (
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium flex items-start gap-4 text-left">
                      <XCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                      Minimum threshold not met. Review the core modules and retry the assessment to gain industrial verification.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="ghost" className="h-16 px-10 rounded-2xl font-bold font-['Space_Grotesk'] uppercase tracking-widest border-white/5 hover:bg-muted/50 transition-all" onClick={() => { setActiveTest(null); setResult(null); }}>
                Exit Modules
              </Button>
              {!result.passed && (
                <Button className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" onClick={() => startTest(activeTest)}>Retake Scan</Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (activeTest) {
    const currentQuestion = activeTest.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeTest.questions.length) * 100;

    return (
      <div className="min-h-screen bg-background py-12 px-4 selection:bg-primary font-['Manrope'] relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="mb-12 space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveTest(null)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Terminate Assessment
              </button>
              <span className="text-[10px] font-black font-['Space_Grotesk'] tracking-[0.3em] text-primary uppercase">MODULE {currentQuestionIndex + 1} // {activeTest.questions.length}</span>
            </div>
            <div className="h-4 bg-muted/30 rounded-full p-1 border border-white/5 relative overflow-hidden glass-card">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-10"
            >
              <h2 className="text-4xl font-extrabold font-['Space_Grotesk'] tracking-tighter leading-tight">{currentQuestion.text}</h2>
              
              <div className="grid gap-4">
                {currentQuestion.options.map((option, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`group p-6 rounded-[1.75rem] border-2 text-left transition-all relative overflow-hidden ${
                      answers[currentQuestionIndex] === idx 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                        : 'border-white/5 bg-muted/20 hover:border-primary/30 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-lg font-bold font-['Space_Grotesk'] tracking-tight group-hover:text-primary transition-colors">{option}</span>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        answers[currentQuestionIndex] === idx ? 'bg-primary border-primary text-white scale-110 shadow-xl' : 'border-white/10'
                      }`}>
                        {answers[currentQuestionIndex] === idx && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-between pt-12 border-t border-white/5">
                <Button variant="ghost" onClick={prevQuestion} disabled={currentQuestionIndex === 0} className="h-14 px-8 rounded-xl font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/50">
                  Previous Module
                </Button>
                {currentQuestionIndex < activeTest.questions.length - 1 ? (
                  <Button onClick={nextQuestion} disabled={answers[currentQuestionIndex] === undefined} className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-xl shadow-primary/20">
                    Next Protocol <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={answers[currentQuestionIndex] === undefined || submitting} className="h-14 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                    {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : 'Commit Assessment'}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4 selection:bg-primary font-['Manrope'] relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6 max-w-3xl mx-auto mb-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 rounded-[2rem] bg-muted/30 border border-white/5 flex items-center justify-center mx-auto mb-6 glass-card shadow-2xl">
            <Award className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none">Verified Skill Badges</motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-xl text-muted-foreground font-medium leading-relaxed">
            Initialize diagnostic assessments to verify your industrial capabilities. Verified workers project 3x higher trust metrics in the deployment matrix.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map((test, index) => (
            <motion.div 
              key={test.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }} 
              className="h-full"
            >
              <div className="glass-card rounded-[2.5rem] p-1 shadow-xl hover:shadow-primary/5 transition-all h-full">
                <Card className="p-8 h-full flex flex-col justify-between border-0 bg-transparent relative overflow-hidden group">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-muted/30 border border-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all shadow-inner">
                        <BookOpen className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]">{test.category}</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold font-['Space_Grotesk'] tracking-tight group-hover:text-primary transition-colors uppercase">{test.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed line-clamp-3">{test.description}</p>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Terminal className="w-4 h-4 text-primary/60" /> {test.questions.length} Modules
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary/60" /> 10 Minute Protocol
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => startTest(test)} className="mt-10 h-16 w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold font-['Space_Grotesk'] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                    Launch Scan <ChevronRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsAssessmentPage;
