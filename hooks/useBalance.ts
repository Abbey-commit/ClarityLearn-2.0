import { useState, useEffect } from 'react';

export const useBalance = (address: string) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!address) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    
    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/balance/${address}`);
        
        if (!response.ok) {
          if (response.status === 429) {
            console.warn('⚠️ Rate limited, using cached balance');
            return; // Don't update, keep existing balance
          }
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted && data.stx?.balance) {
          const microStx = parseInt(data.stx.balance, 10);
          const stx = microStx / 1000000;
          setBalance(stx);
        }
      } catch (error) {
        console.error('❌ Error fetching balance:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBalance();
    
    // Poll every 30 seconds instead of 10
    const interval = setInterval(fetchBalance, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [address]);

  return { balance, isLoading };
};