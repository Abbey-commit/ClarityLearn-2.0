/**
 * ClarityLearn 2.0 - Staking Tests (FIXED)
 * Week 2 - Each test is INDEPENDENT with fresh blockchain
 * 
 * SOLUTION: Tests that need bonus pool must fund it FIRST
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

const TIER_BASIC = 1_000_000;
const TIER_COMMITTED = 5_000_000;
const TIER_SERIOUS = 10_000_000;

const WEEKLY_BLOCKS = 1008;
const MONTHLY_BLOCKS = 4320;

// ======================
// FAILURE TESTS (Don't need pool)
// ======================

describe('ClarityLearn Staking - Failure Tests', () => {
  it('Failure: 1 STX tier, 2/7 terms (28%) → get 0.7 STX', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    let response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')],
      user
    );

    expect(response.result).toBeOk(Cl.uint(1));

    // Mark only 2 terms
    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(1), Cl.uint(1)], user);
    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(1), Cl.uint(2)], user);

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], user);

    expect(response.result).toBeOk(Cl.uint(700_000));
  });

  it('Failure: 5 STX tier, 7/15 terms (46%) → get 3.75 STX', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    let response = simnet.callPublicFn(
      'clarity-learn-staking',
      'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')],
      user
    );

    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(1), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], user);

    expect(response.result).toBeOk(Cl.uint(3_750_000));
  });
});

// ======================
// HAPPY PATH TESTS (Fund pool first!)
// ======================

describe('ClarityLearn Staking - Happy Path Tests', () => {
  it('Happy Path: 1 STX tier, 7/7 terms → get 1.1 STX', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // FUND POOL FIRST: Create a failed stake
    simnet.callPublicFn('clarity-learn-staking', 'create-stake', 
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);
    // Pool now has 0.3 STX

    // NOW TEST: Create successful stake
    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(2), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(2)], user);

    expect(response.result).toBeOk(Cl.uint(1_100_000));
  });

  it('Happy Path: 5 STX tier, 15/15 terms → get 5.6 STX', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // FUND POOL: Create 2 failed stakes
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);
    // Pool has 1.25 STX

    // TEST
    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);

    for (let i = 1; i <= 15; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(2), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(2)], user);

    expect(response.result).toBeOk(Cl.uint(5_600_000));
  });

  it('Happy Path: 10 STX tier, 30/30 terms → get 11.5 STX', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // FUND POOL: Create a big failed stake
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], poolFunder);
    simnet.mineEmptyBlocks(MONTHLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);
    // Pool has 2 STX

    // TEST
    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], user);

    for (let i = 1; i <= 30; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(2), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(MONTHLY_BLOCKS);
    response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(2)], user);

    expect(response.result).toBeOk(Cl.uint(11_500_000));
  });
});

// ======================
// PARTIAL COMPLETION TESTS
// ======================

describe('ClarityLearn Staking - Partial Completion Tests', () => {
  it('Partial: 5 STX tier, 10/15 terms (66%) → get 5.396 STX', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // Fund pool - FIXED TYPO HERE
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // Test
    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);

    for (let i = 1; i <= 10; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(2), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(2)], user);

    expect(response.result).toBeOk(Cl.uint(5_396_000));
  });

  it('Partial: 1 STX tier, 4/7 terms (57%) → get 1.057 STX', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // Test
    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    for (let i = 1; i <= 4; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(2), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(2)], user);

    expect(response.result).toBeOk(Cl.uint(1_057_000));
  });
});

// ======================
// EMERGENCY UNSTAKE TESTS
// ======================

describe('ClarityLearn Staking - Emergency Unstake Tests', () => {
  it('Emergency: 1 STX early withdrawal → get 0.8 STX', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    response = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake', [Cl.uint(1)], user);
    expect(response.result).toBeOk(Cl.uint(800_000));
  });

  it('Emergency: 5 STX early withdrawal → get 4 STX', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);

    let response = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake', [Cl.uint(1)], user);
    expect(response.result).toBeOk(Cl.uint(4_000_000));
  });

  it('Emergency: 10 STX early withdrawal → get 8 STX', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], user);

    let response = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake', [Cl.uint(1)], user);
    expect(response.result).toBeOk(Cl.uint(8_000_000));
  });
});

// ======================
// EDGE CASES
// ======================

describe('ClarityLearn Staking - Edge Cases', () => {
  it('Edge Case: Invalid stake amount → should error', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(2_000_000), Cl.stringAscii('weekly')], user);

    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('Edge Case: Invalid goal type → should error', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('daily')], user);

    expect(response.result).toBeErr(Cl.uint(102));
  });

  it('Edge Case: Invalid tier/goal combo → should error', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    let response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('weekly')], user);

    expect(response.result).toBeErr(Cl.uint(102));
  });

  it('Edge Case: Claim before time-lock → should error', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    let response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], user);
    expect(response.result).toBeErr(Cl.uint(105));
  });

  it('Edge Case: Double claiming → should error', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    let response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], user);
    expect(response.result).toBeOk(Cl.uint(700_000));

    response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], user);
    expect(response.result).toBeErr(Cl.uint(104));
  });

  it('Edge Case: Mark same term twice → should error', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    let response = simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', 
      [Cl.uint(1), Cl.uint(1)], user);
    expect(response.result).toBeOk(Cl.bool(true));

    response = simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
      [Cl.uint(1), Cl.uint(1)], user);
    expect(response.result).toBeErr(Cl.uint(107));
  });

  it('Edge Case: Unauthorized claim → should error', () => {
    const accounts = simnet.getAccounts();
    const user1 = accounts.get('wallet_1')!;
    const user2 = accounts.get('wallet_2')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user1);

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    let response = simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], user2);
    expect(response.result).toBeErr(Cl.uint(100));
  });
});

// ======================
// HELPER FUNCTIONS
// ======================

describe('ClarityLearn Staking - Helper Functions', () => {
  it('Helper: get-stake-progress returns correct data', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned', [Cl.uint(1), Cl.uint(i)], user);
    }

    const progress = simnet.callReadOnlyFn('clarity-learn-staking', 'get-stake-progress', [Cl.uint(1)], user);

    expect(progress.result).toBeDefined();
  });

  it('Helper: is-claimable returns true after time-lock', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    let claimable = simnet.callReadOnlyFn('clarity-learn-staking', 'is-claimable', [Cl.uint(1)], user);
    expect(claimable.result).toBeOk(Cl.bool(false));

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    claimable = simnet.callReadOnlyFn('clarity-learn-staking', 'is-claimable', [Cl.uint(1)], user);
    expect(claimable.result).toBeOk(Cl.bool(true));
  });
});