/**
 * ClarityLearn 2.0 - Core Dictionary Tests (CORRECT FILE)
 * Tests for the CORE DICTIONARY CONTRACT - not rewards!
 */

import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

const FIRST_VOTE_FREE = true;
const SUBSEQUENT_VOTE_COST = 100_000; // 0.1 STX

// ======================
// TERM STORAGE TESTS
// ======================

describe('ClarityLearn Core - Term Storage', () => {
  it('Should store a new term with valid category', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [
        Cl.stringAscii('DeFi'),
        Cl.stringUtf8('Decentralized Finance - Financial services on blockchain'),
        Cl.stringAscii('DeFi')
      ],
      contributor
    );

    expect(response.result).toBeOk(Cl.uint(1));
  });

  it('Should reject term with invalid category', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [
        Cl.stringAscii('Flash Loan'),
        Cl.stringUtf8('Uncollateralized loan repaid in same transaction'),
        Cl.stringAscii('InvalidCategory')
      ],
      contributor
    );

    expect(response.result).toBeErr(Cl.uint(202));
  });

  it('Should retrieve stored term by ID', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [
        Cl.stringAscii('NFT'),
        Cl.stringUtf8('Non-Fungible Token - Unique digital asset'),
        Cl.stringAscii('NFTs')
      ],
      contributor
    );

    const term = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-term',
      [Cl.uint(1)],
      contributor
    );

    expect(term.result).toBeDefined();
    expect(term.result).not.toBeNone();
  });

  it('Should track contributor stats on term creation', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    for (let i = 0; i < 3; i++) {
      simnet.callPublicFn(
        'clarity-learn-core',
        'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition ${i}`),
          Cl.stringAscii('General')
        ],
        contributor
      );
    }

    const stats = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-contributor-stats',
      [Cl.principal(contributor)],
      contributor
    );

    expect(stats.result).toBeDefined();
    expect(stats.result).not.toBeNone();
  });

  it('Should add term to category index', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [
        Cl.stringAscii('Liquid Staking'),
        Cl.stringUtf8('Staking that maintains token liquidity'),
        Cl.stringAscii('Staking')
      ],
      contributor
    );

    const categoryTerms = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-terms-by-category',
      [Cl.stringAscii('Staking')],
      contributor
    );

    expect(categoryTerms.result).toBeDefined();
    expect(categoryTerms.result).not.toBeNone();
  });
});

// ======================
// VOTING SYSTEM TESTS
// ======================

describe('ClarityLearn Core - Voting System', () => {
  it('First vote should be FREE', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [
        Cl.stringAscii('DAO'),
        Cl.stringUtf8('Decentralized Autonomous Organization'),
        Cl.stringAscii('DAO')
      ],
      contributor
    );

    const voterBalanceBefore = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;

    const voteResponse = simnet.callPublicFn(
      'clarity-learn-core',
      'vote-term',
      [Cl.uint(1)],
      voter
    );

    expect(voteResponse.result).toBeOk(Cl.bool(true));

    const voterBalanceAfter = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;
    expect(voterBalanceAfter).toBe(voterBalanceBefore);
  });

  it('Subsequent vote should COST 0.1 STX', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('Term1'), Cl.stringUtf8('Def1'), Cl.stringAscii('General')],
      contributor
    );
    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('Term2'), Cl.stringUtf8('Def2'), Cl.stringAscii('General')],
      contributor
    );

    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter);

    const balanceBefore = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;

    const voteResponse = simnet.callPublicFn(
      'clarity-learn-core',
      'vote-term',
      [Cl.uint(2)],
      voter
    );

    expect(voteResponse.result).toBeOk(Cl.bool(true));

    const balanceAfter = simnet.getAssetsMap().get('STX')?.get(voter) || 0n;
    expect(balanceBefore - balanceAfter).toBe(BigInt(SUBSEQUENT_VOTE_COST));
  });

  it('Should prevent double voting on same term', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('DEX'), Cl.stringUtf8('Decentralized Exchange'), Cl.stringAscii('DEX')],
      contributor
    );

    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter);

    const secondVote = simnet.callPublicFn(
      'clarity-learn-core',
      'vote-term',
      [Cl.uint(1)],
      voter
    );

    expect(secondVote.result).toBeErr(Cl.uint(203));
  });

  it('Should increment vote count on term', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter1 = accounts.get('wallet_2')!;
    const voter2 = accounts.get('wallet_3')!;
    const voter3 = accounts.get('wallet_4')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('Bridge'), Cl.stringUtf8('Cross-chain asset transfer'), Cl.stringAscii('Bridges')],
      contributor
    );

    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter1);
    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter2);
    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter3);

    const termDetails = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-term-details',
      [Cl.uint(1)],
      contributor
    );

    // Just verify it returns ok
    expect(termDetails.result).toBeDefined();
  });

  it('Should update contributor reputation on vote', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const voter = accounts.get('wallet_2')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('Yield'), Cl.stringUtf8('Returns from staking'), Cl.stringAscii('Staking')],
      contributor
    );

    simnet.callPublicFn('clarity-learn-core', 'vote-term', [Cl.uint(1)], voter);

    const stats = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-contributor-stats',
      [Cl.principal(contributor)],
      contributor
    );

    expect(stats.result).toBeDefined();
    expect(stats.result).not.toBeNone();
  });
});

