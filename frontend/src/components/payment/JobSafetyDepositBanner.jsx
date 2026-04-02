import React from 'react';
import { ShieldCheck } from 'lucide-react';

const formatINR = (paise) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0,
  }).format(paise / 100);
};

export default function JobSafetyDepositBanner({
  grossAmountPaise, 
  platformFeePaise, 
  netToWorkerPaise, 
  className = ''
}) {
  return (
    <div className={`rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950 ${className}`}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            Job Safety Deposit — {formatINR(grossAmountPaise)}
          </p>
          <p className="mt-1 text-xs text-green-700 dark:text-green-300">
            Your money stays in a secure lockbox. You release it only when satisfied with the work.
            Auto-releases after 48 hours if you don't respond.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: 'You deposit', value: formatINR(grossAmountPaise), color: 'text-green-800 dark:text-green-200' },
              { label: 'Platform fee (7.5%)', value: formatINR(platformFeePaise), color: 'text-gray-600 dark:text-gray-400' },
              { label: 'Worker receives', value: formatINR(netToWorkerPaise), color: 'text-blue-700 dark:text-blue-300' },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-white/60 px-2 py-2 dark:bg-white/5">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`mt-0.5 text-sm font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
