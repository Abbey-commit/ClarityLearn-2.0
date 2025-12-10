// -----------------------------
// FILE NAME: components/WalletStatus.tsx
// Location: ClarityLearn-2.0/components/WalletStatus.tsx
// Purpose: Detailed wallet status display (for dashboard)
// -----------------------------

'use client';

import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, formatSTX } from '@/lib/wallet-config';

export default function WalletStatus() {
  const { isConnected, address, balance } = useWallet();

  if (!isConnected) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800">Wallet Not Connected</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Connect your Stacks wallet to start learning and staking
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-orange-50 border border-purple-200 rounded-xl">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Your Wallet</h3>
      
      <div className="space-y-3">
        {/* Address */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Address</span>
          <span className="text-sm font-mono font-medium text-gray-800">
            {shortenAddress(address)}
          </span>
        </div>

        {/* Balance */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Balance</span>
          <span className="text-sm font-semibold text-purple-600">
            {formatSTX(balance)} STX
          </span>
        </div>

        {/* Network */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Network</span>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            Testnet
          </span>
        </div>
      </div>

      {/* Full address (copyable) */}
      <div className="mt-4 pt-4 border-t border-purple-200">
        <button
          onClick={() => {
            navigator.clipboard.writeText(address);
            alert('Address copied to clipboard!');
          }}
          className="w-full text-xs text-gray-500 hover:text-gray-700 font-mono break-all text-left"
        >
          {address}
          <span className="ml-2 text-purple-600">📋 Click to copy</span>
        </button>
      </div>
    </div>
  );
}
