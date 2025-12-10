// -----------------------------
// FILE 4: lib/constants.ts
// Location: ClarityLearn-2.0/lib/constants.ts
// Purpose: App-wide constants and configurations
// -----------------------------

// Staking plans configuration
export const STAKING_PLANS = {
  weekly: {
    name: 'Weekly',
    duration: 7,
    termsRequired: 7,
    minAmount: 1000000, // 1 STX in microSTX
    successBonus: 0.1, // 10%
    failurePenalty: 0.3, // 30%
    description: 'Learn 7 terms in 7 days',
  },
  biweekly: {
    name: 'Bi-Weekly',
    duration: 14,
    termsRequired: 15,
    minAmount: 5000000, // 5 STX
    successBonus: 0.12, // 12%
    failurePenalty: 0.25, // 25%
    description: 'Learn 15 terms in 14 days',
  },
  monthly: {
    name: 'Monthly',
    duration: 30,
    termsRequired: 30,
    minAmount: 10000000, // 10 STX
    successBonus: 0.15, // 15%
    failurePenalty: 0.2, // 20%
    description: 'Learn 30 terms in 30 days',
  },
};

// Categories for terms
export const CATEGORIES = [
  'DeFi',
  'NFT',
  'Blockchain',
  'Trading',
  'Staking',
  'Security',
  'Other',
];

// Voting cost (in microSTX)
export const VOTING_COST = 100000; // 0.1 STX (first vote is free)

// Transaction status types
export const TX_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;