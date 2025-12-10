// -----------------------------
// FILE NAME: StakingInterface.tsx
// Location: ClarityLearn-2.0/components/StakingInterface.tsx
// Purpose: Main staking UI component
// -----------------------------

'use client';

import { useState } from 'react';
import { STAKING_PLANS } from '@/lib/constants';
import { useStaking } from '@/hooks/useStaking';
import { useWallet } from '@/hooks/useWallet';
import { formatSTX } from '@/lib/wallet-config';

type StakingPlan = 'weekly' | 'biweekly' | 'monthly';

export default function StakingInterface() {
  const { address, balance, isConnected } = useWallet();
  const { createStake, isCreatingStake, error } = useStaking();
  
  const [selectedPlan, setSelectedPlan] = useState<StakingPlan>('weekly');
  const [stakeAmount, setStakeAmount] = useState('1');
  const [showSuccess, setShowSuccess] = useState(false);

  const currentPlan = STAKING_PLANS[selectedPlan];
  const amountInMicroSTX = parseFloat(stakeAmount || '0') * 1000000;
  const isValidAmount = amountInMicroSTX >= currentPlan.minAmount;
  const hasEnoughBalance = balance >= amountInMicroSTX;

  // Calculate potential rewards
  const successReward = amountInMicroSTX * (1 + currentPlan.successBonus);
  const failurePenalty = amountInMicroSTX * (1 - currentPlan.failurePenalty);

  const handleCreateStake = async () => {
    if (!isValidAmount || !hasEnoughBalance) return;

    const success = await createStake(amountInMicroSTX, selectedPlan);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setStakeAmount('1');
      }, 3000);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <svg className="w-16 h-16 text-yellow-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Wallet Not Connected</h3>
          <p className="text-gray-600 mb-6">
            Connect your Stacks wallet to create a stake and start learning
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            Connect Wallet Above ↑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-green-800">Stake Created Successfully!</p>
            <p className="text-sm text-green-600">Check your dashboard to track progress</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Plan Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Commitment</h2>
        <p className="text-gray-600 mb-6">Select a staking plan based on your learning goals</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weekly Plan */}
          <button
            onClick={() => setSelectedPlan('weekly')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedPlan === 'weekly'
                ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Weekly</h3>
                <p className="text-sm text-gray-600">{STAKING_PLANS.weekly.description}</p>
              </div>
              {selectedPlan === 'weekly' && (
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{STAKING_PLANS.weekly.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terms:</span>
                <span className="font-semibold">{STAKING_PLANS.weekly.termsRequired} terms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Min Stake:</span>
                <span className="font-semibold">{formatSTX(STAKING_PLANS.weekly.minAmount)} STX</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Success Bonus:</span>
                <span className="font-bold">+{STAKING_PLANS.weekly.successBonus * 100}%</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Failure Penalty:</span>
                <span className="font-bold">-{STAKING_PLANS.weekly.failurePenalty * 100}%</span>
              </div>
            </div>
          </button>

          {/* Bi-Weekly Plan */}
          <button
            onClick={() => setSelectedPlan('biweekly')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedPlan === 'biweekly'
                ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Bi-Weekly</h3>
                <p className="text-sm text-gray-600">{STAKING_PLANS.biweekly.description}</p>
              </div>
              {selectedPlan === 'biweekly' && (
                <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{STAKING_PLANS.biweekly.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terms:</span>
                <span className="font-semibold">{STAKING_PLANS.biweekly.termsRequired} terms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Min Stake:</span>
                <span className="font-semibold">{formatSTX(STAKING_PLANS.biweekly.minAmount)} STX</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Success Bonus:</span>
                <span className="font-bold">+{STAKING_PLANS.biweekly.successBonus * 100}%</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Failure Penalty:</span>
                <span className="font-bold">-{STAKING_PLANS.biweekly.failurePenalty * 100}%</span>
              </div>
            </div>
          </button>

          {/* Monthly Plan */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedPlan === 'monthly'
                ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Monthly</h3>
                <p className="text-sm text-gray-600">{STAKING_PLANS.monthly.description}</p>
              </div>
              {selectedPlan === 'monthly' && (
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{STAKING_PLANS.monthly.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terms:</span>
                <span className="font-semibold">{STAKING_PLANS.monthly.termsRequired} terms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Min Stake:</span>
                <span className="font-semibold">{formatSTX(STAKING_PLANS.monthly.minAmount)} STX</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Success Bonus:</span>
                <span className="font-bold">+{STAKING_PLANS.monthly.successBonus * 100}%</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Failure Penalty:</span>
                <span className="font-bold">-{STAKING_PLANS.monthly.failurePenalty * 100}%</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <h3 className="text-xl font-bold mb-4">Stake Amount</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter STX Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min={formatSTX(currentPlan.minAmount)}
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none text-lg font-semibold"
              placeholder="1.0"
            />
            <span className="absolute right-4 top-3 text-gray-500 font-semibold">STX</span>
          </div>
          
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Minimum: {formatSTX(currentPlan.minAmount)} STX
            </span>
            <span className="text-gray-600">
              Your Balance: {formatSTX(balance)} STX
            </span>
          </div>

          {!isValidAmount && parseFloat(stakeAmount) > 0 && (
            <p className="mt-2 text-sm text-red-600">
              ⚠️ Amount is below minimum for this plan
            </p>
          )}

          {!hasEnoughBalance && isValidAmount && (
            <p className="mt-2 text-sm text-red-600">
              ⚠️ Insufficient balance
            </p>
          )}
        </div>

        {/* Rewards Preview */}
        <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg p-6 mb-6">
          <h4 className="font-semibold mb-4 text-gray-800">Potential Outcomes</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">If you succeed:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatSTX(successReward)} STX
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">If you fail:</span>
              <span className="text-2xl font-bold text-red-600">
                {formatSTX(failurePenalty)} STX
              </span>
            </div>
          </div>
        </div>

        {/* Create Stake Button */}
        <button
          onClick={handleCreateStake}
          disabled={!isValidAmount || !hasEnoughBalance || isCreatingStake}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {isCreatingStake ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Stake...
            </span>
          ) : (
            `Stake ${stakeAmount} STX`
          )}
        </button>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Your STX will be locked for {currentPlan.duration} days. Learn {currentPlan.termsRequired} terms to unlock with bonus!
        </p>
      </div>
    </div>
  );
}
