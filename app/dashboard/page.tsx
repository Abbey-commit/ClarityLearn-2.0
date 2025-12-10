// -----------------------------
// FILE NAME: app/dashboard/page.tsx
// Location: ClarityLearn-2.0/app/dashboard/page.tsx
// Purpose: Dashboard page layout
// -----------------------------

'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WalletStatus from '@/components/WalletStatus';
import ActiveStakes from '@/components/ActiveStakes';
import AdminPanel from '@/components/AdminPanel';
import { useWallet } from '@/hooks/useWallet';
import { useLearningProgress } from '@/hooks/useLearningProgress';

export default function DashboardPage() {
  const { isConnected } = useWallet();
  const { termsCompleted, learnedTerms } = useLearningProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                Your Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Track your stakes, progress, and earnings
            </p>
          </div>

          {isConnected ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - 2 columns */}
              <div className="lg:col-span-2 space-y-8">
                {/* Active Stakes */}
                <ActiveStakes />

                {/* Admin Panel */}
                <AdminPanel />
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-6">
                {/* Wallet Status */}
                <WalletStatus />

                {/* Learning Stats */}
                <div className="bg-gradient-to-br from-purple-50 to-orange-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Learning Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Terms Learned</span>
                      <span className="text-2xl font-bold text-purple-600">{termsCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Votes Cast</span>
                      <span className="text-2xl font-bold text-orange-500">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Terms Contributed</span>
                      <span className="text-2xl font-bold text-purple-600">0</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <a
                      href="/stake"
                      className="block w-full py-3 bg-purple-600 text-white text-center rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      Create New Stake
                    </a>
                    <a
                      href="/learn"
                      className="block w-full py-3 bg-orange-500 text-white text-center rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Continue Learning
                    </a>
                    <a
                      href="/leaderboard"
                      className="block w-full py-3 bg-gray-100 text-gray-700 text-center rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      View Leaderboard
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-12 text-center">
              <svg className="w-20 h-20 text-yellow-600 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Wallet Not Connected</h3>
              <p className="text-xl text-gray-600 mb-8">
                Connect your Stacks wallet to access your dashboard
              </p>
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all">
                Connect Wallet Above ↑
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}