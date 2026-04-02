import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, 
  Clock, FileText, Download, IndianRupee, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { earningsApi } from '../lib/api';

const EarningsPanel = () => {
  const [earnings, setEarnings] = useState(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => { fetchEarnings(); }, [period]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await earningsApi.get(period);
      setEarnings(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) < 100) {
      toast.error('Minimum withdrawal is ₹100');
      return;
    }
    try {
      await earningsApi.withdraw({ amount: parseFloat(withdrawAmount), method: 'upi', upi_id: upiId });
      toast.success(`₹${withdrawAmount} withdrawal initiated!`);
      setShowWithdraw(false);
      setWithdrawAmount('');
      fetchEarnings();
    } catch (err) { toast.error(err.response?.data?.detail || 'Withdrawal failed'); }
  };

  const handleDownloadCertificate = async () => {
    try {
      const res = await earningsApi.getCertificate();
      const cert = res.data.certificate;
      const text = `ShramSetu Income Certificate\n\nName: ${cert.name}\nTotal Earnings: ₹${cert.total_earnings}\nTotal Jobs: ${cert.total_jobs}\nPeriod: ${cert.period}\nGenerated: ${new Date(cert.generated_at).toLocaleDateString()}\nVerification ID: ${cert.verification_id}`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'income_certificate.txt'; a.click();
      toast.success('Certificate downloaded!');
    } catch (e) { toast.error('Failed to generate certificate'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5" /> Earnings Dashboard
        </h3>
        <Button size="sm" variant="outline" onClick={handleDownloadCertificate}>
          <Download className="w-4 h-4 mr-1" /> Income Certificate
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{earnings?.wallet_balance?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">In Escrow</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">₹{earnings?.pending_amount?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">₹{earnings?.total_earned?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Section */}
      {!showWithdraw ? (
        <Button className="w-full" onClick={() => setShowWithdraw(true)} disabled={!earnings?.wallet_balance}>
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw to UPI
        </Button>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input type="number" placeholder="Amount (min ₹100)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            <Input placeholder="UPI ID (e.g., name@upi)" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleWithdraw} className="flex-1">Withdraw ₹{withdrawAmount || '0'}</Button>
              <Button variant="ghost" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Filter */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList className="grid grid-cols-4 h-9">
          <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
          <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
          <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transactions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Recent Transactions</h4>
        {!earnings?.transactions?.length ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No transactions yet</p>
            </CardContent>
          </Card>
        ) : (
          earnings.transactions.slice(0, 20).map((txn) => (
            <Card key={txn.id} className="card-hover">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.type === 'withdrawal' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    {txn.type === 'withdrawal' ? <ArrowUpFromLine className="w-4 h-4 text-red-600" /> : <ArrowDownToLine className="w-4 h-4 text-green-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{txn.type === 'withdrawal' ? 'Withdrawal' : txn.type === 'escrow_release' ? 'Payment Received' : txn.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(txn.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${txn.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                    {txn.type === 'withdrawal' ? '-' : '+'}₹{txn.amount?.toLocaleString()}
                  </p>
                  <Badge variant="outline" className="text-xs">{txn.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EarningsPanel;
