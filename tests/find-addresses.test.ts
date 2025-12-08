/**
 * Run this test ONCE to find the correct wallet addresses
 * Then use those addresses in your contract initialization
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

describe('Find Wallet Addresses', () => {
  it('Print all wallet addresses', () => {
    const accounts = simnet.getAccounts();
    
    console.log('\n=== WALLET ADDRESSES ===');
    console.log('deployer:', accounts.get('deployer'));
    console.log('wallet_1:', accounts.get('wallet_1'));
    console.log('wallet_2:', accounts.get('wallet_2'));
    console.log('wallet_3:', accounts.get('wallet_3'));
    console.log('wallet_4:', accounts.get('wallet_4'));
    console.log('========================\n');
    
    // This test always passes - just for printing addresses
    expect(true).toBe(true);
  });
});