// -----------------------------
// FILE NAME: useStaking.ts
// Location: ClarityLearn-2.0/hooks/useStaking.ts
// Purpose: Hook for staking contract interactions
// -----------------------------

import { useState } from 'react';
import { createStake, getUserStakes, getStakeDetails, claimStake } from '@/lib/contract-calls';
import { useWallet } from './useWallet';

export const useStaking = () => {
  const { address } = useWallet();
  const [isCreatingStake, setIsCreatingStake] = useState(false);
  const [isClaimingStake, setIsClaimingStake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new stake
  const handleCreateStake = async (
    amount: number,
    plan: 'weekly' | 'biweekly' | 'monthly'
  ) => {
    if (!address) {
      setError('Please connect your wallet first');
      return false;
    }

    setIsCreatingStake(true);
    setError(null);

    try {
      await createStake(amount, plan, address);
      setIsCreatingStake(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to create stake');
      setIsCreatingStake(false);
      return false;
    }
  };

  // Claim stake rewards
  const handleClaimStake = async (stakeId: number) => {
    if (!address) {
      setError('Please connect your wallet first');
      return false;
    }

    setIsClaimingStake(true);
    setError(null);

    try {
      await claimStake(stakeId, address);
      setIsClaimingStake(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to claim stake');
      setIsClaimingStake(false);
      return false;
    }
  };

  // Fetch user's stakes
  const fetchUserStakes = async () => {
    if (!address) return [];
    try {
      return await getUserStakes(address);
    } catch (err) {
      console.error('Error fetching stakes:', err);
      return [];
    }
  };

  // Fetch specific stake details
  const fetchStakeDetails = async (stakeId: number) => {
    try {
      return await getStakeDetails(stakeId);
    } catch (err) {
      console.error('Error fetching stake details:', err);
      return null;
    }
  };

  return {
    createStake: handleCreateStake,
    claimStake: handleClaimStake,
    fetchUserStakes,
    fetchStakeDetails,
    isCreatingStake,
    isClaimingStake,
    error,
  };
};
