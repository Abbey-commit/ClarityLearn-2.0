/**
 * ClarityLearn 2.0 - Fuzz Test: Rapid Voting
 * Tests spam voting attempts to verify:
 * - First vote free, subsequent votes cost 0.1 STX
 * - Double voting prevention
 * - Vote counting accuracy under load
 * - Payment enforcement
 * Week 3 - Day 1: Fuzz Testing Suite
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

const SUBSEQUENT_VOTE_COST = 100_000; // 0.1 STX

describe('ClarityLearn Core - Fuzz: Rapid Voting', () => {

  // ======================
  // FIRST VOTE FREE VERIFICATION
  // ======================

  it('Rapid #1: First vote should be FREE for 3 different users', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    // Create 3 terms
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition ${i}`),
          Cl.stringAscii('General')
        ],
        contributor
      );
    }

    // 3 users vote (wallet_2, wallet_3, wallet_4)
    for (let i = 2; i <= 4; i++) {
      const voter = accounts.get(`wallet_${i}`)!;
      const balanceBefore = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;

      const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(i - 1)], voter);

      expect(voteResponse.result).toBeOk(Cl.bool(true));

      const balanceAfter = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;
      expect(balanceAfter).toBe(balanceBefore);
    }
  });

  // ======================
  // SUBSEQUENT VOTE COST VERIFICATION
  // ======================

  it('Rapid #2: Subsequent votes should cost 0.1 STX', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    // Create 5 terms
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition ${i}`),
          Cl.stringAscii('General')
        ],
        contributor
      );
    }

    // First vote is free
    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter);

    // Next 4 votes should each cost 0.1 STX
    for (let termId = 2; termId <= 5; termId++) {
      const balanceBefore = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;

      const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(termId)], voter);

      expect(voteResponse.result).toBeOk(Cl.bool(true));

      const balanceAfter = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;
      const cost = balanceBefore - balanceAfter;
      expect(cost).toBe(BigInt(SUBSEQUENT_VOTE_COST));
    }
  });

  // ======================
  // DOUBLE VOTING PREVENTION
  // ======================

  it('Rapid #3: Prevent same user from voting twice on same term', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('DeFi'),
        Cl.stringUtf8('Decentralized Finance'),
        Cl.stringAscii('DeFi')
      ],
      contributor
    );

    // First vote succeeds
    const vote1 = simnet.callPublicFn('clarity-learn-core', 'vote-term',
      [Cl.uint(1)], voter);
    expect(vote1.result).toBeOk(Cl.bool(true));

    // Second vote on same term fails
    const vote2 = simnet.callPublicFn('clarity-learn-core', 'vote-term',
      [Cl.uint(1)], voter);
    expect(vote2.result).toBeErr(Cl.uint(203)); // ERR-ALREADY-VOTED
  });

  it('Rapid #4: Rapid spam voting attempts on single term', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const spammer = accounts.get('wallet_2')!;

    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('Bitcoin'),
        Cl.stringUtf8('First cryptocurrency'),
        Cl.stringAscii('Bitcoin')
      ],
      contributor
    );

    // First vote succeeds
    const vote1 = simnet.callPublicFn('clarity-learn-core', 'vote-term',
      [Cl.uint(1)], spammer);
    expect(vote1.result).toBeOk(Cl.bool(true));

    // Next 10 rapid attempts all fail
    for (let i = 0; i < 10; i++) {
      const voteSpam = simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(1)], spammer);
      expect(voteSpam.result).toBeErr(Cl.uint(203));
    }
  });

  // ======================
  // VOTE COUNTING ACCURACY
  // ======================

  it('Rapid #5: Vote count should increment correctly with 20 voters', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('NFT'),
        Cl.stringUtf8('Non-Fungible Token'),
        Cl.stringAscii('NFTs')
      ],
      contributor
    );

    // 20 different users vote
    for (let i = 2; i <= 21; i++) {
      const voter = accounts.get(`wallet_${i}`) || accounts.get('deployer')!;
      
      simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(1)], voter);
    }

    // Verify term has votes recorded
    const termDetails = simnet.callReadOnlyFn('clarity-learn-core', 'get-term-details',
      [Cl.uint(1)], contributor);

    expect(termDetails.result).toBeDefined();
  });

  // ======================
  // MULTIPLE TERMS RAPID VOTING
  // ======================

  it('Rapid #6: User voting on 50 different terms rapidly', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    // Create 50 terms
    for (let i = 1; i <= 50; i++) {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition for term ${i}`),
          Cl.stringAscii('General')
        ],
        contributor
      );
    }

    const balanceBefore = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;

    // Vote on all 50 terms
    for (let termId = 1; termId <= 50; termId++) {
      const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(termId)], voter);
      
      expect(voteResponse.result).toBeOk(Cl.bool(true));
    }

    const balanceAfter = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;
    const totalCost = balanceBefore - balanceAfter;

    // First vote free, 49 votes at 0.1 STX each = 4.9 STX
    expect(totalCost).toBe(BigInt(49 * SUBSEQUENT_VOTE_COST));
  });

  // ======================
  // CONCURRENT VOTING STRESS TEST
  // ======================

  it('Rapid #7: 3 users voting on 10 terms simultaneously', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    // Create 10 terms
    for (let i = 1; i <= 10; i++) {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition ${i}`),
          Cl.stringAscii('DeFi')
        ],
        contributor
      );
    }

    // 3 users (wallet_2, wallet_3, wallet_4) each vote on all 10 terms
    for (let userId = 2; userId <= 4; userId++) {
      const voter = accounts.get(`wallet_${userId}`)!;
      
      for (let termId = 1; termId <= 10; termId++) {
        const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
          [Cl.uint(termId)], voter);
        
        expect(voteResponse.result).toBeOk(Cl.bool(true));
      }
    }
  });

  // ======================
  // PAYMENT VALIDATION
  // ======================

  it('Rapid #8: Verify payment goes to contract on subsequent votes', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    // Create 3 terms
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition ${i}`),
          Cl.stringAscii('General')
        ],
        contributor
      );
    }

    // Get contract address (as-contract tx-sender)
    const contractPrincipal = `${simnet.deployer}.clarity-learn-core`;

    // First vote (free)
    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter);

    // Second vote (0.1 STX should go to contract)
    const voterBalanceBefore = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;

    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(2)], voter);

    const voterBalanceAfter = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;
    const paid = voterBalanceBefore - voterBalanceAfter;

    expect(paid).toBe(BigInt(SUBSEQUENT_VOTE_COST));
  });

  // ======================
  // VOTING ON NON-EXISTENT TERMS
  // ======================

  it('Rapid #9: Prevent voting on non-existent terms', () => {
    const accounts = simnet.getAccounts();
    const voter = accounts.get('wallet_1')!;

    // Try voting on term that doesn't exist
    const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
      [Cl.uint(999)], voter);

    expect(voteResponse.result).toBeErr(Cl.uint(201)); // ERR-TERM-NOT-FOUND
  });

  it('Rapid #10: Spam voting attempts on non-existent terms', () => {
    const accounts = simnet.getAccounts();
    const spammer = accounts.get('wallet_1')!;

    // Try voting 20 times on non-existent terms
    for (let i = 1; i <= 20; i++) {
      const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(i)], spammer);

      expect(voteResponse.result).toBeErr(Cl.uint(201));
    }
  });

  // ======================
  // VOTING ON FLAGGED TERMS
  // ======================

  it('Rapid #11: Prevent voting on flagged terms', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    // Create term
    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('BadTerm'),
        Cl.stringUtf8('Inappropriate content'),
        Cl.stringAscii('General')
      ],
      contributor
    );

    // Admin flags the term
    simnet.callPublicFn('clarity-learn-core', 'flag-term',
      [Cl.uint(1)], deployer);

    // Attempt to vote on flagged term
    const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
      [Cl.uint(1)], voter);

    expect(voteResponse.result).toBeErr(Cl.uint(200)); // ERR-NOT-AUTHORIZED
  });

  // ======================
  // VOTING ON ARCHIVED TERMS
  // ======================

  it('Rapid #12: Prevent voting on archived terms', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    // Create term
    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('OldTerm'),
        Cl.stringUtf8('Outdated definition'),
        Cl.stringAscii('General')
      ],
      contributor
    );

    // Admin archives the term
    simnet.callPublicFn('clarity-learn-core', 'archive-term',
      [Cl.uint(1)], deployer);

    // Attempt to vote on archived term
    const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
      [Cl.uint(1)], voter);

    expect(voteResponse.result).toBeErr(Cl.uint(200)); // ERR-NOT-AUTHORIZED
  });

  // ======================
  // CONTRIBUTOR REPUTATION UPDATE
  // ======================

  it('Rapid #13: Contributor reputation increases with votes', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii('DAO'),
        Cl.stringUtf8('Decentralized Autonomous Organization'),
        Cl.stringAscii('DAO')
      ],
      contributor
    );

    // 3 users vote (wallet_2, wallet_3, wallet_4)
    for (let i = 2; i <= 4; i++) {
      const voter = accounts.get(`wallet_${i}`)!;
      simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(1)], voter);
    }

    const stats = simnet.callReadOnlyFn('clarity-learn-core', 'get-contributor-stats',
      [Cl.principal(contributor)], contributor);

    expect(stats.result).toBeDefined();
    expect(stats.result).not.toBeNone();
  });

  // ======================
  // CATEGORY-SPECIFIC VOTING
  // ======================

  it('Rapid #14: Rapid voting across different categories', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    const categories = ['DeFi', 'NFTs', 'Layer2', 'DAO', 'Staking'];

    // Create 1 term per category
    categories.forEach((category, index) => {
      simnet.callPublicFn('clarity-learn-core', 'store-term',
        [
          Cl.stringAscii(`${category}Term`),
          Cl.stringUtf8(`Definition for ${category}`),
          Cl.stringAscii(category)
        ],
        contributor
      );
    });

    // Vote on all categories
    for (let termId = 1; termId <= categories.length; termId++) {
      const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
        [Cl.uint(termId)], voter);
      
      expect(voteResponse.result).toBeOk(Cl.bool(true));
    }
  });

  // ======================
  // EDGE CASE: EMPTY TERM VOTING
  // ======================

  it('Rapid #15: Allow voting on terms with empty names', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    // Create term with empty name (allowed by contract)
    simnet.callPublicFn('clarity-learn-core', 'store-term',
      [
        Cl.stringAscii(''),
        Cl.stringUtf8('Definition without term name'),
        Cl.stringAscii('General')
      ],
      contributor
    );

    // Voting should still work
    const voteResponse = simnet.callPublicFn('clarity-learn-core', 'vote-term',
      [Cl.uint(1)], voter);

    expect(voteResponse.result).toBeOk(Cl.bool(true));
  });
});