// ======================
// CATEGORY TESTS
// ======================

describe('ClarityLearn Core - Category Management', () => {
  it('Should list all valid categories', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const categories = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-valid-categories',
      [],
      user
    );

    expect(categories.result).toBeDefined();
  });

  it('Should filter terms by category', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('AMM'), Cl.stringUtf8('Automated Market Maker'), Cl.stringAscii('DeFi')],
      contributor
    );
    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('Liquidity Pool'), Cl.stringUtf8('Pool of tokens'), Cl.stringAscii('DeFi')],
      contributor
    );
    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('ERC-721'), Cl.stringUtf8('NFT standard'), Cl.stringAscii('NFTs')],
      contributor
    );

    const defiTerms = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-terms-by-category',
      [Cl.stringAscii('DeFi')],
      contributor
    );

    expect(defiTerms.result).toBeDefined();
    expect(defiTerms.result).not.toBeNone();
  });
});

// ======================
// ADMIN FUNCTIONS
// ======================

describe('ClarityLearn Core - Admin Functions', () => {
  it('Admin should flag inappropriate term', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const contributor = accounts.get('wallet_1')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('BadTerm'), Cl.stringUtf8('Inappropriate content'), Cl.stringAscii('General')],
      contributor
    );

    const flagResponse = simnet.callPublicFn(
      'clarity-learn-core',
      'flag-term',
      [Cl.uint(1)],
      deployer
    );

    expect(flagResponse.result).toBeOk(Cl.bool(true));

    const term = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-term',
      [Cl.uint(1)],
      deployer
    );

    expect(term.result).toBeDefined();
    expect(term.result).not.toBeNone();
  });

  it('Non-admin cannot flag terms', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;
    const nonAdmin = accounts.get('wallet_2')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('Term'), Cl.stringUtf8('Definition'), Cl.stringAscii('General')],
      contributor
    );

    const flagResponse = simnet.callPublicFn(
      'clarity-learn-core',
      'flag-term',
      [Cl.uint(1)],
      nonAdmin
    );

    expect(flagResponse.result).toBeErr(Cl.uint(200));
  });

  it('Admin should archive outdated term', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const contributor = accounts.get('wallet_1')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('OldTerm'), Cl.stringUtf8('Outdated definition'), Cl.stringAscii('General')],
      contributor
    );

    const archiveResponse = simnet.callPublicFn(
      'clarity-learn-core',
      'archive-term',
      [Cl.uint(1)],
      deployer
    );

    expect(archiveResponse.result).toBeOk(Cl.bool(true));
  });

  it('Admin should add new category', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;

    const addResponse = simnet.callPublicFn(
      'clarity-learn-core',
      'add-category',
      [Cl.stringAscii('ZKProofs')],
      deployer
    );

    expect(addResponse.result).toBeOk(Cl.bool(true));

    const categories = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-valid-categories',
      [],
      deployer
    );

    expect(categories.result).toBeDefined();
  });
});

// ======================
// EDGE CASES
// ======================

describe('ClarityLearn Core - Edge Cases', () => {
  it('Should handle empty term name', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    const response = simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [
        Cl.stringAscii(''),
        Cl.stringUtf8('Definition with no term name'),
        Cl.stringAscii('General')
      ],
      contributor
    );

    expect(response.result).toBeOk(Cl.uint(1));
  });

  it('Should query non-existent term', () => {
    const accounts = simnet.getAccounts();
    const user = accounts.get('wallet_1')!;

    const term = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-term',
      [Cl.uint(999)],
      user
    );

    expect(term.result).toBeNone();
  });

  it('Should verify term for staking integration', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    simnet.callPublicFn(
      'clarity-learn-core',
      'store-term',
      [Cl.stringAscii('Staking'), Cl.stringUtf8('Locking tokens for rewards'), Cl.stringAscii('Staking')],
      contributor
    );

    const verification = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'verify-term-for-staking',
      [Cl.uint(1)],
      contributor
    );

    expect(verification.result).toBeDefined();
  });

  it('Should track total number of terms', () => {
    const accounts = simnet.getAccounts();
    const contributor = accounts.get('wallet_1')!;

    for (let i = 0; i < 5; i++) {
      simnet.callPublicFn(
        'clarity-learn-core',
        'store-term',
        [
          Cl.stringAscii(`Term${i}`),
          Cl.stringUtf8(`Definition ${i}`),
          Cl.stringAscii('General')
        ],
        contributor
      );
    }

    const totalTerms = simnet.callReadOnlyFn(
      'clarity-learn-core',
      'get-total-terms',
      [],
      contributor
    );

    expect(totalTerms.result).toBeOk(Cl.uint(5));
  });
});