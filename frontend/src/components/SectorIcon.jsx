import React from 'react';
import * as LucideIcons from 'lucide-react';
import { HardHat } from 'lucide-react';

export const SectorIcon = ({ name, className = "w-5 h-5", grid = true }) => {
  const Icon = LucideIcons[name] || HardHat;
  
  if (!grid) return <Icon className={className} />;

  return (
    <div className="flex items-center justify-center p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
      <Icon className={`${className} text-primary`} />
    </div>
  );
};

export default SectorIcon;
