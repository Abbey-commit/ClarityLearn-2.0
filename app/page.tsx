// -----------------------------
// FILE NAME: page.tsx
// Location: ClarityLearn-2.0/app/page.tsx
// Purpose: Main landing page
// -----------------------------

'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useWallet } from '@/hooks/useWallet';

export default function HomePage() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Learn Crypto Terms.
            </span>
            <br />
            <span className="text-gray-900">
              Earn Real Rewards.
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Stake STX to commit to learning blockchain terminology. 
            Complete your goals and earn up to 15% bonus. Fail and lose your stake.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isConnected ? (
              <>
                <Link 
                  href="/stake"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Create Your First Stake
                </Link>
                <Link 
                  href="/learn"
                  className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-semibold text-lg hover:bg-purple-50 transition-all"
                >
                  Browse Dictionary
                </Link>
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Connect your wallet to get started</p>
                <div className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold text-lg cursor-pointer hover:shadow-xl transition-all transform hover:scale-105">
                  Connect Wallet Above ↑
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-white rounded-xl shadow-md">
              <div className="text-4xl font-bold text-purple-600 mb-2">97%</div>
              <div className="text-gray-600">Struggle with crypto jargon</div>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md">
              <div className="text-4xl font-bold text-orange-500 mb-2">15%</div>
              <div className="text-gray-600">Maximum success bonus</div>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md">
              <div className="text-4xl font-bold text-purple-600 mb-2">3</div>
              <div className="text-gray-600">Staking plan options</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Three simple steps to gamify your crypto learning journey
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Stake Your STX</h3>
              <p className="text-gray-600">
                Choose a staking plan (Weekly, Bi-Weekly, or Monthly) and lock your STX. 
                More commitment = bigger rewards.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Learn & Progress</h3>
              <p className="text-gray-600">
                Study crypto terms from our community dictionary. 
                Mark terms as learned and track your progress.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Claim Rewards</h3>
              <p className="text-gray-600">
                Complete your goal and claim your stake plus bonus! 
                Fail and lose up to 30% as penalty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose ClarityLearn?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Skin in the Game</h3>
              <p className="text-gray-600">
                87% of users say staking motivates them more than free apps. 
                Real commitment drives real results.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Earn While You Learn</h3>
              <p className="text-gray-600">
                Successful completion earns you 10-15% bonus. 
                Turn learning into profit, not just knowledge.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Community Dictionary</h3>
              <p className="text-gray-600">
                Contribute terms, vote on definitions, build reputation. 
                Learn from real crypto users, not AI.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-white rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Built on Stacks</h3>
              <p className="text-gray-600">
                Smart contracts secure your stakes. Transparent, trustless, auditable. 
                Bitcoin security, smart contract power.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-orange-500">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join crypto learners who are earning while they master blockchain terminology
          </p>
          {isConnected ? (
            <Link 
              href="/stake"
              className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              Create Your First Stake Now
            </Link>
          ) : (
            <div className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg shadow-xl">
              Connect Wallet to Get Started
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
