import { STACKS_API_URL, NETWORK } from './wallet-config';

// Fetch STX balance for an address
export async function fetchSTXBalance(address: string, network: string): Promise<number> {
  console.log('🟢 fetchSTXBalance called with:', { address, network });
  console.log('🟢 About to fetch from API...');
  if (!address) {
    console.log('No address provided to fetchSTXBalance');
    return 0;
  }
  
  console.log('Fetching balance for:', address);
  console.log('Using API URL:', STACKS_API_URL);
  
  try {
    const url = `${STACKS_API_URL}/extended/v1/address/${address}/stx`;
    console.log('Full URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return 0;
    }
    
    const data = await response.json();
    console.log('Balance data:', data);
    
    const balance = parseInt(data.balance) || 0;
    console.log('Parsed balance:', balance, 'microSTX');
    
    return balance;
  } catch (error) {
    console.error('Error fetching STX balance:', error);
    return 0;
  }
}

// Fetch account info (balance, nonce, etc)
export async function fetchAccountInfo(address: string) {
  if (!address) return null;
  
  try {
    const response = await fetch(
      `${STACKS_API_URL}/v2/accounts/${address}?proof=0`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch account info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
}

// Fetch transaction status
export async function fetchTransactionStatus(txId: string) {
  try {
    const response = await fetch(
      `${STACKS_API_URL}/extended/v1/tx/${txId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch transaction');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

// Wait for transaction confirmation
export async function waitForTransaction(
  txId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<any> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const tx = await fetchTransactionStatus(txId);
    
    if (tx && tx.tx_status === 'success') {
      return tx;
    }
    
    if (tx && tx.tx_status === 'abort_by_response') {
      throw new Error('Transaction failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }
  
  throw new Error('Transaction confirmation timeout');
}