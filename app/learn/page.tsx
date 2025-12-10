// -----------------------------
// FILE NAME: app/learn/page.tsx
// Location: ClarityLearn-2.0/app/learn/page.tsx
// Purpose: Learning page layout
// -----------------------------

'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TermBrowser from '@/components/TermBrowser';
import LearningSession from '@/components/LearningSession';
import { Term } from '@/lib/clarity-dictionary';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import { useWallet } from '@/hooks/useWallet';

export default function LearnPage() {
  const { isConnected } = useWallet();
  const { termsCompleted, termsRequired } = useLearningProgress();
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  const handleSelectTerm = (term: Term) => {
    setSelectedTerm(term);
  };

  const handleCloseSession = () => {
    setSelectedTerm(null);
  };

  const handleCompleteSession = () => {
    setSelectedTerm(null);
    // Refresh page or show success message
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                Learn Crypto Terms
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse our community dictionary and master blockchain terminology
            </p>
          </div>

          {/* Progress Bar */}
          {isConnected && termsRequired > 0 && (
            <div className="mb-8 p-6 bg-white rounded-xl border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">Your Progress</span>
                <span className="text-sm text-gray-600">
                  {termsCompleted} / {termsRequired} terms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-orange-500 h-3 rounded-full transition-all"
                  style={{ width: `${(termsCompleted / termsRequired) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Term Browser */}
          <TermBrowser onSelectTerm={handleSelectTerm} />
        </div>
      </main>

      {/* Learning Session Modal */}
      {selectedTerm && (
        <LearningSession
          term={selectedTerm}
          onClose={handleCloseSession}
          onComplete={handleCompleteSession}
        />
      )}

      <Footer />
    </div>
  );
}
