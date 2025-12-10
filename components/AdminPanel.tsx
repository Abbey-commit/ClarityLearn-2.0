// -----------------------------
// FILE NAME: components/AdminPanel.tsx
// Location: ClarityLearn-2.0/components/AdminPanel.tsx
// Purpose: Admin controls for contract management
// -----------------------------

'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { setStakingContract } from '@/lib/contract-calls';
import { CONTRACTS } from '@/lib/wallet-config';

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET || '';

export default function AdminPanel() {
  const { address } = useWallet();
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);

  const isAdmin = address === ADMIN_ADDRESS;

  const handleLinkContracts = async () => {
    setIsLinking(true);
    try {
      await setStakingContract(CONTRACTS.staking, address);
      setLinkSuccess(true);
      setTimeout(() => setLinkSuccess(false), 3000);
    } catch (error) {
      console.error('Error linking contracts:', error);
    }
    setIsLinking(false);
  };

  if (!isAdmin) {
    return null; // Don't show admin panel to non-admins
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-800">Admin Controls</h3>
      </div>

      <p className="text-gray-600 mb-6 text-sm">
        Administrative functions for contract management and configuration
      </p>

      {/* Contract Linking */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">Link Staking to Rewards</h4>
        <p className="text-sm text-gray-600 mb-4">
          Connect the staking contract to the rewards pool to enable bonus payouts
        </p>
        
        {linkSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-green-700 font-semibold">✓ Contracts linked successfully!</p>
          </div>
        ) : (
          <button
            onClick={handleLinkContracts}
            disabled={isLinking}
            className="w-full py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLinking ? 'Linking Contracts...' : 'Link Staking Contract'}
          </button>
        )}
      </div>

      {/* Contract Addresses */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Deployed Contracts</h4>
        <div className="space-y-2 text-xs font-mono">
          <div>
            <span className="text-gray-500">Core:</span>
            <div className="text-gray-700 break-all">{CONTRACTS.core}</div>
          </div>
          <div>
            <span className="text-gray-500">Rewards:</span>
            <div className="text-gray-700 break-all">{CONTRACTS.rewards}</div>
          </div>
          <div>
            <span className="text-gray-500">Staking:</span>
            <div className="text-gray-700 break-all">{CONTRACTS.staking}</div>
          </div>
        </div>
      </div>
    </div>
  );
}