import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { useAuth } from '@/hooks/useAuth';
import { badgeProgressionMachine, badgeProgressionSelectors } from '@/lib/machines/badge-progression-machine';
import { BadgeCelebrationModal } from './BadgeCelebrationModal';
import { BadgeDetailModal } from './BadgeDetailModal';

interface BadgeProgressionManagerProps {
  totalActivities: number;
  onBadgeEarned?: (badge: any) => void;
}

/**
 * Global badge progression manager that handles:
 * - Automatic badge checking when activities increase
 * - Badge celebration flows
 * - Badge detail viewing
 * - Integration with activity logging
 */
export function BadgeProgressionManager({ 
  totalActivities, 
  onBadgeEarned 
}: BadgeProgressionManagerProps) {
  const { user } = useAuth();
  const [state, send] = useMachine(badgeProgressionMachine);

  // Initialize the machine with user data
  useEffect(() => {
    if (user?.id && totalActivities > 0) {
      send({ 
        type: 'CHECK_BADGES', 
        profileId: user.id, 
        totalActivities 
      });
    }
  }, [user?.id, send]);

  // Check for new badges when activities increase
  useEffect(() => {
    if (user?.id && totalActivities > state.context.totalActivities) {
      send({ 
        type: 'ACTIVITY_COMPLETED', 
        totalActivities 
      });
    }
  }, [totalActivities, user?.id, state.context.totalActivities, send]);

  // Callback when badges are earned
  useEffect(() => {
    if (state.context.celebratingBadge && onBadgeEarned) {
      onBadgeEarned(state.context.celebratingBadge);
    }
  }, [state.context.celebratingBadge, onBadgeEarned]);

  const isCelebrating = badgeProgressionSelectors.isCelebrating(state.context);
  const isViewingBadge = badgeProgressionSelectors.isViewingBadge(state.context);

  return (
    <>
      {/* Badge Celebration Modal */}
      <BadgeCelebrationModal
        visible={isCelebrating}
        badge={state.context.celebratingBadge}
        onClose={() => send({ type: 'DISMISS_CELEBRATION' })}
        onViewDetails={(badge) => send({ type: 'VIEW_BADGE', badge })}
        showProgress={state.context.newBadges.length > 1}
        progress={badgeProgressionSelectors.celebrationProgress(state.context)}
      />

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        visible={isViewingBadge}
        badge={state.context.currentBadge}
        onClose={() => send({ type: 'CLOSE_MODAL' })}
        onContinue={() => send({ type: 'DISMISS_CELEBRATION' })}
      />
    </>
  );
}