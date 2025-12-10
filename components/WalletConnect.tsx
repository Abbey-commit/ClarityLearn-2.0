// -----------------------------
// FILE NAME: components/WalletConnect.tsx
// Location: ClarityLearn-2.0/components/WalletConnect.tsx
// Purpose: Main wallet connection UI component
// -----------------------------

'use client';

import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/wallet-config';

export default function WalletConnect() {
  const { isConnected, address, isLoading, connect, disconnect } = useWallet();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  // Connected state
  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        {/* Connected indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">
            {shortenAddress(address)}
          </span>
        </div>

        {/* Disconnect button */}
        <button
          onClick={disconnect}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Not connected state
  return (
    <button
      onClick={connect}
      className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-orange-500 rounded-lg hover:from-purple-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      Connect Wallet
    </button>
  );
}