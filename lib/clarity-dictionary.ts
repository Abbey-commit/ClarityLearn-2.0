// -----------------------------
// FILE NAME: clarity-dictionary.ts
// Location: ClarityLearn-2.0/lib/clarity-dictionary.ts
// Purpose: Fallback crypto terms data
// -----------------------------

export interface Term {
  id: number;
  term: string;
  definition: string;
  category: string;
  votes: number;
  contributor: string;
}

// Fallback dictionary data (for initial app state)
export const FALLBACK_TERMS: Term[] = [
  {
    id: 1,
    term: "DeFi",
    definition: "Decentralized Finance - Financial services built on blockchain without intermediaries like banks",
    category: "DeFi",
    votes: 42,
    contributor: "ST1PKQ...WF7H5"
  },
  {
    id: 2,
    term: "Smart Contract",
    definition: "Self-executing code on blockchain that automatically enforces agreements when conditions are met",
    category: "Blockchain",
    votes: 38,
    contributor: "ST2PKQ...AB3C1"
  },
  {
    id: 3,
    term: "Staking",
    definition: "Locking cryptocurrency to support network operations and earn rewards",
    category: "Staking",
    votes: 35,
    contributor: "ST3PKQ...XY9Z2"
  },
  {
    id: 4,
    term: "NFT",
    definition: "Non-Fungible Token - Unique digital asset representing ownership of specific items or content",
    category: "NFT",
    votes: 40,
    contributor: "ST4PKQ...MN4K5"
  },
  {
    id: 5,
    term: "Gas Fees",
    definition: "Transaction costs paid to blockchain validators for processing operations",
    category: "Blockchain",
    votes: 28,
    contributor: "ST5PKQ...PQ7L8"
  },
  {
    id: 6,
    term: "Liquidity Pool",
    definition: "Collection of tokens locked in smart contracts to facilitate decentralized trading",
    category: "DeFi",
    votes: 31,
    contributor: "ST6PKQ...RS2M9"
  },
  {
    id: 7,
    term: "DAO",
    definition: "Decentralized Autonomous Organization - Community-governed entity using blockchain voting",
    category: "Blockchain",
    votes: 25,
    contributor: "ST7PKQ...TU6N0"
  },
  {
    id: 8,
    term: "Yield Farming",
    definition: "Earning rewards by providing liquidity or staking tokens in DeFi protocols",
    category: "DeFi",
    votes: 29,
    contributor: "ST8PKQ...VW8P1"
  },
];