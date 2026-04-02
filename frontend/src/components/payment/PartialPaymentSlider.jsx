import React, { useState } from 'react';

const formatINR = (paise) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(paise / 100);
};

export default function PartialPaymentSlider({ 
  netToWorkerPaise, 
  onPropose, 
  onFullRelease, 
  isLoading = false 
}) {
  const [pct, setPct] = useState(100);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('full');

  const workerGets = Math.round(netToWorkerPaise * pct / 100);
  const employerRefund = netToWorkerPaise - workerGets;

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          How satisfied are you with the completed work?
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          You control exactly how much the worker receives.
        </p>
      </div>

      <div className="flex gap-2">
        {['full', 'partial'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); if (m === 'full') setPct(100); }}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
              mode === m
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
            }`}
          >
            {m === 'full' ? '✓ Fully satisfied — release all' : 'Partial — some issues'}
          </button>
        ))}
      </div>

      {mode === 'partial' && (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-xs text-gray-500">
              <span>Work incomplete / quality issues</span>
              <span>Fully satisfied</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              onChange={e => setPct(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-xs text-blue-600 dark:text-blue-400">Worker receives</p>
                <p className="mt-1 text-lg font-bold text-blue-800 dark:text-blue-200">
                  {formatINR(workerGets)}
                </p>
                <p className="text-xs text-blue-500">{pct}% of total</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
                <p className="text-xs text-gray-500">Refunded to you</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-gray-200">
                  {formatINR(employerRefund)}
                </p>
                <p className="text-xs text-gray-400">{100 - pct}% returned</p>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Explain the issue to the worker (required)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Only 3 of 5 rooms were painted. The ceiling was left incomplete."
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {mode === 'full' ? (
          <button
            onClick={onFullRelease}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Release full payment — {formatINR(netToWorkerPaise)}
          </button>
        ) : (
          <>
            <button
              onClick={() => onPropose(pct, message)}
              disabled={isLoading || !message.trim() || pct === 0}
              className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Propose {formatINR(workerGets)} to worker
            </button>
            <button
              onClick={() => {}}
              className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40"
            >
              Raise dispute
            </button>
          </>
        )}
      </div>
    </div>
  );
}
