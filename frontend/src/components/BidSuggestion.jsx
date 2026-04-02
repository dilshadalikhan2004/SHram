import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus, IndianRupee, Users, Lightbulb } from 'lucide-react';
import { bidSuggestionApi } from '../lib/api';

const BidSuggestion = ({ jobId }) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await bidSuggestionApi.get(jobId);
        setSuggestion(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [jobId]);

  if (loading) return <Card className="skeleton h-20" />;
  if (!suggestion) return null;

  const diff = suggestion.market_diff_percentage;
  const DiffIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-amber-600';

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Bid Suggestion</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold flex items-center">
              <IndianRupee className="w-5 h-5" />{suggestion.suggested_rate}
              <span className="text-sm font-normal text-muted-foreground">/day</span>
            </p>
            <p className="text-xs text-muted-foreground">Market avg: ₹{suggestion.market_average}</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={`${diffColor} gap-1`}>
              <DiffIcon className="w-3 h-3" /> {Math.abs(diff)}%
            </Badge>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> {suggestion.competition_count} applicants
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{suggestion.reasoning}</p>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹{suggestion.market_range?.min}</span>
          <span>Market Range</span>
          <span>₹{suggestion.market_range?.max}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full relative">
          <div className="absolute h-full bg-primary/30 rounded-full" style={{ left: '0%', width: '100%' }} />
          <div className="absolute w-2 h-2 bg-primary rounded-full top-1/2 -translate-y-1/2" style={{ left: `${Math.min(Math.max(((suggestion.suggested_rate - suggestion.market_range?.min) / (suggestion.market_range?.max - suggestion.market_range?.min)) * 100, 0), 100)}%` }} />
        </div>
      </CardContent>
    </Card>
  );
};

export default BidSuggestion;
