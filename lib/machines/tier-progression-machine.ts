import { createMachine } from 'xstate';
import { TierLevel, UserTierStatus } from '@/services/tier-system-service';

// Context for tier progression state
export interface TierProgressionContext {
  currentTier: TierLevel;
  consecutiveWeeks: number;
  currentWeekProgress: number;
  weeklyTarget: number;
  newTier?: TierLevel;
  celebrationShown: boolean;
  promotionEligible: boolean;
  userTierStatus?: UserTierStatus;
}

// Events for tier progression
export type TierProgressionEvent =
  | { type: 'ACTIVITY_LOGGED'; activitiesThisWeek: number }
  | { type: 'WEEK_COMPLETED'; weekActivities: number; weekTarget: number }
  | { type: 'CHECK_PROMOTION' }
  | { type: 'PROMOTE_TIER'; newTier: TierLevel }
  | { type: 'SHOW_CELEBRATION' }
  | { type: 'CELEBRATION_VIEWED' }
  | { type: 'RESET_PROGRESS' }
  | { type: 'UPDATE_STATUS'; tierStatus: UserTierStatus };

export const tierProgressionMachine = createMachine({
  types: {} as {
    context: TierProgressionContext;
    events: TierProgressionEvent;
  },
  id: 'tierProgression',
  initial: 'tracking',
  context: {
    currentTier: 'bronze',
    consecutiveWeeks: 0,
    currentWeekProgress: 0,
    weeklyTarget: 3,
    celebrationShown: false,
    promotionEligible: false,
  },
  states: {
    tracking: {
      description: 'Normal state - tracking weekly progress',
      on: {
        ACTIVITY_LOGGED: {
          actions: 'updateWeekProgress',
          target: 'evaluating',
        },
        WEEK_COMPLETED: {
          actions: 'processWeekCompletion',
          target: 'evaluating',
        },
        UPDATE_STATUS: {
          actions: 'updateTierStatus',
        },
      },
    },
    
    evaluating: {
      description: 'Evaluating if tier promotion is possible',
      always: [
        {
          guard: 'shouldPromoteTier',
          target: 'promoting',
        },
        {
          guard: 'weekTargetMet',
          target: 'weekCompleted',
        },
        {
          target: 'tracking',
        },
      ],
    },
    
    weekCompleted: {
      description: 'Week target completed but no tier promotion',
      entry: 'markWeekCompleted',
      after: {
        1000: 'tracking', // Brief celebration for week completion
      },
      on: {
        CHECK_PROMOTION: 'evaluating',
      },
    },
    
    promoting: {
      description: 'Tier promotion in progress',
      entry: 'initiateTierPromotion',
      on: {
        PROMOTE_TIER: {
          actions: 'promoteTier',
          target: 'celebrating',
        },
      },
    },
    
    celebrating: {
      description: 'Showing tier promotion celebration',
      entry: 'showTierCelebration',
      on: {
        CELEBRATION_VIEWED: {
          actions: 'markCelebrationViewed',
          target: 'tracking',
        },
      },
      after: {
        10000: {
          // Auto-dismiss celebration after 10 seconds
          actions: 'markCelebrationViewed',
          target: 'tracking',
        },
      },
    },
    
    error: {
      description: 'Error state for handling failures',
      on: {
        RESET_PROGRESS: {
          actions: 'resetToInitialState',
          target: 'tracking',
        },
      },
    },
  },
}, {
  actions: {
    updateWeekProgress: ({ context, event }) => {
      if (event.type === 'ACTIVITY_LOGGED') {
        context.currentWeekProgress = event.activitiesThisWeek;
      }
    },
    
    processWeekCompletion: ({ context, event }) => {
      if (event.type === 'WEEK_COMPLETED') {
        const weekMet = event.weekActivities >= event.weekTarget;
        if (weekMet) {
          context.consecutiveWeeks += 1;
        } else {
          context.consecutiveWeeks = 0; // Reset streak
        }
        context.currentWeekProgress = 0; // Reset for new week
      }
    },
    
    updateTierStatus: ({ context, event }) => {
      if (event.type === 'UPDATE_STATUS') {
        context.userTierStatus = event.tierStatus;
        context.currentTier = event.tierStatus.currentTier;
        context.consecutiveWeeks = event.tierStatus.consecutiveWeeks;
        context.currentWeekProgress = event.tierStatus.currentWeekProgress;
        context.weeklyTarget = event.tierStatus.currentWeekCommitment;
        context.promotionEligible = event.tierStatus.canPromote;
      }
    },
    
    initiateTierPromotion: ({ context }) => {
      if (context.userTierStatus?.nextTierRequirements) {
        context.newTier = context.userTierStatus.nextTierRequirements.level;
      }
    },
    
    promoteTier: ({ context, event }) => {
      if (event.type === 'PROMOTE_TIER') {
        context.currentTier = event.newTier;
        context.newTier = event.newTier;
      }
    },
    
    showTierCelebration: ({ context }) => {
      context.celebrationShown = true;
    },
    
    markCelebrationViewed: ({ context }) => {
      context.celebrationShown = false;
      context.newTier = undefined;
    },
    
    markWeekCompleted: ({ context }) => {
      // Could trigger week completion celebration
    },
    
    resetToInitialState: ({ context }) => {
      context.currentTier = 'bronze';
      context.consecutiveWeeks = 0;
      context.currentWeekProgress = 0;
      context.weeklyTarget = 3;
      context.celebrationShown = false;
      context.promotionEligible = false;
      context.newTier = undefined;
    },
  },
  
  guards: {
    shouldPromoteTier: ({ context }) => {
      return context.promotionEligible && !context.celebrationShown;
    },
    
    weekTargetMet: ({ context }) => {
      return context.currentWeekProgress >= context.weeklyTarget;
    },
  },
});

export type TierProgressionMachine = typeof tierProgressionMachine;