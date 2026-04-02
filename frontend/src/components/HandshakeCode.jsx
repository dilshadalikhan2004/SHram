import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Handshake, Copy, CheckCircle, Key, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { handshakeApi } from '../lib/api';

const HandshakeCode = ({ jobId, isWorker = true }) => {
  const [code, setCode] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await handshakeApi.generate(jobId);
      setCode(res.data.code);
      toast.success('Entry code generated!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to generate code'); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 4) { toast.error('Enter 4-digit code'); return; }
    setLoading(true);
    try {
      await handshakeApi.verify({ job_id: jobId, code: verifyCode });
      setVerified(true);
      toast.success('Worker check-in verified!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Invalid code'); }
    finally { setLoading(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  if (verified) {
    return (
      <Card className="border-green-500/50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-600">Check-in Verified</p>
            <p className="text-xs text-muted-foreground">Attendance confirmed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isWorker) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-primary" />
            <span className="font-medium">Entry Code</span>
          </div>
          {!code ? (
            <Button onClick={handleGenerate} disabled={loading} className="w-full" variant="outline">
              <Key className="w-4 h-4 mr-2" /> Generate Check-in Code
            </Button>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Show this code to the employer on arrival</p>
              <div className="text-4xl font-bold tracking-[0.5em] font-mono bg-muted p-4 rounded-lg">{code}</div>
              <Button variant="outline" size="sm" onClick={copyCode}><Copy className="w-3 h-3 mr-1" /> Copy</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Employer view
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <span className="font-medium">Verify Worker Check-in</span>
        </div>
        <p className="text-sm text-muted-foreground">Enter the 4-digit code shown by the worker</p>
        <Input placeholder="Enter code" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} maxLength={4} className="text-center text-2xl tracking-[0.5em] font-mono" />
        <Button onClick={handleVerify} disabled={loading} className="w-full">
          <CheckCircle className="w-4 h-4 mr-2" /> Verify Check-in
        </Button>
      </CardContent>
    </Card>
  );
};

export default HandshakeCode;
