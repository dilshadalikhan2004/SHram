import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Shield, CheckCircle, AlertTriangle, CreditCard, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '../utils/errorUtils';
import { kycApi, eshramApi } from '../lib/api';
import { useTranslation } from '../context/TranslationContext';

const KYCPanel = () => {
  const { t } = useTranslation();
  const [kycStatus, setKycStatus] = useState(null);
  const [eshramStatus, setEshramStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [kycSessionId, setKycSessionId] = useState(null);
  const [otp, setOtp] = useState('');
  const [eshramCard, setEshramCard] = useState('');

  useEffect(() => { fetchStatuses(); }, []);

  const fetchStatuses = async () => {
    try {
      const [kyc, eshram] = await Promise.all([
        kycApi.getStatus().catch(() => ({ data: { kyc_verified: false } })),
        eshramApi.getStatus().catch(() => ({ data: { eshram_linked: false } })),
      ]);
      setKycStatus(kyc.data);
      setEshramStatus(eshram.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleInitKYC = async () => {
    if (aadhaarLast4.length !== 4) { toast.error(parseApiError(null, 'Enter last 4 digits')); return; }
    try {
      const res = await kycApi.initiate({ aadhaar_last4: aadhaarLast4, consent: true });
      setKycSessionId(res.data.kyc_session_id);
      toast.success('OTP sent to Aadhaar-linked mobile!');
    } catch (err) { toast.error(parseApiError(err, 'Failed to initiate KYC')); }
  };

  const handleVerifyKYC = async () => {
    if (otp.length !== 6) { toast.error(parseApiError(null, 'Enter 6-digit OTP')); return; }
    try {
      const res = await kycApi.verify({ kyc_session_id: kycSessionId, otp });
      if (res.data.status === 'verified') {
        toast.success('KYC Verified!');
        setKycSessionId(null);
        fetchStatuses();
      } else { toast.error(parseApiError(null, 'Verification failed')); }
    } catch (err) { toast.error(parseApiError(err, 'Failed to verify KYC')); }
  };

  const handleLinkEShram = async () => {
    if (!eshramCard.trim()) { toast.error('Enter e-Shram card number'); return; }
    try {
      await eshramApi.link({ eshram_card_number: eshramCard });
      toast.success('e-Shram card linked!');
      setEshramCard('');
      fetchStatuses();
    } catch (err) { toast.error(parseApiError(err, 'Failed to link card')); }
  };

  if (loading) return <Card className="skeleton h-48" />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="w-5 h-5" /> {t('trust_verification')}
      </h3>

      {/* Aadhaar KYC */}
      <Card className={kycStatus?.kyc_verified ? 'border-green-500/50' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> {t('aadhaar_kyc')}
            {kycStatus?.kyc_verified && <Badge className="bg-green-500 ml-auto"><CheckCircle className="w-3 h-3 mr-1" /> {t('verified')}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kycStatus?.kyc_verified ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('aadhaar_ending')} ****{kycStatus.aadhaar_last4}</p>
              <p className="text-xs text-muted-foreground">{t('verified')} on {new Date(kycStatus.verified_at).toLocaleDateString()}</p>
            </div>
          ) : kycSessionId ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter OTP sent to your Aadhaar-linked mobile</p>
              <Input placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="text-center text-lg tracking-widest" />
              <Button onClick={handleVerifyKYC} className="w-full">Verify OTP</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('kyc_desc')}</p>
              <Input placeholder="Last 4 digits of Aadhaar" value={aadhaarLast4} onChange={(e) => setAadhaarLast4(e.target.value)} maxLength={4} className="text-center text-lg tracking-widest" />
              <Button onClick={handleInitKYC} className="w-full"><Shield className="w-4 h-4 mr-2" /> {t('start_kyc')}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* e-Shram Card */}
      <Card className={eshramStatus?.eshram_linked ? 'border-blue-500/50' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> {t('eshram_card')}
            {eshramStatus?.eshram_linked && <Badge className="bg-blue-500 ml-auto"><CheckCircle className="w-3 h-3 mr-1" /> {t('linked')}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eshramStatus?.eshram_linked ? (
            <div className="space-y-1">
              <p className="text-sm">{t('eshram_card')}: {eshramStatus.card_number}</p>
              <p className="text-xs text-muted-foreground">{t('benefit_desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('benefit_desc')}</p>
              <Input placeholder={t('eshram_uan_placeholder')} value={eshramCard} onChange={(e) => setEshramCard(e.target.value)} />
              <Button variant="outline" onClick={handleLinkEShram} className="w-full"><CreditCard className="w-4 h-4 mr-2" /> {t('link_card')}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCPanel;
