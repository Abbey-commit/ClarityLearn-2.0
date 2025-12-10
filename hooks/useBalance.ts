// -----------------------------
// FILE 3: hooks/useBalance.ts
// Location: ClarityLearn-2.0/hooks/useBalance.ts
// Purpose: Hook to fetch and update STX balance
// -----------------------------

import { useState, useEffect } from 'react';
import { fetchSTXBalance } from '@/lib/stacks-api';

export const useBalance = (address: string) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!address) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    const fetchBalance = async () => {
      setIsLoading(true);
      const bal = await fetchSTXBalance(address);
      setBalance(bal);
      setIsLoading(false);
    };

    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, [address]);

  return { balance, isLoading };
};