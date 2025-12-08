/**
 * ClarityLearn 2.0 - Fuzz Test: Concurrent Claims
 * Tests multiple users claiming stakes simultaneously to verify:
 * - Bonus pool distribution correctness
 * - No double-spending from pool
 * - Proper isolation between user claims
 * Week 3 - Day 1: Fuzz Testing Suite
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

const TIER_BASIC = 1_000_000;      // 1 STX
const TIER_COMMITTED = 5_000_000;  // 5 STX
const TIER_SERIOUS = 10_000_000;   // 10 STX

const WEEKLY_BLOCKS = 1008;
const MONTHLY_BLOCKS = 4320;

describe('ClarityLearn Staking - Fuzz: Concurrent Claims', () => {

  // ======================
  // SIMULTANEOUS SUCCESS CLAIMS
  // ======================

  it('Concurrent #1: 3 users claim successful 1 STX stakes simultaneously', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    
    // Fund pool: Create 3 failed stakes to have 0.9 STX in pool
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(i)], poolFunder);
    }

    // Create 3 successful stakes from different users
    const users = [
      accounts.get('wallet_1')!,
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!
    ];

    users.forEach((user, index) => {
      const stakeId = 4 + index;
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      
      // Learn all 7 terms
      for (let termId = 1; termId <= 7; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(stakeId), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Claim all 3 stakes in same block
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(4)], users[0]);
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(5)], users[1]);
    const claim3 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(6)], users[2]);

    // All should succeed and get 1.1 STX (1 + 0.1 bonus)
    expect(claim1.result).toBeOk(Cl.uint(1_100_000));
    expect(claim2.result).toBeOk(Cl.uint(1_100_000));
    expect(claim3.result).toBeOk(Cl.uint(1_100_000));
  });

  it('Concurrent #2: 5 users claim successful 5 STX stakes simultaneously', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    
    // Fund pool: Create 5 failed 5 STX stakes = 6.25 STX in pool
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(i)], poolFunder);
    }

    // Create 5 successful stakes
    const users = [
      accounts.get('wallet_1')!,
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!,
      accounts.get('wallet_4')!,
      accounts.get('wallet_5')!
    ];

    users.forEach((user, index) => {
      const stakeId = 6 + index;
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user);
      
      // Learn all 15 terms
      for (let termId = 1; termId <= 15; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(stakeId), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Claim all 5 stakes simultaneously
    const claims = users.map((user, index) => 
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(6 + index)], user)
    );

    // All should succeed and get 5.6 STX (5 + 0.6 bonus)
    claims.forEach(claim => {
      expect(claim.result).toBeOk(Cl.uint(5_600_000));
    });
  });

  // ======================
  // MIXED SUCCESS/FAILURE CLAIMS
  // ======================

  it('Concurrent #3: Mix of successful and failed claims', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    
    // Fund pool with 2 failures
    for (let i = 1; i <= 2; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(i)], poolFunder);
    }

    // Create 3 stakes: 2 successful, 1 failure
    const user1 = accounts.get('wallet_1')!;
    const user2 = accounts.get('wallet_2')!;
    const user3 = accounts.get('wallet_3')!;

    // Stake 3: Success (7/7)
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user1);
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(3), Cl.uint(i)], user1);
    }

    // Stake 4: Failure (2/7)
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user2);
    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
      [Cl.uint(4), Cl.uint(1)], user2);
    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
      [Cl.uint(4), Cl.uint(2)], user2);

    // Stake 5: Success (7/7)
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user3);
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(5), Cl.uint(i)], user3);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Claim all 3 simultaneously
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(3)], user1);
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(4)], user2);
    const claim3 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(5)], user3);

    // Success claims get 1.1 STX
    expect(claim1.result).toBeOk(Cl.uint(1_100_000));
    expect(claim3.result).toBeOk(Cl.uint(1_100_000));
    
    // Failure claim gets 0.7 STX
    expect(claim2.result).toBeOk(Cl.uint(700_000));
  });

  // ======================
  // PARTIAL COMPLETION CONCURRENT CLAIMS
  // ======================

  it('Concurrent #4: Multiple partial completion claims', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    
    // Fund pool
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(i)], poolFunder);
    }

    // Create 3 partial stakes
    const users = [
      accounts.get('wallet_1')!, // 4/7 = 57%
      accounts.get('wallet_2')!, // 5/7 = 71%
      accounts.get('wallet_3')!  // 6/7 = 85%
    ];

    const termCounts = [4, 5, 6];

    users.forEach((user, index) => {
      const stakeId = 4 + index;
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      
      for (let termId = 1; termId <= termCounts[index]; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(stakeId), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Claim all 3 simultaneously
    const claims = users.map((user, index) => 
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(4 + index)], user)
    );

    // All should get proportional bonuses
    expect(claims[0].result).toBeOk(Cl.uint(1_057_000)); // 57% of 10% bonus
    expect(claims[1].result).toBeOk(Cl.uint(1_071_000)); // 71% of 10% bonus
    expect(claims[2].result).toBeOk(Cl.uint(1_085_000)); // 85% of 10% bonus
  });

  // ======================
  // DIFFERENT TIER CONCURRENT CLAIMS
  // ======================

  it('Concurrent #5: Mixed tier successful claims', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    
    // Fund pool with mixed failures
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(2)], poolFunder);

    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], poolFunder);
    simnet.mineEmptyBlocks(MONTHLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(3)], poolFunder);

    // Create 3 successful stakes (different tiers)
    const user1 = accounts.get('wallet_1')!;
    const user2 = accounts.get('wallet_2')!;
    const user3 = accounts.get('wallet_3')!;

    // 1 STX stake
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user1);
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(4), Cl.uint(i)], user1);
    }

    // 5 STX stake
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_COMMITTED), Cl.stringAscii('weekly')], user2);
    for (let i = 1; i <= 15; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(5), Cl.uint(i)], user2);
    }

    // 10 STX stake
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_SERIOUS), Cl.stringAscii('monthly')], user3);
    for (let i = 1; i <= 30; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(6), Cl.uint(i)], user3);
    }

    simnet.mineEmptyBlocks(MONTHLY_BLOCKS);

    // Claim all 3 simultaneously
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(4)], user1);
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(5)], user2);
    const claim3 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(6)], user3);

    expect(claim1.result).toBeOk(Cl.uint(1_100_000));  // 1 + 0.1
    expect(claim2.result).toBeOk(Cl.uint(5_600_000));  // 5 + 0.6
    expect(claim3.result).toBeOk(Cl.uint(11_500_000)); // 10 + 1.5
  });

  // ======================
  // DOUBLE CLAIM PREVENTION
  // ======================

  it('Concurrent #6: Prevent double claiming same stake', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;
    
    // Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // Create successful stake
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(i)], user);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // First claim succeeds
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user);
    expect(claim1.result).toBeOk(Cl.uint(1_100_000));

    // Second claim fails with ERR-ALREADY-CLAIMED
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], user);
    expect(claim2.result).toBeErr(Cl.uint(104)); // ERR-ALREADY-CLAIMED
  });

  // ======================
  // UNAUTHORIZED CLAIM PREVENTION
  // ======================

  it('Concurrent #7: Prevent unauthorized claims', () => {
    const accounts = simnet.getAccounts();
    const owner = accounts.get('wallet_1')!;
    const attacker = accounts.get('wallet_2')!;
    
    // Owner creates stake
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], owner);
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], owner);
    }

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Attacker tries to claim owner's stake
    const maliciousClaim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], attacker);
    
    expect(maliciousClaim.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
  });

  // ======================
  // POOL EXHAUSTION SCENARIO
  // ======================

  it('Concurrent #8: Handle insufficient pool balance gracefully', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    
    // Fund pool with only 1 failure (0.3 STX in pool)
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // Create 5 successful stakes (need 0.5 STX total in bonuses)
    const users = [
      accounts.get('wallet_1')!,
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!,
      accounts.get('wallet_4')!,
      accounts.get('wallet_5')!
    ];

    users.forEach((user, index) => {
      const stakeId = 2 + index;
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      
      for (let termId = 1; termId <= 7; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(stakeId), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Try to claim all (pool has 0.3 STX but needs 0.5 STX)
    const claims = users.map((user, index) => 
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(2 + index)], user)
    );

    // First 3 claims succeed (use up 0.3 STX pool)
    expect(claims[0].result).toBeOk(Cl.uint(1_100_000));
    expect(claims[1].result).toBeOk(Cl.uint(1_100_000));
    expect(claims[2].result).toBeOk(Cl.uint(1_100_000));

    // Remaining claims fail due to insufficient pool
    expect(claims[3].result).toBeErr(Cl.uint(109)); // ERR-INSUFFICIENT-BALANCE
    expect(claims[4].result).toBeErr(Cl.uint(109));
  });

  // ======================
  // RAPID SEQUENTIAL CLAIMS
  // ======================

  it('Concurrent #9: 3 rapid sequential claims in single block', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    
    // Fund pool (3 failed stakes = stake IDs 1, 2, 3)
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(i)], poolFunder);
    }

    // Create 3 successful stakes (wallet_2, wallet_3, wallet_4)
    // These will be stake IDs 4, 5, 6
    const users = [
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!,
      accounts.get('wallet_4')!
    ];

    users.forEach((user, index) => {
      const stakeId = 4 + index; // IDs: 4, 5, 6
      
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      
      for (let termId = 1; termId <= 7; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(stakeId), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Claim all 3 rapidly (stake IDs 4, 5, 6)
    users.forEach((user, index) => {
      const stakeId = 4 + index;
      const claim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(stakeId)], user);
      
      expect(claim.result).toBeOk(Cl.uint(1_100_000));
    });
  });

  // ======================
  // EMERGENCY UNSTAKE CONCURRENT
  // ======================

  it('Concurrent #10: Multiple emergency unstakes simultaneously', () => {
    const accounts = simnet.getAccounts();
    
    // Create 5 stakes
    const users = [
      accounts.get('wallet_1')!,
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!,
      accounts.get('wallet_4')!,
      accounts.get('wallet_5')!
    ];

    users.forEach((user, index) => {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    });

    // All emergency unstake immediately
    const unstakes = users.map((user, index) => 
      simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
        [Cl.uint(1 + index)], user)
    );

    // All should get 0.8 STX (20% penalty)
    unstakes.forEach(unstake => {
      expect(unstake.result).toBeOk(Cl.uint(800_000));
    });
  });
});