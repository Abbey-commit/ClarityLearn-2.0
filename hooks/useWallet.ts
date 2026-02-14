import { useState, useEffect } from 'react';
import { connectWallet, disconnectWallet, getUserData, checkConnection } from '@/lib/wallet-config';
import { useBalance } from './useBalance';

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
    const checkWalletConnection = () => {
      console.log('🔵 Checking wallet connection on mount...');
      
      if (checkConnection()) {
        console.log('✅ Wallet is connected (from checkConnection)');
        const userData = getUserData();
        console.log('📦 getUserData returned:', userData);
        
        const address = 
          userData?.profile?.stxAddress?.testnet ||
          userData?.profile?.stxAddress?.mainnet ||
          '';
        
        console.log('📍 Extracted address:', address);
        
        setWallet({
          isConnected: true, // Set to true if we have stored data
          address,
          balance: 0,
          isLoading: false,
          userData,
        });
      } else {
        console.log('❌ No wallet connected');
        setWallet(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkWalletConnection();
  }, []);

  // Connect wallet handler
  const connect = async () => {
    console.log('🔵 Connect button clicked');
    try {
      await connectWallet(
        (userData) => {
          console.log('✅ Wallet connected successfully');
          console.log('📦 Connection userData:', userData);
          
          const address = 
            userData?.profile?.stxAddress?.testnet ||
            userData?.profile?.stxAddress?.mainnet ||
            '';
          
          console.log('📍 Extracted address:', address);
          
          // Update wallet state with connection
          setWallet({
            isConnected: true, // CRITICAL: Set this to true
            address,
            balance: 0,
            isLoading: false,
            userData,
          });
        },
        () => {
          console.log('⚠️ Connection cancelled by user');
          setWallet(prev => ({ ...prev, isLoading: false }));
        }
      );
    } catch (error) {
      console.error('❌ Connection error:', error);
      setWallet(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Disconnect wallet handler
  const disconnect = () => {
    console.log('🔵 Disconnecting wallet');
    disconnectWallet();
    setWallet({
      isConnected: false,
      address: '',
      balance: 0,
      isLoading: false,
      userData: null,
    });
  };

  const { balance } = useBalance(wallet.address);

  // Debug log to track state
  console.log('🔍 useWallet current state:', {
    isConnected: wallet.isConnected,
    address: wallet.address,
    balance: balance,
  });

  return {
    ...wallet,
    balance, // Use balance from useBalance hook
    connect,
    disconnect,
  };
};