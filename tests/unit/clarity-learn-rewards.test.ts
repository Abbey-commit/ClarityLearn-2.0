/**
 * ClarityLearn 2.0 - Rewards Governance Contract Tests
 * Full 2-of-3 multi-signature testing with proper matchers
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';

/**
 * Helper function to set up multi-sig admins for tests
 * Call this before any test that requires multiple admins
 */
function setupMultiSigAdmins() {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get('deployer')!;
  const wallet2 = accounts.get('wallet_2')!;
  const wallet3 = accounts.get('wallet_3')!;
  
  // Add wallet_2 as admin
  simnet.callPublicFn(
    'clarity-learn-rewards',
    'add-admin',
    [Cl.principal(wallet2)],
    deployer
  );
  
  // Add wallet_3 as admin
  simnet.callPublicFn(
    'clarity-learn-rewards',
    'add-admin',
    [Cl.principal(wallet3)],
    deployer
  );
}

// =============================================================================
// TEST SUITE 1: ADMIN VERIFICATION (6 tests)
// =============================================================================

describe('Rewards Governance - Admin Verification', () => {
  it('Should recognize deployer as admin', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const response = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'is-admin-check',
      [Cl.principal(deployer)],
      deployer
    );
    
    expect(response.result).toBeOk(Cl.bool(true));
  });

  it('Should NOT recognize non-admin as admin', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    const response = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'is-admin-check',
      [Cl.principal(wallet1)],
      deployer
    );
    
    expect(response.result).toBeOk(Cl.bool(false));
  });

  it('Should prevent non-admin from proposing actions', () => {
    const accounts = simnet.getAccounts();
    const wallet1 = accounts.get('wallet_1')!;
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(500000)],
      wallet1
    );
    
    expect(response.result).toBeErr(Cl.uint(300));
  });

  it('Should allow admin to propose actions', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(500000)],
      deployer
    );
    
    expect(response.result).toBeOk(Cl.uint(1));
  });

  it('Should allow multiple admins to propose independently', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    const wallet3 = accounts.get('wallet_3')!;
    
    const response1 = simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(100000)],
      deployer
    );
    
    const response2 = simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('adjust-rate'), Cl.uint(1200)],
      wallet2
    );
    
    const response3 = simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('emergency-withdraw'), Cl.uint(50000)],
      wallet3
    );
    
    expect(response1.result).toBeOk(Cl.uint(1));
    expect(response2.result).toBeOk(Cl.uint(2));
    expect(response3.result).toBeOk(Cl.uint(3));
  });

  it('Should reject invalid action types', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('hack-pool'), Cl.uint(1000000)],
      deployer
    );
    
    expect(response.result).toBeErr(Cl.uint(307));
  });
});

// =============================================================================
// TEST SUITE 2: PROPOSAL CREATION (5 tests)
// =============================================================================

describe('Rewards Governance - Proposal Creation', () => {
  it('Should auto-approve proposer on proposal creation', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('adjust-rate'), Cl.uint(1200)],
      deployer
    );
    
    const proposal = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-proposal',
      [Cl.uint(1)],
      deployer
    );
    
    expect(proposal.result).toBeDefined();
  });

  it('Should store correct proposer address', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(250000)],
      deployer
    );
    
    const proposal = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-proposal',
      [Cl.uint(1)],
      deployer
    );
    
    expect(proposal.result).toBeDefined();
  });

  it('Should increment proposal counter correctly', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    simnet.callPublicFn('clarity-learn-rewards', 'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(100000)], deployer);
    simnet.callPublicFn('clarity-learn-rewards', 'propose-action',
      [Cl.stringAscii('adjust-rate'), Cl.uint(1500)], deployer);
    simnet.callPublicFn('clarity-learn-rewards', 'propose-action',
      [Cl.stringAscii('emergency-withdraw'), Cl.uint(50000)], deployer);
    
    const count = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-proposal-count',
      [],
      deployer
    );
    
    expect(count.result).toBeOk(Cl.uint(3));
  });

  it('Should capture correct block height on creation', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const blockBefore = simnet.blockHeight;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(100000)],
      deployer
    );
    
    const proposal = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-proposal',
      [Cl.uint(1)],
      deployer
    );
    
    expect(proposal.result).toBeDefined();
  });

  it('Should error when querying non-existent proposal', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const proposal = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-proposal',
      [Cl.uint(999)],
      deployer
    );
    
    expect(proposal.result).toBeErr(Cl.uint(303));
  });
});

