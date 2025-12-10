// -----------------------------
// FILE NAME: components/ProgressTracker.tsx
// Location: ClarityLearn-2.0/components/ProgressTracker.tsx
// Purpose: Visual progress display for stakes
// -----------------------------

'use client';

interface ProgressTrackerProps {
  completed: number;
  total: number;
  label?: string;
}

export default function ProgressTracker({ completed, total, label }: ProgressTrackerProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed >= total;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-600">
            {completed} / {total}
          </span>
        </div>
      )}
      
      <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-purple-600 to-orange-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        
        {isComplete && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{percentage.toFixed(1)}% complete</span>
        {isComplete && <span className="text-green-600 font-semibold">✓ Goal reached!</span>}
      </div>
    </div>
  );
}