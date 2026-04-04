// -----------------------------
// FILE NAME: Navbar.tsx
// Location: ClarityLearn-2.0/components/Navbar.tsx
// Purpose: Navigation bar with wallet connect
// -----------------------------

'use client';

import Link from 'next/link';
import WalletConnect from './WalletConnect';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/wallet-config';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { isConnected, address, balance, connect, disconnect } = useWallet();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(
      navigator.userAgent
    );
    setIsMobile(checkMobile);
  }, [])

  const handleConnect = () => {
    if (isMobile) {
      // Show Mobile Specific Instructions
      const shouldContinue = window.confirm(
        'Mobile Wallet Setup\n\n' +
        '1. Download Xverse App (App/Play Store)\n' +
        '2. Create wallet & switch to tsetnet\n' +
        '3. Open this site with Xverse browser\n\n' +
        'Continue anyway? (May not work.)'
      );

      if (!shouldContinue) return;
    } 

    connect();
  }
  return (
    <nav className='fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50'>
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

          {/* Wallet Connect Button */}
          <div className="flex items-center gap-4">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {isMobile ? '📱 Connect' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="flex items-center gap-4">
                {/* Balance Display */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-gray-800">
                    {balance.toFixed(2)} STX
                  </span>
                </div>

                {/* Address Display */}
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-mono text-sm font-semibold text-gray-800">
                    {shortenAddress(address)}
                  </span>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors border border-red-200"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          </div>
        </div>
      </nav>
     </nav> 
  );
}