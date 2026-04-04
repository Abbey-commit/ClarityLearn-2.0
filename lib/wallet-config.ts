import { connect, disconnect } from '@stacks/connect';

const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};


// Network configuration based on environment
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
export const STACKS_API_URL = process.env.NEXT_PUBLIC_STACKS_API || 'https://api.testnet.hiro.so';

// Contract addresses from environment
export const CONTRACTS = {
  core: process.env.NEXT_PUBLIC_CORE_CONTRACT || '',
  rewards: process.env.NEXT_PUBLIC_REWARDS_CONTRACT || '',
  staking: process.env.NEXT_PUBLIC_STACKING_CONTRACT || '',
};

// App metadata
export const APP_META = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'ClarityLearn 2.0',
  icon: process.env.NEXT_PUBLIC_APP_ICON || '/logo.png',
};

// Helper function to extract STX address from Leather wallet response
const extractSTXAddress = (addresses: any): { testnet: string; mainnet: string } => {
  console.log('🔍 Extracting STX address from:', addresses);
  
  // New v8 format: addresses is an object with 'stx' array
  if (addresses && addresses.stx && Array.isArray(addresses.stx)) {
    console.log('📋 Found addresses.stx array');
    
    const stxAddress = addresses.stx[0]; // Get first STX address
    if (stxAddress && stxAddress.address) {
      const address = stxAddress.address;
      console.log('✅ Extracted address:', address);
      
      // Determine if it's testnet or mainnet based on prefix
      const isTestnet = address.startsWith('ST');
      const isMainnet = address.startsWith('SP');
      
      return {
        testnet: isTestnet ? address : '',
        mainnet: isMainnet ? address : '',
      };
    }
  }
  
  // Fallback: Old format (array with symbol)
  if (Array.isArray(addresses)) {
    console.log('📋 Addresses is an array (old format), searching for STX...');
    
    const stxAddress = addresses.find((addr: any) => addr.symbol === 'STX');
    console.log('🎯 Found STX address object:', stxAddress);
    
    if (stxAddress && stxAddress.address) {
      const address = stxAddress.address;
      console.log('✅ Extracted address:', address);
      
      const isTestnet = address.startsWith('ST');
      const isMainnet = address.startsWith('SP');
      
      return {
        testnet: isTestnet ? address : '',
        mainnet: isMainnet ? address : '',
      };
    }
  }
  
  console.error('❌ Could not extract STX address from:', addresses);
  return { testnet: '', mainnet: '' };
};

// Wallet connection function using NEW v8 API
export const connectWallet = async (onFinish: (userData: any) => void, onCancel?: () => void) => {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('🔵 Initiating wallet connection...');
    console.log('🔵 Network:', NETWORK);
    console.log('🔵 API URL:', STACKS_API_URL);
    console.log('🔵 Is Mobile:', isMobile());
    
    // On mobile, guide users to install mobile wallet app
    if (isMobile()) {
      const userConfirmed = window.confirm(
        'Mobile wallet connection requires the Xverse mobile app.\n\n' +
        'Do you have Xverse installed?\n\n' +
        'YES = Continue to connect\n' +
        'NO = Get installation instructions'
      );
      
      if (!userConfirmed) {
        // Show installation instructions
        alert(
          'To use ClarityLearn on mobile:\n\n' +
          '1. Download Xverse app from App Store or Google Play\n' +
          '2. Create wallet and switch to testnet\n' +
          '3. Open ClarityLearn in Xverse\'s built-in browser\n\n' +
          'Or use desktop browser with Leather extension'
        );
        if (onCancel) onCancel();
        return;
      }
    }
    
    // NEW v8 API: connect() returns addresses directly
    const response = await connect();
    
    console.log('✅ Wallet connection successful!');
    console.log('📦 Response:', response);

    // Extract STX addresses from response
    if (response && response.addresses) {
      const stxAddresses = extractSTXAddress(response.addresses);
      console.log('🔍 Extracted addresses:', stxAddresses);
      
      // Build userData in the format your app expects
      const userData = {
        profile: {
          stxAddress: {
            testnet: stxAddresses.testnet,
            mainnet: stxAddresses.mainnet,
          }
        },
        network: NETWORK,
      };
      
      console.log('✅ Final userData:', userData);
      
      // NOTE: @stacks/connect v8 stores data in localStorage automatically
      // But we also store it in our format for compatibility
      localStorage.setItem('stacks-connect', JSON.stringify(userData));
      
      onFinish(userData);
    } else {
      console.error('❌ No addresses in response');
      onFinish({});
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
    
    if (isMobile()) {
      alert(
        'Connection failed!\n\n' +
        'For mobile:\n' +
        '1. Download Xverse mobile app\n' +
        '2. Open ClarityLearn inside the Xverse app browser\n\n' +
        'Or use desktop browser instead'
      );
    }
    
    if (onCancel) onCancel();
  }
};

// Disconnect wallet
export const disconnectWallet = () => {
  disconnect();
  localStorage.removeItem('stacks-connect');
};

// Check connection status
export const checkConnection = () => {
  // Check if we have stored connection data
  const storedData = localStorage.getItem('stacks-connect');
  return !!storedData;
};

// Get user data from local storage
export const getUserData = () => {
  if (typeof window === 'undefined') return null;
  
  const storedData = localStorage.getItem('stacks-connect');
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (e) {
      console.error('Failed to parse stored data:', e);
      return null;
    }
  }
  
  return null;
};

// Utility function to shorten address for display
export const shortenAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Utility function to format STX amounts for display
export const formatSTX = (amount: number | string, decimals: number = 2): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  
  // Convert from microSTX to STX if needed (divide by 1,000,000)
  const stxAmount = num >= 1000000 ? num / 1000000 : num;
  
  return stxAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};