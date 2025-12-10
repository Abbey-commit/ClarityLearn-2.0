// -----------------------------
// FILE NAME: components/ActiveStakes.tsx
// Location: ClarityLearn-2.0/components/ActiveStakes.tsx
// Purpose: Display user's active stakes
// -----------------------------

'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useStaking } from '@/hooks/useStaking';
import { formatSTX } from '@/lib/wallet-config';
import { STAKING_PLANS } from '@/lib/constants';
import ProgressTracker from './ProgressTracker';

interface Stake {
  id: number;
  amount: number;
  plan: 'weekly' | 'biweekly' | 'monthly';
  startTime: number;
  termsCompleted: number;
  status: 'active' | 'claimable' | 'claimed';
}

export default function ActiveStakes() {
  const { address, isConnected } = useWallet();
  const { claimStake, isClaimingStake } = useStaking();
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock stakes data (in real app, fetch from blockchain)
  useEffect(() => {
    if (isConnected) {
      setIsLoading(true);
      // Simulate fetching stakes
      setTimeout(() => {
        const mockStakes: Stake[] = [
          {
            id: 1,
            amount: 1000000,
            plan: 'weekly',
            startTime: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
            termsCompleted: 4,
            status: 'active'
          }
        ];
        setStakes(mockStakes);
        setIsLoading(false);
      }, 1000);
    }
  }, [isConnected, address]);

  const handleClaimStake = async (stakeId: number) => {
    const success = await claimStake(stakeId);
    if (success) {
      // Refresh stakes
      setStakes(stakes.map(s => 
        s.id === stakeId ? { ...s, status: 'claimed' } : s
      ));
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
        <svg className="w-16 h-16 text-yellow-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Wallet Not Connected</h3>
        <p className="text-gray-600">
          Connect your wallet to view your active stakes
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your stakes...</p>
      </div>
    );
  }

  if (stakes.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
        <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Stakes</h3>
        <p className="text-gray-600 mb-6">
          Create your first stake to start your learning journey
        </p>
        <a 
          href="/stake"
          className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Create Stake
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Your Active Stakes</h2>

      <div className="grid grid-cols-1 gap-6">
        {stakes.map(stake => {
          const plan = STAKING_PLANS[stake.plan];
          const daysElapsed = Math.floor((Date.now() - stake.startTime) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, plan.duration - daysElapsed);
          const isComplete = stake.termsCompleted >= plan.termsRequired;
          const isExpired = daysRemaining === 0;
          const canClaim = isExpired && stake.status !== 'claimed';

          return (
            <div 
              key={stake.id}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {plan.name} Stake
                  </h3>
                  <p className="text-gray-600">Stake #{stake.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatSTX(stake.amount)} STX
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                    stake.status === 'claimed' 
                      ? 'bg-gray-100 text-gray-600'
                      : canClaim
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {stake.status === 'claimed' ? 'Claimed' : canClaim ? 'Claimable' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <ProgressTracker
                  completed={stake.termsCompleted}
                  total={plan.termsRequired}
                  label="Learning Progress"
                />
              </div>

              {/* Time Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-600 block mb-1">Days Elapsed</span>
                  <span className="font-semibold text-gray-800">{daysElapsed} / {plan.duration}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-600 block mb-1">Days Remaining</span>
                  <span className="font-semibold text-gray-800">
                    {daysRemaining === 0 ? 'Expired' : `${daysRemaining} days`}
                  </span>
                </div>
              </div>

              {/* Projected Outcome */}
              <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3">Projected Outcome</h4>
                {isComplete ? (
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Success Bonus:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatSTX(stake.amount * (1 + plan.successBonus))} STX
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-red-700">Failure Penalty:</span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatSTX(stake.amount * (1 - plan.failurePenalty))} STX
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {stake.status === 'claimed' ? (
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-gray-600 font-semibold">✓ Stake already claimed</p>
                </div>
              ) : canClaim ? (
                <button
                  onClick={() => handleClaimStake(stake.id)}
                  disabled={isClaimingStake}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClaimingStake ? 'Claiming...' : 'Claim Rewards'}
                </button>
              ) : (
                <a
                  href="/learn"
                  className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Continue Learning
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}