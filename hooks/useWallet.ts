// Location: ClarityLearn-2.0/hooks/useWallet.ts
// Purpose: React hook for wallet state management

// -----------------------------

import { useState, useEffect } from 'react';
import { userSession, connectWallet, disconnectWallet, getUserData } from '@/lib/wallet-config';

interface WalletState {
  isConnected: boolean;
  address: string;
  balance: number;
  isLoading: boolean;
  userData: any;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: '',
    balance: 0,
    isLoading: true,
    userData: null,
  });

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = () => {
      if (userSession.isUserSignedIn()) {
        const userData = getUserData();
        const address = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet || '';
        
        setWallet({
          isConnected: true,
          address,
          balance: 0, // We'll fetch this in Step 3
          isLoading: false,
          userData,
        });
      } else {
        setWallet(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkConnection();
  }, []);

  // Connect wallet handler
  const connect = () => {
    connectWallet(
      (userData) => {
        const address = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet || '';
        setWallet({
          isConnected: true,
          address,
          balance: 0,
          isLoading: false,
          userData,
        });
      },
      () => {
        console.log('Connection cancelled');
      }
    );
  };

  // Disconnect wallet handler
  const disconnect = () => {
    disconnectWallet();
    setWallet({
      isConnected: false,
      address: '',
      balance: 0,
      isLoading: false,
      userData: null,
    });
  };

  return {
    ...wallet,
    connect,
    disconnect,
  };
};
