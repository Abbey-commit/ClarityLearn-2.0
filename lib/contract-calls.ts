// -----------------------------
// FILE NAME: contract-calls.ts
// Location: ClarityLearn-2.0/lib/contract-calls.ts
// Purpose: Smart contract interaction functions
// -----------------------------

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
  standardPrincipalCV,
  listCV,
  bufferCV,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { CONTRACTS, NETWORK } from './wallet-config';
import { openContractCall } from '@stacks/connect';

// Get network instance
const getNetwork = () => {
  return NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
};

// Parse contract address (ST1PKQ...WF7H5.contract-name)
const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

// ===========================================
// CORE CONTRACT FUNCTIONS (Dictionary)
// ===========================================

// Store a new term in the dictionary
export async function storeTerm(
  term: string,
  definition: string,
  category: string,
  userAddress: string
) {
  const { address, name } = parseContractId(CONTRACTS.core);
  
  const txOptions = {
    contractAddress: address,
    contractName: name,
    functionName: 'store-term',
    functionArgs: [
      stringAsciiCV(term),
      stringAsciiCV(definition),
      stringAsciiCV(category),
    ],
    senderKey: userAddress,
    validateWithAbi: false,
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log('Store term transaction:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('Transaction cancelled');
    },
  };
  
  await openContractCall(txOptions);
}

// Vote on a term
export async function voteTerm(termId: number, userAddress: string) {
  const { address, name } = parseContractId(CONTRACTS.core);
  
  const txOptions = {
    contractAddress: address,
    contractName: name,
    functionName: 'vote-term',
    functionArgs: [uintCV(termId)],
    senderKey: userAddress,
    validateWithAbi: false,
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log('Vote transaction:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('Transaction cancelled');
    },
  };
  
  await openContractCall(txOptions);
}

// ===========================================
// STAKING CONTRACT FUNCTIONS
// ===========================================

// Create a new stake
export async function createStake(
  amount: number, // in microSTX (1 STX = 1,000,000 microSTX)
  stakingPlan: 'weekly' | 'biweekly' | 'monthly',
  userAddress: string
) {
  const { address, name } = parseContractId(CONTRACTS.staking);
  
  const txOptions = {
    contractAddress: address,
    contractName: name,
    functionName: 'create-stake',
    functionArgs: [
      uintCV(amount),
      stringAsciiCV(stakingPlan),
    ],
    senderKey: userAddress,
    validateWithAbi: false,
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log('Create stake transaction:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('Transaction cancelled');
    },
  };
  
  await openContractCall(txOptions);
}

// Mark term as learned
export async function markTermLearned(
  stakeId: number,
  termId: number,
  userAddress: string
) {
  const { address, name } = parseContractId(CONTRACTS.staking);
  
  const txOptions = {
    contractAddress: address,
    contractName: name,
    functionName: 'mark-term-learned',
    functionArgs: [
      uintCV(stakeId),
      uintCV(termId),
    ],
    senderKey: userAddress,
    validateWithAbi: false,
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log('Mark learned transaction:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('Transaction cancelled');
    },
  };
  
  await openContractCall(txOptions);
}

// Claim stake rewards
export async function claimStake(stakeId: number, userAddress: string) {
  const { address, name } = parseContractId(CONTRACTS.staking);
  
  const txOptions = {
    contractAddress: address,
    contractName: name,
    functionName: 'claim-stake',
    functionArgs: [uintCV(stakeId)],
    senderKey: userAddress,
    validateWithAbi: false,
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log('Claim stake transaction:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('Transaction cancelled');
    },
  };
  
  await openContractCall(txOptions);
}

// ===========================================
// READ-ONLY CONTRACT CALLS (No wallet needed)
// ===========================================

// Fetch a specific term by ID
export async function getTerm(termId: number) {
  try {
    const { address, name } = parseContractId(CONTRACTS.core);
    const url = `${getNetwork().coreApiUrl}/v2/contracts/call-read/${address}/${name}/get-term`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: address,
        arguments: [uintCV(termId).serialize().toString('hex')],
      }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching term:', error);
    return null;
  }
}

// Fetch stake details
export async function getStakeDetails(stakeId: number) {
  try {
    const { address, name } = parseContractId(CONTRACTS.staking);
    const url = `${getNetwork().coreApiUrl}/v2/contracts/call-read/${address}/${name}/get-stake`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: address,
        arguments: [uintCV(stakeId).serialize().toString('hex')],
      }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stake:', error);
    return null;
  }
}

// Fetch user's stakes
export async function getUserStakes(userAddress: string) {
  try {
    const { address, name } = parseContractId(CONTRACTS.staking);
    const url = `${getNetwork().coreApiUrl}/v2/contracts/call-read/${address}/${name}/get-user-stakes`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: userAddress,
        arguments: [standardPrincipalCV(userAddress).serialize().toString('hex')],
      }),
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user stakes:', error);
    return [];
  }
}

// Fetch stake progress
export async function getStakeProgress(stakeId: number) {
  try {
    const { address, name } = parseContractId(CONTRACTS.staking);
    const url = `${getNetwork().coreApiUrl}/v2/contracts/call-read/${address}/${name}/get-stake-progress`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: address,
        arguments: [uintCV(stakeId).serialize().toString('hex')],
      }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stake progress:', error);
    return null;
  }
}

// ===========================================
// ADMIN FUNCTIONS (For Step 2 linking)
// ===========================================

// Link staking contract to rewards (Admin only)
export async function setStakingContract(
  stakingContractAddress: string,
  adminAddress: string
) {
  const { address, name } = parseContractId(CONTRACTS.rewards);
  const { address: stakingAddr, name: stakingName } = parseContractId(stakingContractAddress);
  
  const txOptions = {
    contractAddress: address,
    contractName: name,
    functionName: 'set-staking-contract',
    functionArgs: [principalCV(`${stakingAddr}.${stakingName}`)],
    senderKey: adminAddress,
    validateWithAbi: false,
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log('Set staking contract transaction:', data.txId);
      alert(`Transaction submitted! TX ID: ${data.txId}`);
      return data;
    },
    onCancel: () => {
      console.log('Transaction cancelled');
    },
  };
  
  await openContractCall(txOptions);
}