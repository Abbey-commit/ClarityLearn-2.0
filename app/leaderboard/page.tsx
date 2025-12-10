// -----------------------------
// FILE NAME: app/leaderboard/page.tsx
// Location: ClarityLearn-2.0/app/leaderboard/page.tsx
// Purpose: Leaderboard page (simple placeholder)
// -----------------------------

'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LeaderboardPage() {
  // Mock leaderboard data
  const topLearners = [
    { rank: 1, address: 'ST1PKQ...WF7H5', termsLearned: 45, stakesCompleted: 8, totalEarned: 12.5 },
    { rank: 2, address: 'ST2ABC...XY9Z2', termsLearned: 38, stakesCompleted: 6, totalEarned: 9.8 },
    { rank: 3, address: 'ST3DEF...MN4K5', termsLearned: 32, stakesCompleted: 5, totalEarned: 7.2 },
    { rank: 4, address: 'ST4GHI...PQ7L8', termsLearned: 28, stakesCompleted: 4, totalEarned: 5.5 },
    { rank: 5, address: 'ST5JKL...RS2M9', termsLearned: 25, stakesCompleted: 4, totalEarned: 4.8 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Top learners in the ClarityLearn community
            </p>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-orange-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Rank</th>
                    <th className="px-6 py-4 text-left font-semibold">Address</th>
                    <th className="px-6 py-4 text-right font-semibold">Terms Learned</th>
                    <th className="px-6 py-4 text-right font-semibold">Stakes Completed</th>
                    <th className="px-6 py-4 text-right font-semibold">Total Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topLearners.map((learner) => (
                    <tr key={learner.rank} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {learner.rank <= 3 && (
                            <span className="text-2xl">
                              {learner.rank === 1 ? '🥇' : learner.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                          <span className="font-bold text-lg">#{learner.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-700">
                        {learner.address}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-purple-600">
                        {learner.termsLearned}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-orange-500">
                        {learner.stakesCompleted}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">
                        {learner.totalEarned} STX
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <p className="text-blue-700">
              <strong>Note:</strong> Leaderboard data is currently simulated. 
              Real data will be fetched from the blockchain once more users join!
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}