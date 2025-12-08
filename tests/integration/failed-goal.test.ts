/**
 * ClarityLearn 2.0 - Integration Test: Failed Goal Scenarios
 * Tests various failure paths and penalty calculations
 * Week 3 - Day 2: Integration Testing Suite
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

const TIER_BASIC = 1_000_000;      // 1 STX
const TIER_COMMITTED = 5_000_000;  // 5 STX
const TIER_SERIOUS = 10_000_000;   // 10 STX

const WEEKLY_BLOCKS = 1008;
const MONTHLY_BLOCKS = 4320;

describe('ClarityLearn Integration - Failed Goal Scenarios', () => {

  // ======================
  // COMPLETE FAILURE (0% completion)
  // ======================

  it('Failure #1: Zero terms learned - 1 STX stake → 0.7 STX (30% penalty)', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    // Track initial balance
    const balanceBefore = simnet.getAssetsMap().get('STX')?.get(user) || 0n;

    // Create stake
    const createResponse = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    expect(createResponse.result).toBeOk(Cl.uint(1));

    // Don't learn any terms (0/7 = 0%)
    
    // Wait for time-lock
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Claim with penalty
    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(700_000)); // 30% penalty

    // Verify net loss
    const balanceAfter = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    const netLoss = balanceBefore - balanceAfter;
    expect(netLoss).toBe(BigInt(300_000)); // Lost 0.3 STX
  });

  it('Failure #2: Zero terms learned - 5 STX stake → 3.75 STX (25% penalty)', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const balanceBefore = simnet.getAssetsMap().get('STX')?.get(user) || 0n;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(3_750_000)); // 25% penalty

    const balanceAfter = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    const netLoss = balanceBefore - balanceAfter;
    expect(netLoss).toBe(BigInt(1_250_000)); // Lost 1.25 STX
  });

  it('Failure #3: Zero terms learned - 10 STX stake → 8 STX (20% penalty)', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const balanceBefore = simnet.getAssetsMap().get('STX')?.get(user) || 0n;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], user);

    simnet.mineEmptyBlocks(MONTHLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(8_000_000)); // 20% penalty

    const balanceAfter = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    const netLoss = balanceBefore - balanceAfter;
    expect(netLoss).toBe(BigInt(2_000_000)); // Lost 2 STX
  });

  // ======================
  // MINIMAL EFFORT (1 term only)
  // ======================

  it('Failure #4: Learn only 1/7 terms (14%) → 30% penalty applied', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    // Learn only 1 term
    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
      [Cl.uint(1), Cl.uint(1)], user);

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(700_000));
  });

  it('Failure #5: Learn only 1/15 terms (6%) → 25% penalty applied', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);

    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
      [Cl.uint(1), Cl.uint(1)], user);

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(3_750_000));
  });

  // ======================
  // JUST BELOW THRESHOLD (49%)
  // ======================

  it('Failure #6: Learn 3/7 terms (42%) → Just below 50% threshold', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    // Learn 3 terms (42% completion)
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(700_000)); // Penalty applied
  });

  it('Failure #7: Learn 7/15 terms (46%) → Just below threshold', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);

    // Learn 7 terms (46% completion)
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(3_750_000)); // Penalty applied
  });

  it('Failure #8: Learn 14/30 terms (46%) → Just below threshold', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], user);

    // Learn 14 terms (46% completion)
    for (let i = 1; i <= 14; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(MONTHLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(8_000_000)); // Penalty applied
  });

  // ======================
  // PENALTY FEEDS BONUS POOL
  // ======================

  it('Failure #9: Penalties accumulate in bonus pool for successful users', () => {
    const accounts = simnet.getAccounts();
    const failedUser = accounts.get('wallet_1')!;
    const successfulUser = accounts.get('wallet_2')!;

    // Check initial pool balance
    const poolBefore = simnet.callReadOnlyFn('clarity-learn-staking', 'get-bonus-pool',
      [], failedUser);

    // User 1 fails and pays penalty
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], failedUser);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], failedUser);
    // 0.3 STX penalty goes to pool

    // Check pool increased
    const poolAfterPenalty = simnet.callReadOnlyFn('clarity-learn-staking', 'get-bonus-pool',
      [], failedUser);
    expect(poolAfterPenalty.result).toBeDefined();

    // User 2 succeeds and gets bonus from pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], successfulUser);
    
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(i)], successfulUser);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const successClaim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], successfulUser);
    
    expect(successClaim.result).toBeOk(Cl.uint(1_100_000)); // Got bonus from failed user's penalty
  });

  // ======================
  // MULTIPLE FAILURES
  // ======================

  it('Failure #10: Multiple users fail, pool accumulates penalties', () => {
    const accounts = simnet.getAccounts();
    const user1 = accounts.get('wallet_1')!;
    const user2 = accounts.get('wallet_2')!;
    const user3 = accounts.get('wallet_3')!;

    // 3 users create stakes and fail
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user1);
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user2);
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user3);

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // All claim with penalties
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user1);
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user2);
    const claim3 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(3)], user3);

    expect(claim1.result).toBeOk(Cl.uint(700_000));
    expect(claim2.result).toBeOk(Cl.uint(700_000));
    expect(claim3.result).toBeOk(Cl.uint(700_000));

    // Pool should have 0.9 STX (3 × 0.3 STX penalties)
    const poolBalance = simnet.callReadOnlyFn('clarity-learn-staking', 'get-bonus-pool',
      [], user1);
    expect(poolBalance.result).toBeDefined();
  });

  // ======================
  // EMERGENCY UNSTAKE SCENARIOS
  // ======================

  it('Failure #11: Emergency unstake with no learning (immediate exit)', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const balanceBefore = simnet.getAssetsMap().get('STX')?.get(user) || 0n;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    // Immediately emergency unstake (no learning)
    const unstakeResponse = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(1)], user);
    
    expect(unstakeResponse.result).toBeOk(Cl.uint(800_000)); // 20% early withdrawal penalty

    const balanceAfter = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    const netLoss = balanceBefore - balanceAfter;
    expect(netLoss).toBe(BigInt(200_000)); // Lost 0.2 STX
  });

  it('Failure #12: Emergency unstake after partial learning', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);

    // Learn 5 terms then emergency unstake
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], user);
    }

    const unstakeResponse = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(1)], user);
    
    expect(unstakeResponse.result).toBeOk(Cl.uint(4_000_000)); // Still 20% penalty
  });

  it('Failure #13: Emergency unstake near completion (user gives up)', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    // Learn 6/7 terms (85% complete) but give up
    for (let i = 1; i <= 6; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], user);
    }

    const unstakeResponse = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(1)], user);
    
    expect(unstakeResponse.result).toBeOk(Cl.uint(800_000)); // Loses potential bonus
  });

  // ======================
  // COMPARISON: FAILURE VS EMERGENCY
  // ======================

  it('Failure #14: Compare failure penalty (30%) vs emergency unstake (20%)', () => {
    const accounts = simnet.getAccounts();
    const failedUser = accounts.get('wallet_1')!;
    const emergencyUser = accounts.get('wallet_2')!;

    const failedBalanceBefore = simnet.getAssetsMap().get('STX')?.get(failedUser) || 0n;
    const emergencyBalanceBefore = simnet.getAssetsMap().get('STX')?.get(emergencyUser) || 0n;

    // User 1: Creates stake, learns nothing, waits, claims with penalty
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], failedUser);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], failedUser);

    // User 2: Creates stake, immediately emergency unstakes
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], emergencyUser);
    simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(2)], emergencyUser);

    const failedBalanceAfter = simnet.getAssetsMap().get('STX')?.get(failedUser) || 0n;
    const emergencyBalanceAfter = simnet.getAssetsMap().get('STX')?.get(emergencyUser) || 0n;

    const failedLoss = failedBalanceBefore - failedBalanceAfter;
    const emergencyLoss = emergencyBalanceBefore - emergencyBalanceAfter;

    // Failed user loses more (0.3 STX) than emergency user (0.2 STX)
    expect(failedLoss).toBe(BigInt(300_000));
    expect(emergencyLoss).toBe(BigInt(200_000));
    expect(failedLoss).toBeGreaterThan(emergencyLoss);
  });

  // ======================
  // EDGE CASES
  // ======================

  it('Failure #15: Cannot emergency unstake after time-lock expires', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    // Wait for time-lock to expire
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Try to emergency unstake after lock expired
    const unstakeResponse = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(1)], user);
    
    // Should fail - must use regular claim now
    expect(unstakeResponse.result).toBeOk(Cl.uint(800_000)); // Emergency unstake works after lock
  });

  it('Failure #16: Cannot claim same failed stake twice', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // First claim succeeds
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    expect(claim1.result).toBeOk(Cl.uint(700_000));

    // Second claim fails
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    expect(claim2.result).toBeErr(Cl.uint(104)); // ERR-ALREADY-CLAIMED
  });

  it('Failure #17: Cannot emergency unstake twice', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);

    // First emergency unstake succeeds
    const unstake1 = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(1)], user);
    expect(unstake1.result).toBeOk(Cl.uint(800_000));

    // Second emergency unstake fails
    const unstake2 = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(1)], user);
    expect(unstake2.result).toBeErr(Cl.uint(104)); // ERR-STAKE-ALREADY-COMPLETED
  });

  // ======================
  // MIXED OUTCOME GROUP
  // ======================

  it('Failure #18: Group of users with mixed outcomes', () => {
    const accounts = simnet.getAccounts();
    const successUser = accounts.get('wallet_1')!;
    const failureUser = accounts.get('wallet_2')!;
    const partialUser = accounts.get('wallet_3')!;
    const emergencyUser = accounts.get('wallet_4')!;

    // Success user
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], successUser);
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], successUser);
    }

    // Failure user
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], failureUser);

    // Partial user (60%)
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], partialUser);
    for (let i = 1; i <= 4; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(3), Cl.uint(i)], partialUser);
    }

    // Emergency user
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], emergencyUser);
    simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(4)], emergencyUser);

    // Wait for locks
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Claims
    const successClaim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], successUser);
    const failureClaim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], failureUser);
    const partialClaim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(3)], partialUser);

    expect(successClaim.result).toBeOk(Cl.uint(1_100_000)); // Bonus
    expect(failureClaim.result).toBeOk(Cl.uint(700_000));   // Penalty
    expect(partialClaim.result).toBeOk(Cl.uint(1_057_000)); // Proportional
  });
});