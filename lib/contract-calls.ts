import {
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
  standardPrincipalCV,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { CONTRACTS, NETWORK, STACKS_API_URL } from './wallet-config';

// Parse contract address (ST1PKQ...WF7H5.contract-name)
const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split('.');
  return { address, name };
};

// ===========================================
// STAKING CONTRACT FUNCTIONS
// ===========================================

// Create a new stake
export async function createStake(
  amount: number,
  stakingPlan: 'weekly' | 'biweekly' | 'monthly',
  userAddress: string
) {
  console.log('🔵 Creating stake with:', { amount, stakingPlan, userAddress });
  
  const { address, name } = parseContractId(CONTRACTS.staking);
  
  console.log('🔵 Contract details:', { address, name });
  console.log('🔵 Full contract ID:', CONTRACTS.staking);
  console.log('🔵 User address:', userAddress);
  console.log('🔵 Network:', NETWORK);
  
  const txOptions = {
    contractAddress: address,
    contractName: name,
    functionName: 'create-stake',
    functionArgs: [
      uintCV(amount),
      stringAsciiCV(stakingPlan),
    ],
    // CRITICAL: Pass network as simple string for v8 compatibility
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    appDetails: {
      name: 'ClarityLearn 2.0',
      icon: window.location.origin + '/logo.png',
    },
    onFinish: (data: any) => {
      console.log('✅ Stake transaction submitted!');
      console.log('📦 Transaction ID:', data.txId);
      alert(`Stake created! Transaction ID: ${data.txId}`);
      return data;
    },
    onCancel: () => {
      console.log('⚠️ Transaction cancelled by user');
    },
  };
  
  console.log('🔵 Transaction options:', {
    ...txOptions,
    functionArgs: '[CV values]',
    network: NETWORK,
  });
  
  try {
    await openContractCall(txOptions);
    console.log('✅ openContractCall executed');
  } catch (error) {
    console.error('❌ Error in openContractCall:', error);
    throw error;
  }
}

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
    network: NETWORK,
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
    network: NETWORK,
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
    network: NETWORK,
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
    network: NETWORK,
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
    const url = `${STACKS_API_URL}/v2/contracts/call-read/${address}/${name}/get-term`;
    
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
    const url = `${STACKS_API_URL}/v2/contracts/call-read/${address}/${name}/get-stake`;
    
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
    const url = `${STACKS_API_URL}/v2/contracts/call-read/${address}/${name}/get-user-stakes`;
    
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
    const url = `${STACKS_API_URL}/v2/contracts/call-read/${address}/${name}/get-stake-progress`;
    
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
// ADMIN FUNCTIONS
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
    network: NETWORK,
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