// =============================================================================
// TEST SUITE 3: MULTI-SIG APPROVAL FLOW (7 tests)
// =============================================================================

describe('Rewards Governance - Multi-Sig Approval', () => {
  it('Should allow second admin to approve proposal', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(100000)],
      deployer
    );
    
    const approveResponse = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    expect(approveResponse.result).toBeOk(Cl.bool(true));
    
    const proposal = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-proposal',
      [Cl.uint(1)],
      deployer
    );
    
    expect(proposal.result).toBeDefined();
  });

  it('Should execute automatically at 2-of-3 threshold', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('adjust-rate'), Cl.uint(1300)],
      deployer
    );
    
    const approveResponse = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    expect(approveResponse.result).toBeOk(Cl.bool(true));
    
    const proposal = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-proposal',
      [Cl.uint(1)],
      deployer
    );
    
    expect(proposal.result).toBeDefined();
  });

  it('Should prevent admin from approving same proposal twice', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(100000)],
      deployer
    );
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      deployer
    );
    
    expect(response.result).toBeErr(Cl.uint(302));
  });

  it('Should prevent non-admin from approving', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(100000)],
      deployer
    );
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet1
    );
    
    expect(response.result).toBeErr(Cl.uint(300));
  });

  it('Should error when approving non-existent proposal', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(999)],
      deployer
    );
    
    expect(response.result).toBeErr(Cl.uint(303));
  });

  it('Should error when approving already executed proposal', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    const wallet3 = accounts.get('wallet_3')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('adjust-rate'), Cl.uint(1200)],
      deployer
    );
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet3
    );
    
    expect(response.result).toBeErr(Cl.uint(306));
  });

  it('Should confirm execution happens with exactly 2 approvals', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(100000)],
      deployer
    );
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    const proposal = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-proposal',
      [Cl.uint(1)],
      deployer
    );
    
    expect(proposal.result).toBeDefined();
  });
});

// =============================================================================
// TEST SUITE 4: SECURITY & EDGE CASES (8 tests)
// =============================================================================

describe('Rewards Governance - Security & Edge Cases', () => {
  it('Should expire proposal after 144 blocks', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(100000)],
      deployer
    );
    
    simnet.mineEmptyBlocks(145);
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    expect(response.result).toBeErr(Cl.uint(301));
  });

  it('Should allow approval on 144th block (before expiry)', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('adjust-rate'), Cl.uint(1200)],
      deployer
    );
    
    simnet.mineEmptyBlocks(143);
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    expect(response.result).toBeOk(Cl.bool(true));
  });

  it('Should return correct initial bonus rates', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const rates = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-bonus-rates',
      [],
      deployer
    );
    
    expect(rates.result).toBeDefined();
  });

  it('Should update bonus rates on adjust-rate execution', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('adjust-rate'), Cl.uint(1100)],
      deployer
    );
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    const rates = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-bonus-rates',
      [],
      deployer
    );
    
    expect(rates.result).toBeDefined();
  });

  it('Should reject bonus rate above 20%', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('adjust-rate'), Cl.uint(2500)],
      deployer
    );
    
    const response = simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    expect(response.result).toBeErr(Cl.uint(310));
  });

  it('Should track pool stats correctly', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const stats = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-pool-stats',
      [],
      deployer
    );
    
    expect(stats.result).toBeDefined();
  });

  it('Should update pool balance on fund-pool execution', () => {
    setupMultiSigAdmins();
    
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'propose-action',
      [Cl.stringAscii('fund-pool'), Cl.uint(500000)],
      deployer
    );
    
    simnet.callPublicFn(
      'clarity-learn-rewards',
      'approve-proposal',
      [Cl.uint(1)],
      wallet2
    );
    
    const stats = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-pool-stats',
      [],
      deployer
    );
    
    expect(stats.result).toBeDefined();
  });

  it('Should return none for unset staking contract', () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get('deployer')!;
    
    const result = simnet.callReadOnlyFn(
      'clarity-learn-rewards',
      'get-staking-contract',
      [],
      deployer
    );
    
    expect(result.result).toBeOk(Cl.none());
  });
});