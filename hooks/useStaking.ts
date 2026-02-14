import { useState } from 'react';
import { createStake, getUserStakes, getStakeDetails, claimStake } from '@/lib/contract-calls';
import { useWallet } from './useWallet';

export const useStaking = () => {
  const { address } = useWallet();
  const [isCreatingStake, setIsCreatingStake] = useState(false);
  const [isClaimingStake, setIsClaimingStake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔵 useStaking hook - current address:', address);

  // Create a new stake
  const handleCreateStake = async (
    amount: number,
    plan: 'weekly' | 'biweekly' | 'monthly'
  ) => {
    console.log('🟢 handleCreateStake called with:', { amount, plan, address });

    if (!address) {
      console.error('❌ No address available!');
      setError('Please connect your wallet first');
      return false;
    }

    console.log('🟢 Setting isCreatingStake to true');
    setIsCreatingStake(true);
    setError(null);

    try {
      console.log('🟢 Calling createStake function...');
      await createStake(amount, plan, address);
      console.log('✅ createStake completed successfully');
      setIsCreatingStake(false);
      return true;
    } catch (err: any) {
      console.error('❌ Error in createStake:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
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