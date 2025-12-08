/**
 * ClarityLearn 2.0 - Fuzz Test: Random Stake Amounts
 * Tests random STX inputs from 0 to 100 STX to ensure proper validation
 * Week 3 - Day 1: Fuzz Testing Suite
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

// Valid tier amounts (from contract constants)
const TIER_BASIC = 1_000_000;      // 1 STX
const TIER_COMMITTED = 5_000_000;  // 5 STX
const TIER_SERIOUS = 10_000_000;   // 10 STX

// Generate random STX amount in microSTX (0 to 100 STX)
function randomStxAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1_000_000;
}

// Generate random invalid amount (not matching any tier)
function randomInvalidAmount(): number {
  const invalidRanges = [
    { min: 0, max: 0 },           // 0 STX
    { min: 2, max: 4 },           // 2-4 STX
    { min: 6, max: 9 },           // 6-9 STX
    { min: 11, max: 100 },        // 11-100 STX
  ];
  
  const range = invalidRanges[Math.floor(Math.random() * invalidRanges.length)];
  return randomStxAmount(range.min, range.max);
}

describe('ClarityLearn Staking - Fuzz: Random Stake Amounts', () => {
  
  // ======================
  // VALID TIER TESTS (15 tests)
  // ======================
  
  it('Fuzz #1: Accept exactly 1 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeOk(Cl.uint(1));
  });

  it('Fuzz #2: Accept exactly 5 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeOk(Cl.uint(1));
  });

  it('Fuzz #3: Accept exactly 10 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')],
      user
    );

    expect(response.result).toBeOk(Cl.uint(1));
  });

  it('Fuzz #4-8: Accept 5 rapid 1 STX stakes from different users', () => {
    const accounts = simnet.getAccounts();
    
    for (let i = 1; i <= 5; i++) {
      const user = accounts.get(`wallet_${i}`)!;
      
      const response = simnet.callPublicFn(
        'clarity-learn-staking',
        'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')],
        user
      );

      expect(response.result).toBeOk(Cl.uint(i));
    }
  });

  it('Fuzz #9-13: Accept 5 rapid 5 STX stakes from different users', () => {
    const accounts = simnet.getAccounts();
    
    for (let i = 1; i <= 5; i++) {
      const user = accounts.get(`wallet_${i}`)!;
      
      const response = simnet.callPublicFn(
        'clarity-learn-staking',
        'create-stake',
        [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')],
        user
      );

      expect(response.result).toBeOk(Cl.uint(i));
    }
  });

  it('Fuzz #14-18: Accept 5 rapid 10 STX stakes from different users', () => {
    const accounts = simnet.getAccounts();
    
    for (let i = 1; i <= 5; i++) {
      const user = accounts.get(`wallet_${i}`)!;
      
      const response = simnet.callPublicFn(
        'clarity-learn-staking',
        'create-stake',
        [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')],
        user
      );

      expect(response.result).toBeOk(Cl.uint(i));
    }
  });

  // ======================
  // INVALID AMOUNT TESTS (20 tests)
  // ======================

  it('Fuzz #19: Reject 0 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(0), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
  });

  it('Fuzz #20: Reject 2 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(2_000_000), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #21: Reject 3 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(3_000_000), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #22: Reject 4 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(4_000_000), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #23: Reject 6 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(6_000_000), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #24: Reject 7 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(7_000_000), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #25: Reject 8 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(8_000_000), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #26: Reject 9 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(9_000_000), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #27: Reject 11 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(11_000_000), Cl.stringAscii('monthly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #28: Reject 15 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(15_000_000), Cl.stringAscii('monthly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #29: Reject 20 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(20_000_000), Cl.stringAscii('monthly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #30: Reject 50 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(50_000_000), Cl.stringAscii('monthly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Fuzz #31: Reject 100 STX stake', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(100_000_000), Cl.stringAscii('monthly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(101));
  });

  // ======================
  // RANDOM FUZZING (15 tests)
  // ======================

  it('Fuzz #32-36: Random invalid amounts should all fail', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    for (let i = 0; i < 5; i++) {
      const invalidAmount = randomInvalidAmount();
      
      const response = simnet.callPublicFn(
        'clarity-learn-staking',
        'create-stake',
        [Cl.uint(invalidAmount), Cl.stringAscii('weekly')],
        user
      );

      expect(response.result).toBeErr(Cl.uint(101));
    }
  });

  it('Fuzz #37-41: Fractional STX amounts (invalid) should fail', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const fractionalAmounts = [
      1_500_000,  // 1.5 STX
      2_750_000,  // 2.75 STX
      4_250_000,  // 4.25 STX
      7_800_000,  // 7.8 STX
      9_999_999,  // 9.999999 STX
    ];

    fractionalAmounts.forEach(amount => {
      const response = simnet.callPublicFn(
        'clarity-learn-staking',
        'create-stake',
        [Cl.uint(amount), Cl.stringAscii('weekly')],
        user
      );

      expect(response.result).toBeErr(Cl.uint(101));
    });
  });

  it('Fuzz #42-46: Edge case amounts near valid tiers', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const edgeCases = [
      999_999,     // Just below 1 STX
      1_000_001,   // Just above 1 STX
      4_999_999,   // Just below 5 STX
      5_000_001,   // Just above 5 STX
      9_999_999,   // Just below 10 STX
    ];

    edgeCases.forEach(amount => {
      const response = simnet.callPublicFn(
        'clarity-learn-staking',
        'create-stake',
        [Cl.uint(amount), Cl.stringAscii('weekly')],
        user
      );

      expect(response.result).toBeErr(Cl.uint(101));
    });
  });

  // ======================
  // TIER/GOAL MISMATCH (4 tests)
  // ======================

  it('Fuzz #47: Reject 1 STX with monthly goal', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('monthly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(102)); // ERR-INVALID-GOAL-TYPE
  });

  it('Fuzz #48: Reject 5 STX with monthly goal', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('monthly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(102));
  });

  it('Fuzz #49: Reject 10 STX with weekly goal', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(102));
  });

  it('Fuzz #50: Reject invalid goal type', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('daily')],
      user
    );

    expect(response.result).toBeErr(Cl.uint(102));
  });
});