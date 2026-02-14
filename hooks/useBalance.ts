import { useState, useEffect } from 'react';

export const useBalance = (address: string) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      console.log('⚠️ No address provided to useBalance');
      setBalance(0);
      return;
    }

    let isMounted = true;

    const fetchBalance = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);

      // Use our Next.js API route instead of calling Hiro API directly
      // This avoids CORS issues
      const apiUrl = `/api/balance/${address}`;
      
      console.log('🟢 Fetching balance for:', address);
      console.log('🟢 Using API route:', apiUrl);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ API error:', response.status, errorData);
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Balance data received:', data);

        if (!isMounted) return;

        // Parse the balance from microSTX to STX
        // The API returns balance in microSTX (1 STX = 1,000,000 microSTX)
        const balanceInMicroStx = parseInt(data.balance || '0');
        const balanceInStx = balanceInMicroStx / 1000000;

        console.log('💰 Balance:', {
          microSTX: balanceInMicroStx,
          STX: balanceInStx
        });

        setBalance(balanceInStx);
        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;

        console.error('❌ Error fetching balance:', err);
        
        // Handle different error types
        if (err.name === 'AbortError') {
          setError('Request timeout: Balance fetch is taking too long');
        } else if (err.message.includes('Failed to fetch')) {
          setError('Network error: Unable to fetch balance');
        } else {
          setError(err.message || 'Failed to fetch balance');
        }
        
        setIsLoading(false);
      }
    };

    // Fetch balance immediately
    fetchBalance();

    // Set up polling to refresh balance every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        fetchBalance();
      }
    }, 30000); // 30 seconds

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [address]);

  return { balance, isLoading, error };
};