// -----------------------------
// FILE NAME: page.tsx
// Location: ClarityLearn-2.0/app/stake/page.tsx
// Purpose: Staking page layout
// -----------------------------

'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StakingInterface from '@/components/StakingInterface';

export default function StakePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                Create Your Stake
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Lock your STX, commit to learning, and earn rewards for completing your goals
            </p>
          </div>

          {/* Staking Interface */}
          <StakingInterface />

          {/* Info Section */}
          <div className="mt-16 bg-blue-50 border border-blue-200 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How Staking Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Lock Your STX</h4>
                <p className="text-gray-700">
                  Your stake is time-locked in a smart contract. You cannot withdraw until the period ends.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Learn Terms</h4>
                <p className="text-gray-700">
                  Study crypto terms from our dictionary. Mark each term as learned to track progress.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Claim Rewards</h4>
                <p className="text-gray-700">
                  After the time period, claim your stake. Get bonus if successful, penalty if failed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}