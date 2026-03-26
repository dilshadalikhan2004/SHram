import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Target, MapPin, Clock, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MatchScoreCard = ({ jobId }) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchScore = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/match-score/${jobId}`);
        setMatchData(response.data);
      } catch (error) {
        console.error('Failed to fetch match score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchScore();
  }, [jobId]);

  if (loading) {
    return (
      <Card className="bg-muted animate-pulse">
        <CardContent className="p-4 h-32" />
      </Card>
    );
  }

  if (!matchData) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (matchData.score / 100) * circumference;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20">
      {/* Animated border glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            AI Match Analysis
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={getScoreColor(matchData.score)}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                className={`text-3xl font-bold ${getScoreColor(matchData.score)}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {Math.round(matchData.score)}%
              </motion.span>
              <span className="text-xs text-muted-foreground">Match</span>
            </div>
          </div>

          {/* Match Details */}
          <div className="flex-1 space-y-4">
            <p className="text-sm text-muted-foreground">{matchData.explanation}</p>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted rounded-lg">
                <Target className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                <p className="text-xs text-muted-foreground">Skills</p>
                <p className="font-semibold">{Math.round(matchData.factors.skill_match)}%</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-lg">
                <Clock className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="font-semibold">{Math.round(matchData.factors.experience_match)}%</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-lg">
                <MapPin className="w-4 h-4 mx-auto mb-1 text-green-500" />
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="font-semibold">{matchData.factors.distance_km?.toFixed(1)} km</p>
              </div>
            </div>

            {matchData.factors.matching_skills?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Matching Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {matchData.factors.matching_skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchScoreCard;
