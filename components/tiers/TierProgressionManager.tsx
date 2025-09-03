import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { tierProgressionMachine } from '@/lib/machines/tier-progression-machine';
import { TierCelebrationModal } from './TierCelebrationModal';
import { useUserTierStatus } from '@/hooks/use-tier-system';
import { useAuth } from '@/hooks/useAuth';
import { TierLevel } from '@/services/tier-system-service';

export interface TierProgressionManagerProps {
  currentWeekActivities: number;
  onTierPromoted?: (newTier: TierLevel) => void;
  onViewProgress?: () => void;
}

export const TierProgressionManager: React.FC<TierProgressionManagerProps> = ({
  currentWeekActivities,
  onTierPromoted,
  onViewProgress,
}) => {
  const { user } = useAuth();
  const { data: tierStatus, refetch: refetchTierStatus } = useUserTierStatus();
  const [state, send] = useMachine(tierProgressionMachine);

  // Update machine context when tier status changes
  useEffect(() => {
    if (tierStatus) {
      send({
        type: 'UPDATE_STATUS',
        tierStatus,
      });
    }
  }, [tierStatus, send]);

  // Handle activity logging
  useEffect(() => {
    if (currentWeekActivities > 0) {
      send({
        type: 'ACTIVITY_LOGGED',
        activitiesThisWeek: currentWeekActivities,
      });
    }
  }, [currentWeekActivities, send]);

  // Handle tier promotion
  useEffect(() => {
    if (state.matches('promoting') && state.context.newTier) {
      send({
        type: 'PROMOTE_TIER',
        newTier: state.context.newTier,
      });
      
      // Notify parent component
      onTierPromoted?.(state.context.newTier);
      
      // Refetch tier status to get updated data
      refetchTierStatus();
    }
  }, [state, send, onTierPromoted, refetchTierStatus]);

  const handleCelebrationClose = () => {
    send({ type: 'CELEBRATION_VIEWED' });
  };

  const handleViewProgress = () => {
    onViewProgress?.();
    handleCelebrationClose();
  };

  // Only render modal if we're in celebrating state and have tier data
  if (!state.matches('celebrating') || !state.context.newTier || !tierStatus) {
    return null;
  }

  return (
    <TierCelebrationModal
      visible={state.context.celebrationShown}
      oldTier={tierStatus.currentTier}
      newTier={state.context.newTier}
      consecutiveWeeks={state.context.consecutiveWeeks}
      onClose={handleCelebrationClose}
      onViewProgress={onViewProgress ? handleViewProgress : undefined}
    />
  );
};

export default TierProgressionManager;