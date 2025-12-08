// -----------------------------
// FILE 1: lib/wallet-config.ts
// Location: ClarityLearn-2.0/lib/wallet-config.ts
// Purpose: Wallet configuration and network settings
// -----------------------------

import { AppConfig, UserSession, showConnect } from '@stacks/connect';

// App configuration for Stacks Connect
export const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

// Network configuration based on environment
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
export const STACKS_API_URL = process.env.NEXT_PUBLIC_STACKS_API || 'https://api.testnet.hiro.so';

// Contract addresses from environment
export const CONTRACTS = {
  core: process.env.NEXT_PUBLIC_CORE_CONTRACT || '',
  rewards: process.env.NEXT_PUBLIC_REWARDS_CONTRACT || '',
  staking: process.env.NEXT_PUBLIC_STAKING_CONTRACT || '',
};

// App metadata
export const APP_META = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'ClarityLearn 2.0',
  icon: process.env.NEXT_PUBLIC_APP_ICON || '/logo.png',
};

// Wallet connection function
export const connectWallet = (onFinish: (userData: any) => void, onCancel?: () => void) => {
  showConnect({
    appDetails: {
      name: APP_META.name,
      icon: window.location.origin + APP_META.icon,
    },
    redirectTo: '/',
    onFinish,
    onCancel,
    userSession,
  });
};

// Get user data from session
export const getUserData = () => {
  if (userSession.isUserSignedIn()) {
    return userSession.loadUserData();
  }
  return null;
};

// Disconnect wallet
export const disconnectWallet = () => {
  userSession.signUserOut();
  window.location.reload();
};

// Format STX amount (from microSTX to STX)
export const formatSTX = (microSTX: number): string => {
  return (microSTX / 1000000).toFixed(6);
};

// Shorten address for display (ST1PKQ...VWF7H5)
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};
