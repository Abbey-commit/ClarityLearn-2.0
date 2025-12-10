// -----------------------------
// FILE NAME: Navbar.tsx
// Location: ClarityLearn-2.0/components/Navbar.tsx
// Purpose: Navigation bar with wallet connect
// -----------------------------

'use client';

import Link from 'next/link';
import WalletConnect from './WalletConnect';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">CL</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              ClarityLearn 2.0
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/learn" 
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Learn
            </Link>
            <Link 
              href="/stake" 
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Stake
            </Link>
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/leaderboard" 
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Leaderboard
            </Link>
          </div>

          {/* Wallet Connect */}
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}