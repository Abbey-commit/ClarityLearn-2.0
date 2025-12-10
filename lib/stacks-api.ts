// -----------------------------
// FILE NAME: lib/stacks-api.ts
// Location: ClarityLearn-2.0/lib/stacks-api.ts
// Purpose: Blockchain data fetching utilities
// -----------------------------

import { STACKS_API_URL, NETWORK } from './wallet-config';

// Fetch STX balance for an address
export async function fetchSTXBalance(address: string): Promise<number> {
  try {
    const response = await fetch(
      `${STACKS_API_URL}/extended/v1/address/${address}/stx`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    
    const data = await response.json();
    return parseInt(data.balance) || 0;
  } catch (error) {
    console.error('Error fetching STX balance:', error);
    return 0;
  }
}

// Fetch account info (balance, nonce, etc)
export async function fetchAccountInfo(address: string) {
  try {
    const response = await fetch(
      `${STACKS_API_URL}/v2/accounts/${address}?proof=0`
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