import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Rocket, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BoostSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      navigate('/employer');
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/boost/status/${sessionId}`);
      
      if (response.data.status === 'paid') {
        setStatus('success');
        toast.success('Job boost activated!');
      } else if (response.data.status === 'expired') {
        setStatus('failed');
      } else {
        setAttempts(prev => prev + 1);
        setTimeout(() => pollPaymentStatus(sessionId), pollInterval);
      }
    } catch (error) {
      console.error('Status check failed:', error);
      setAttempts(prev => prev + 1);
      setTimeout(() => pollPaymentStatus(sessionId), pollInterval);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            {status === 'checking' && (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
                <p className="text-muted-foreground mb-6">
                  Please wait while we confirm your payment...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-6 flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">Boost Activated!</h1>
                <p className="text-muted-foreground mb-6">
                  Your job listing is now boosted and will appear at the top of search results.
                </p>
                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                  <Rocket className="w-4 h-4 text-primary" />
                  <span>Expect 2-3x more applicants</span>
                </div>
              </>
            )}

            {(status === 'failed' || status === 'timeout') && (
              <>
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl">😕</span>
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  {status === 'timeout' ? 'Taking Longer Than Expected' : 'Payment Issue'}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {status === 'timeout'
                    ? 'Please check your email for confirmation or contact support.'
                    : 'There was an issue with your payment. Please try again.'}
                </p>
              </>
            )}

            <Button
              onClick={() => navigate('/employer')}
              className="w-full btn-employer"
              data-testid="back-to-dashboard-btn"
            >
              Back to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BoostSuccessPage;
