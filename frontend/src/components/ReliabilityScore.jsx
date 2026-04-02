import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Shield, CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

const ReliabilityScore = ({ score, jobsCompleted, acceptanceRate, phoneVerified }) => {
  const { t } = useTranslation();

  const getScoreColor = (s) => {
    if (s >= 90) return 'text-green-500';
    if (s >= 70) return 'text-blue-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (s) => {
    if (s >= 90) return 'bg-green-500';
    if (s >= 70) return 'bg-blue-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (s) => {
    if (s >= 90) return t('excellent');
    if (s >= 70) return t('good');
    if (s >= 50) return t('average');
    return t('needs_improvement');
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          {t('reliability_score')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative"
          >
            <div className={`w-20 h-20 rounded-full border-4 ${getScoreColor(score).replace('text-', 'border-')} flex items-center justify-center`}>
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}%
              </span>
            </div>
          </motion.div>
          
          <div className="flex-1">
            <p className={`font-semibold ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('reliability_desc')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
          <Progress value={score} className={`h-2 ${getScoreBg(score)}`} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-muted rounded-lg">
            <Award className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-semibold">{jobsCompleted}</p>
            <p className="text-xs text-muted-foreground">{t('jobs_done')}</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-semibold">{acceptanceRate}%</p>
            <p className="text-xs text-muted-foreground">{t('acceptance')}</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <Clock className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-semibold">
              {phoneVerified ? (
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
              ) : (
                '—'
              )}
            </p>
            <p className="text-xs text-muted-foreground">{t('verified_label')}</p>
          </div>
        </div>

        {phoneVerified && (
          <Badge variant="outline" className="w-full justify-center gap-1 text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3" />
            {t('phone_verified')}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default ReliabilityScore;
