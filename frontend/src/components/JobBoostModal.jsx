import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Rocket, Zap, Crown, Star, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PACKAGES = {
  basic: {
    id: 'basic',
    name: 'Basic Boost',
    price: 99,
    days: 7,
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: ['7 days visibility', 'Appear before regular jobs', 'Blue boost badge']
  },
  premium: {
    id: 'premium',
    name: 'Premium Boost',
    price: 249,
    days: 14,
    icon: Rocket,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    popular: true,
    features: ['14 days visibility', 'Priority listing', 'Purple premium badge', '2x more applicants']
  },
  featured: {
    id: 'featured',
    name: 'Featured Listing',
    price: 499,
    days: 30,
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: ['30 days visibility', 'Top position', 'Gold featured badge', '3x more applicants', 'Highlighted in search']
  }
};

const JobBoostModal = ({ jobId, jobTitle, onSuccess }) => {
  const [selectedPackage, setSelectedPackage] = useState('premium');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleBoost = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/boost/checkout`, {
        job_id: jobId,
        package_id: selectedPackage,
        origin_url: window.location.origin
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate boost');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="boost-job-btn">
          <Rocket className="w-4 h-4" />
          Boost Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Boost Your Job Listing
          </DialogTitle>
          <DialogDescription>
            Get more visibility and attract top candidates for "{jobTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {Object.values(PACKAGES).map((pkg) => {
            const Icon = pkg.icon;
            const isSelected = selectedPackage === pkg.id;

            return (
              <motion.div
                key={pkg.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer relative transition-all ${
                    isSelected
                      ? 'border-2 border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                  data-testid={`package-${pkg.id}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className={`w-12 h-12 rounded-xl ${pkg.bgColor} mx-auto mb-2 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${pkg.color}`} />
                    </div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold">₹{pkg.price}</span>
                      <span className="text-muted-foreground">/{pkg.days} days</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className={`w-4 h-4 ${pkg.color}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Selected: {PACKAGES[selectedPackage].name}</p>
            <p className="text-lg font-semibold">Total: ₹{PACKAGES[selectedPackage].price}</p>
          </div>
          <Button
            onClick={handleBoost}
            disabled={loading}
            className="btn-employer gap-2"
            data-testid="confirm-boost-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Boost Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobBoostModal;
