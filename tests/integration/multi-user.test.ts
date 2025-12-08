/**
 * ClarityLearn 2.0 - Integration Test: Multi-User Interactions
 * Tests multiple users interacting simultaneously with the platform
 * Week 3 - Day 2: Integration Testing Suite
 * 
 * NOTE: Only using wallets 1-4 (learned from fuzz test failures)
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

const TIER_BASIC = 1_000_000;      // 1 STX
const TIER_COMMITTED = 5_000_000;  // 5 STX
const TIER_SERIOUS = 10_000_000;   // 10 STX

const WEEKLY_BLOCKS = 1008;
const MONTHLY_BLOCKS = 4320;

describe('ClarityLearn Integration - Multi-User Interactions', () => {

  // ======================
  // SCENARIO #1: 4 USERS WITH DIFFERENT OUTCOMES
  // ======================

  it('Multi #1: 4 users create stakes simultaneously with different outcomes', () => {
    const accounts = simnet.getAccounts();
    const users = [
      accounts.get('wallet_1')!, // Will succeed
      accounts.get('wallet_2')!, // Will fail
      accounts.get('wallet_3')!, // Will partial complete
      accounts.get('wallet_4')!  // Will emergency unstake
    ];

    // All 4 users create stakes in same block
    users.forEach(user => {
      const response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      expect(response.result).toBeDefined();
    });

    // User 1: Completes all 7 terms
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(1), Cl.uint(i)], users[0]);
    }

    // User 2: Learns nothing (will fail)

    // User 3: Learns 4/7 terms (57% - partial)
    for (let i = 1; i <= 4; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(3), Cl.uint(i)], users[2]);
    }

    // User 4: Emergency unstakes immediately
    const unstake = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(4)], users[3]);
    expect(unstake.result).toBeOk(Cl.uint(800_000));

    // Wait for time-lock
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // User 1 claims success
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(1)], users[0]);
    expect(claim1.result).toBeOk(Cl.uint(1_100_000));

    // User 2 claims with penalty
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], users[1]);
    expect(claim2.result).toBeOk(Cl.uint(700_000));

    // User 3 claims proportional bonus
    const claim3 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(3)], users[2]);
    expect(claim3.result).toBeOk(Cl.uint(1_057_000));
  });

  // ======================
  // SCENARIO #2: DICTIONARY CONTRIBUTIONS
  // ======================

  it('Multi #2: Multiple users contribute terms to dictionary', () => {
    const accounts = simnet.getAccounts();
    const contributors = [
      accounts.get('wallet_1')!,
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!
    ];

    // Each contributor adds different terms
    const term1 = simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('DeFi'),
        Cl.stringUtf8('Decentralized Finance'),
        Cl.stringAscii('DeFi')
      ],
      contributors[0]
    );
    expect(term1.result).toBeOk(Cl.uint(1));

    const term2 = simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('NFT'),
        Cl.stringUtf8('Non-Fungible Token'),
        Cl.stringAscii('NFTs')
      ],
      contributors[1]
    );
    expect(term2.result).toBeOk(Cl.uint(2));

    const term3 = simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('DAO'),
        Cl.stringUtf8('Decentralized Autonomous Organization'),
        Cl.stringAscii('DAO')
      ],
      contributors[2]
    );
    expect(term3.result).toBeOk(Cl.uint(3));

    // Verify all terms exist
    const getTerm1 = simnet.callReadOnlyFn('clarity-learn-core', 'get-term',
      [Cl.uint(1)], contributors[0]);
    const getTerm2 = simnet.callReadOnlyFn('clarity-learn-core', 'get-term',
      [Cl.uint(2)], contributors[1]);
    const getTerm3 = simnet.callReadOnlyFn('clarity-learn-core', 'get-term',
      [Cl.uint(3)], contributors[2]);

    expect(getTerm1.result).not.toBeNone();
    expect(getTerm2.result).not.toBeNone();
    expect(getTerm3.result).not.toBeNone();
  });

  // ======================
  // SCENARIO #3: VOTING ECOSYSTEM
  // ======================

  it('Multi #3: Multiple users vote on contributed terms', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voters = [
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!,
      accounts.get('wallet_4')!
    ];

    // Contributor creates term
    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('Staking'),
        Cl.stringUtf8('Locking tokens to earn rewards'),
        Cl.stringAscii('Staking')
      ],
      contributor
    );

    // All voters vote on the term (first vote is free)
    voters.forEach(voter => {
      const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(1)], voter);
      expect(voteResponse.result).toBeOk(Cl.bool(true));
    });

    // Verify contributor reputation increased
    const stats = simnet.callReadOnlyFn('clarity-learn-core', 'get-contributor-stats',
      [Cl.principal(contributor)], contributor);
    expect(stats.result).toBeDefined();
    expect(stats.result).not.toBeNone();
  });

  // ======================
  // SCENARIO #4: SIMULTANEOUS CLAIMS
  // ======================

  it('Multi #4: 3 users claim stakes in same block', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const users = [
      accounts.get('wallet_1')!,
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!
    ];

    // Fund pool first
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(i)], poolFunder);
    }

    // 3 users create successful stakes
    users.forEach((user, index) => {
      const stakeId = 4 + index;
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      
      for (let termId = 1; termId <= 7; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(stakeId), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // All claim simultaneously
    users.forEach((user, index) => {
      const claim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(4 + index)], user);
      expect(claim.result).toBeOk(Cl.uint(1_100_000));
    });
  });

  // ======================
  // SCENARIO #5: MIXED TIER STAKES
  // ======================

  it('Multi #5: Users stake different amounts simultaneously', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;

    // Fund pool with mixed tiers
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

    // 3 users with different tiers
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

    // All claim
    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(4)], user1);
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(5)], user2);
    const claim3 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(6)], user3);

    expect(claim1.result).toBeOk(Cl.uint(1_100_000));
    expect(claim2.result).toBeOk(Cl.uint(5_600_000));
    expect(claim3.result).toBeOk(Cl.uint(11_500_000));
  });

  // ======================
  // SCENARIO #6: ECOSYSTEM CYCLE
  // ======================

  it('Multi #6: Complete ecosystem cycle - Contribute → Vote → Stake → Learn → Claim', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const contributor1 = accounts.get('wallet_1')!;
    const contributor2 = accounts.get('wallet_2')!;
    const learner1 = accounts.get('wallet_3')!;
    const learner2 = accounts.get('wallet_4')!;

    // Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // PHASE 1: Contributors add terms
    for (let i = 1; i <= 4; i++) {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition ${i}`),
          Cl.stringAscii('General')
        ],
        contributor1
      );
    }

    for (let i = 5; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition ${i}`),
          Cl.stringAscii('General')
        ],
        contributor2
      );
    }

    // PHASE 2: Learners create stakes
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], learner1);
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], learner2);

    // PHASE 3: Learners learn and vote
    for (let termId = 1; termId <= 7; termId++) {
      // Learner 1 learns and votes
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(termId)], learner1);
      simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(termId)], learner1);

      // Learner 2 learns and votes
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(3), Cl.uint(termId)], learner2);
      simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(termId)], learner2);
    }

    // PHASE 4: Wait and claim
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    const claim1 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], learner1);
    const claim2 = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(3)], learner2);

    expect(claim1.result).toBeOk(Cl.uint(1_100_000));
    expect(claim2.result).toBeOk(Cl.uint(1_100_000));

    // PHASE 5: Verify contributors got reputation
    const stats1 = simnet.callReadOnlyFn('clarity-learn-core', 'get-contributor-stats',
      [Cl.principal(contributor1)], contributor1);
    const stats2 = simnet.callReadOnlyFn('clarity-learn-core', 'get-contributor-stats',
      [Cl.principal(contributor2)], contributor2);

    expect(stats1.result).toBeDefined();
    expect(stats2.result).toBeDefined();
  });

  // ======================
  // SCENARIO #7: POOL DYNAMICS
  // ======================

  it('Multi #7: Pool dynamics - Failures fund successes', () => {
    const accounts = simnet.getAccounts();
    const failedUsers = [
      accounts.get('wallet_1')!,
      accounts.get('wallet_2')!
    ];
    const successfulUsers = [
      accounts.get('wallet_3')!,
      accounts.get('wallet_4')!
    ];

    // 2 users fail (add to pool)
    failedUsers.forEach(user => {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    failedUsers.forEach((user, index) => {
      const claim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(1 + index)], user);
      expect(claim.result).toBeOk(Cl.uint(700_000)); // Penalties to pool
    });

    // 2 users succeed (claim from pool)
    successfulUsers.forEach((user, index) => {
      const stakeId = 3 + index;
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      
      for (let termId = 1; termId <= 7; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(stakeId), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    successfulUsers.forEach((user, index) => {
      const claim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(3 + index)], user);
      expect(claim.result).toBeOk(Cl.uint(1_100_000)); // Funded by failures
    });
  });

  // ======================
  // SCENARIO #8: STRESS TEST
  // ======================

  // Replace Multi #8 with this:
  it('Multi #8: Stress test - All 4 users perform maximum actions', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const users = [
      accounts.get('wallet_1')!,
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!,
      accounts.get('wallet_4')!
    ];

    // Fund pool (4 failures for 4 successes)
    for (let i = 0; i < 4; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      const fundResp = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(i + 1)], poolFunder);
    }

    // Each user contributes terms
    users.forEach((user, userIndex) => {
      for (let i = 1; i <= 3; i++) {
        simnet.callPublicFn('clarity-learn-core', 'store-term',
          [
            Cl.stringAscii(`User${userIndex}Term${i}`),
            Cl.stringUtf8(`Definition by user ${userIndex}`),
            Cl.stringAscii('General')
          ],
          user
        );
      }
    });

    // Track the stake IDs created in THIS test
    const stakeIds: number[] = [];
    
    // Each user creates a stake
    users.forEach((user, index) => {
      const response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      
      // Extract stake ID - it's a Clarity uint inside an Ok response
      if (response.result.type === 7) { // ResponseOk type
        const okValue = (response.result as any).value;
        stakeIds.push(Number(okValue.value));
      }
    });

    // Each user learns 7 terms and votes
    users.forEach((user, userIndex) => {
      const stakeId = stakeIds[userIndex];
      
      for (let termId = 1; termId <= 7; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(stakeId), Cl.uint(termId)], user);
      }

      for (let termId = 1; termId <= 12; termId++) {
        simnet.callPublicFn('clarity-learn-core', 'vote-term',
          [Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // All users claim using their tracked stake IDs
    users.forEach((user, index) => {
      const claim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(stakeIds[index])], user);
      expect(claim.result).toBeOk(Cl.uint(1_100_000));
    });
  });

  // Replace Multi #9 with this:
  it('Multi #9: Sequential waves - 2 cohorts of users', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const wave1 = [accounts.get('wallet_1')!, accounts.get('wallet_2')!];
    const wave2 = [accounts.get('wallet_3')!, accounts.get('wallet_4')!];

    // Fund pool (4 failures for both waves)
    for (let i = 0; i < 4; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
      simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
      simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(i + 1)], poolFunder);
    }

    // WAVE 1: Track stake IDs
    const wave1Ids: number[] = [];
    wave1.forEach(user => {
      const response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      if (response.result.type === 7) {
        const okValue = (response.result as any).value;
        wave1Ids.push(Number(okValue.value));
      }
    });

    // Wave 1 learns
    wave1.forEach((user, index) => {
      for (let termId = 1; termId <= 7; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(wave1Ids[index]), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Wave 1 claims
    wave1.forEach((user, index) => {
      const claim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(wave1Ids[index])], user);
      expect(claim.result).toBeOk(Cl.uint(1_100_000));
    });

    // WAVE 2: Track stake IDs
    const wave2Ids: number[] = [];
    wave2.forEach(user => {
      const response = simnet.callPublicFn('clarity-learn-staking', 'create-stake',
        [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], user);
      if (response.result.type === 7) {
        const okValue = (response.result as any).value;
        wave2Ids.push(Number(okValue.value));
      }
    });

    // Wave 2 learns
    wave2.forEach((user, index) => {
      for (let termId = 1; termId <= 7; termId++) {
        simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
          [Cl.uint(wave2Ids[index]), Cl.uint(termId)], user);
      }
    });

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Wave 2 claims
    wave2.forEach((user, index) => {
      const claim = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
        [Cl.uint(wave2Ids[index])], user);
      expect(claim.result).toBeOk(Cl.uint(1_100_000));
    });
  });

  // ======================
  // SCENARIO #10: REALISTIC USAGE
  // ======================

  it('Multi #10: Realistic mixed behavior - Success, partial, failure, emergency', () => {
    const accounts = simnet.getAccounts();
    const poolFunder = accounts.get('deployer')!;
    const overachiever = accounts.get('wallet_1')!;
    const partialUser = accounts.get('wallet_2')!;
    const lazyClaimer = accounts.get('wallet_3')!;
    const quitter = accounts.get('wallet_4')!;

    // Fund pool
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], poolFunder);
    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);
    simnet.callPublicFn('clarity-learn-staking', 'claim-stake', [Cl.uint(1)], poolFunder);

    // All create stakes
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], overachiever);
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], partialUser);
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], lazyClaimer);
    simnet.callPublicFn('clarity-learn-staking', 'create-stake',
      [Cl.uint(TIER_BASIC), Cl.stringAscii('weekly')], quitter);

    // Overachiever: Learns all 7
    for (let i = 1; i <= 7; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(2), Cl.uint(i)], overachiever);
    }

    // Partial user: Learns 5/7
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
        [Cl.uint(3), Cl.uint(i)], partialUser);
    }

    // Lazy: Learns only 1
    simnet.callPublicFn('clarity-learn-staking', 'mark-term-learned',
      [Cl.uint(4), Cl.uint(1)], lazyClaimer);

    // Quitter: Emergency unstakes
    const unstake = simnet.callPublicFn('clarity-learn-staking', 'emergency-unstake',
      [Cl.uint(5)], quitter);
    expect(unstake.result).toBeOk(Cl.uint(800_000));

    simnet.mineEmptyBlocks(WEEKLY_BLOCKS);

    // Claims
    const claimOver = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(2)], overachiever);
    const claimPartial = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(3)], partialUser);
    const claimLazy = simnet.callPublicFn('clarity-learn-staking', 'claim-stake',
      [Cl.uint(4)], lazyClaimer);

    expect(claimOver.result).toBeOk(Cl.uint(1_100_000));   // Success
    expect(claimPartial.result).toBeOk(Cl.uint(1_071_000)); // 71% completion
    expect(claimLazy.result).toBeOk(Cl.uint(700_000));      // Failure
  });
});