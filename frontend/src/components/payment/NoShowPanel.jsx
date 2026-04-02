import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const formatINR = (paise) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(paise / 100);
};

export default function NoShowPanel({ 
  jobId, 
  workerName, 
  escrowAmountPaise, 
  onConfirmNoShow, 
  replacementWorkers = [] 
}) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (onConfirmNoShow) await onConfirmNoShow();
      setConfirmed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950">
        <p className="font-semibold text-green-800 dark:text-green-200">
          ✓ Full refund of {formatINR(escrowAmountPaise)} is being processed
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          {workerName} has received a no-show strike. Here are available replacements:
        </p>
        <div className="mt-4 space-y-2">
          {replacementWorkers.map(w => (
            <div key={w.id} className="flex items-center justify-between rounded-xl border border-green-200 bg-white px-4 py-3 dark:border-green-800 dark:bg-gray-900">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{w.name}</p>
                <p className="text-xs text-gray-500">⭐ {w.rating} · {w.distance} away</p>
              </div>
              <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                Hire now
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-green-600 dark:text-green-400">
          If no replacement is found within 2 hours, you receive ₹500 platform credit automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="font-semibold text-red-800 dark:text-red-200">
            {workerName} hasn't shown up
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            30 minutes have passed since the job start time. If this is a confirmed no-show,
            your full deposit of {formatINR(escrowAmountPaise)} will be refunded immediately.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              Confirm no-show — get full refund
            </button>
            <button className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40">
              Worker is on the way
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
