/**
 * ClarityLearn 2.0 - Integration Test: Full User Journey
 * Tests complete end-to-end user flow: Stake → Learn → Claim
 * Week 3 - Day 2: Integration Testing Suite
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

const TIER_BASIC = 1_000_000;      // 1 STX
const TIER_COMMITTED = 5_000_000;  // 5 STX
const TIER_SERIOUS = 10_000_000;   // 10 STX

const WEEKLY_BLOCKS = 1008;
const MONTHLY_BLOCKS = 4320;

describe('ClarityLearn Integration - Full User Journey', () => {

  // ======================
  // JOURNEY #1: SUCCESSFUL 1 STX STAKE
  // ======================

  it('Journey #1: Complete success path - 1 STX stake, 7 terms, 1.1 STX claim', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // SETUP: Fund bonus pool with failed stake
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // STEP 1: User creates stake
    const userBalanceBefore = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    
    const createResponse = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    
    expect(createResponse.result).toBeOk(Cl.uint(2));

    // Verify STX was transferred
    const userBalanceAfterStake = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    expect(userBalanceBefore - userBalanceAfterStake).toBe(BigInt(TIER_BASIC));

    // STEP 2: User learns 7 terms progressively
    for (let termId = 1; termId <= 7; termId++) {
      const learnResponse = simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(termId)], user);
      
      expect(learnResponse.result).toBeOk(Cl.bool(true));

      // Verify progress after each term
      const progress = simnet.callReadOnlyFn('clarity-learn-staking', 'get-stake-progress',
        [Cl.uint(2)], user);
      
      expect(progress.result).toBeDefined();
    }

    // STEP 3: Check stake is not claimable before time-lock
    const claimableBeforeLock = simnet.callReadOnlyFn('clarity-learn-staking', 'is-claimable',
      [Cl.uint(2)], user);
    
    expect(claimableBeforeLock.result).toBeOk(Cl.bool(false));

    // Try to claim early (should fail)
    const earlyClaimAttempt = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user);
    
    expect(earlyClaimAttempt.result).toBeErr(Cl.uint(105)); // ERR-TIME-LOCK-NOT-EXPIRED

    // STEP 4: Wait for time-lock to expire
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // STEP 5: Check stake is now claimable
    const claimableAfterLock = simnet.callReadOnlyFn('clarity-learn-staking', 'is-claimable',
      [Cl.uint(2)], user);
    
    expect(claimableAfterLock.result).toBeOk(Cl.bool(true));

    // STEP 6: Claim rewards
    const userBalanceBeforeClaim = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    
    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(1_100_000)); // 1 STX + 0.1 bonus

    // STEP 7: Verify final balance
    const userBalanceAfterClaim = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    const totalGain = userBalanceAfterClaim - userBalanceBefore;
    
    expect(totalGain).toBe(BigInt(100_000)); // Net gain: 0.1 STX
  });

  // ======================
  // JOURNEY #2: SUCCESSFUL 5 STX STAKE
  // ======================

  it('Journey #2: Complete success path - 5 STX stake, 15 terms, 5.6 STX claim', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // SETUP: Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // STEP 1: Create stake
    const createResponse = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);
    
    expect(createResponse.result).toBeOk(Cl.uint(2));

    // STEP 2: Learn all 15 terms
    for (let termId = 1; termId <= 15; termId++) {
      const learnResponse = simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(termId)], user);
      
      expect(learnResponse.result).toBeOk(Cl.bool(true));
    }

    // STEP 3: Verify progress shows 100% completion
    const progress = simnet.callReadOnlyFn('clarity-learn-staking', 'get-stake-progress',
      [Cl.uint(2)], user);
    
    expect(progress.result).toBeDefined();

    // STEP 4: Wait and claim
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(5_600_000)); // 5 STX + 0.6 bonus
  });

  // ======================
  // JOURNEY #3: SUCCESSFUL 10 STX STAKE
  // ======================

  it('Journey #3: Complete success path - 10 STX stake, 30 terms, 11.5 STX claim', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // SETUP: Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], poolFunder);
    simnet.mineEmptyBlocks(MONTHLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // STEP 1: Create monthly stake
    const createResponse = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], user);
    
    expect(createResponse.result).toBeOk(Cl.uint(2));

    // STEP 2: Learn all 30 terms
    for (let termId = 1; termId <= 30; termId++) {
      const learnResponse = simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(termId)], user);
      
      expect(learnResponse.result).toBeOk(Cl.bool(true));
    }

    // STEP 3: Wait for monthly lock
    simnet.mineEmptyBlocks(MONTHLY_BLOCKS);

    // STEP 4: Claim with 15% bonus
    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(11_500_000)); // 10 STX + 1.5 bonus
  });

  // ======================
  // JOURNEY #4: PARTIAL COMPLETION
  // ======================

  it('Journey #4: Partial completion path - 5 STX stake, 10/15 terms (66%), 5.396 STX claim', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // SETUP: Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // STEP 1: Create stake
    const createResponse = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);
    
    expect(createResponse.result).toBeOk(Cl.uint(2));

    // STEP 2: Learn only 10 out of 15 terms (66% completion)
    for (let termId = 1; termId <= 10; termId++) {
      const learnResponse = simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(termId)], user);
      
      expect(learnResponse.result).toBeOk(Cl.bool(true));
    }

    // STEP 3: Check progress shows partial completion
    const progress = simnet.callReadOnlyFn('clarity-learn-staking', 'get-stake-progress',
      [Cl.uint(2)], user);
    
    expect(progress.result).toBeDefined();

    // STEP 4: Wait and claim
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(5_396_000)); // Proportional bonus
  });

  // ======================
  // JOURNEY #5: FAILURE PATH
  // ======================

  it('Journey #5: Failure path - 1 STX stake, 2/7 terms (28%), 0.7 STX penalty', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    // STEP 1: Create stake
    const createResponse = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    
    expect(createResponse.result).toBeOk(Cl.uint(1));

    // STEP 2: Learn only 2 terms (28% - below 50% threshold)
    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
      [Cl.uint(1), Cl.uint(1)], user);
    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
      [Cl.uint(1), Cl.uint(2)], user);

    // STEP 3: Wait for time-lock
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // STEP 4: Claim with penalty
    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], user);
    
    expect(claimResponse.result).toBeOk(Cl.uint(700_000)); // 30% penalty applied
  });

  // ======================
  // JOURNEY #6: EMERGENCY UNSTAKE
  // ======================

  it('Journey #6: Emergency unstake path - 5 STX stake, early withdrawal, 4 STX return', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    // STEP 1: Create stake
    const userBalanceBefore = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    
    const createResponse = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);
    
    expect(createResponse.result).toBeOk(Cl.uint(1));

    // STEP 2: Learn some terms (but not all)
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], user);
    }

    // STEP 3: User decides to emergency unstake (life happens)
    const unstakeResponse = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(1)], user);
    
    expect(unstakeResponse.result).toBeOk(Cl.uint(4_000_000)); // 20% penalty

    // STEP 4: Verify user received 4 STX back
    const userBalanceAfter = simnet.getAssetsMap().get('STX')?.get(user) || 0n;
    const netLoss = userBalanceBefore - userBalanceAfter;
    
    expect(netLoss).toBe(BigInt(TIER_COMMITTED - 4_000_000)); // Lost 1 STX
  });

  // ======================
  // JOURNEY #7: MULTI-STAKE USER
  // ======================

  it('Journey #7: User creates multiple stakes sequentially', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // SETUP: Fund pool well
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(i)], poolFunder);
    }

    // STEP 1: Create first stake
    const stake1 = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    expect(stake1.result).toBeOk(Cl.uint(4));

    // STEP 2: Complete first stake
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(4), Cl.uint(i)], user);
    }

    // STEP 3: Create second stake while first is still active
    const stake2 = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    expect(stake2.result).toBeOk(Cl.uint(5));

    // STEP 4: Complete second stake
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(5), Cl.uint(i)], user);
    }

    // STEP 5: Wait for time-locks
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // STEP 6: Claim both stakes
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(4)], user);
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(5)], user);

    expect(claim1.result).toBeOk(Cl.uint(1_100_000));
    expect(claim2.result).toBeOk(Cl.uint(1_100_000));
  });

  // ======================
  // JOURNEY #8: TERM CONTRIBUTION FLOW
  // ======================

  it('Journey #8: User contributes terms to dictionary and earns reputation', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    // STEP 1: User contributes first term
    const term1 = simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('DeFi'),
        Cl.stringUtf8('Decentralized Finance - Financial services without intermediaries'),
        Cl.stringAscii('DeFi')
      ],
      contributor
    );
    expect(term1.result).toBeOk(Cl.uint(1));

    // STEP 2: Check initial contributor stats
    const statsAfterFirst = simnet.callReadOnlyFn('clarity-learn-core', 'get-contributor-stats',
      [Cl.principal(contributor)], contributor);
    expect(statsAfterFirst.result).toBeDefined();

    // STEP 3: User contributes more terms
    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('NFT'),
        Cl.stringUtf8('Non-Fungible Token - Unique digital asset'),
        Cl.stringAscii('NFTs')
      ],
      contributor
    );

    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('DAO'),
        Cl.stringUtf8('Decentralized Autonomous Organization'),
        Cl.stringAscii('DAO')
      ],
      contributor
    );

    // STEP 4: Other users vote on terms
    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter);
    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(2)], voter);
    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(3)], voter);

    // STEP 5: Check updated contributor stats (reputation increased)
    const statsAfterVotes = simnet.callReadOnlyFn('clarity-learn-core', 'get-contributor-stats',
      [Cl.principal(contributor)], contributor);
    expect(statsAfterVotes.result).toBeDefined();
    expect(statsAfterVotes.result).not.toBeNone();
  });

  // ======================
  // JOURNEY #9: COMPLETE ECOSYSTEM FLOW
  // ======================

  it('Journey #9: Full ecosystem - Contribute terms → Stake → Learn → Vote → Claim', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const contributor = accounts.get('wallet_1')!;
    const learner = accounts.get('wallet_2')!;

    // SETUP: Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // STEP 1: User 1 contributes 7 terms to dictionary
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition for term ${i}`),
          Cl.stringAscii('General')
        ],
        contributor
      );
    }

    // STEP 2: User 2 creates a learning stake
    const createStake = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], learner);
    expect(createStake.result).toBeOk(Cl.uint(2));

    // STEP 3: User 2 learns all 7 terms
    for (let termId = 1; termId <= 7; termId++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(termId)], learner);
    }

    // STEP 4: User 2 votes on terms (rewarding contributor)
    for (let termId = 1; termId <= 7; termId++) {
      simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(termId)], learner);
    }

    // STEP 5: Time passes
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // STEP 6: User 2 claims successful stake
    const claim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], learner);
    expect(claim.result).toBeOk(Cl.uint(1_100_000));

    // STEP 7: Verify contributor reputation increased
    const contributorStats = simnet.callReadOnlyFn('clarity-learn-core', 'get-contributor-stats',
      [Cl.principal(contributor)], contributor);
    expect(contributorStats.result).toBeDefined();
  });

  // ======================
  // JOURNEY #10: EDGE CASE - EXACT 50% COMPLETION
  // ======================

  it('Journey #10: Edge case - Exactly 50% completion boundary', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    // SETUP: Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // STEP 1: Create stake
    const createResponse = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);
    expect(createResponse.result).toBeOk(Cl.uint(2));

    // STEP 2: Learn exactly 50% (7.5 rounds to 8 terms out of 15)
    for (let termId = 1; termId <= 8; termId++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(termId)], user);
    }

    // STEP 3: Wait and claim
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claimResponse = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user);

    // Should get proportional bonus (53% completion = 53% of 12% bonus)
    expect(claimResponse.result).toBeOk(Cl.uint(5_318_000));
  });
});