import { createMachine, assign, fromPromise } from 'xstate';
import { BadgeService, UserBadge } from '@/services/badge-service';

export interface BadgeProgressionContext {
  profileId: string | null;
  totalActivities: number;
  newBadges: UserBadge[];
  currentBadge: UserBadge | null;
  celebratingBadge: UserBadge | null;
  error: string | null;
  isLoading: boolean;
}

export type BadgeProgressionEvent = 
  | { type: 'CHECK_BADGES'; profileId: string; totalActivities: number }
  | { type: 'ACTIVITY_COMPLETED'; totalActivities: number }  
  | { type: 'DISMISS_CELEBRATION' }
  | { type: 'VIEW_BADGE'; badge: UserBadge }
  | { type: 'CLOSE_MODAL' }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// Define actor logic for checking and awarding badges
const checkBadgesActor = fromPromise(async ({ input }: { input: BadgeProgressionContext }) => {
  if (!input.profileId) {
    throw new Error('No profile ID provided');
  }
  
  const response = await BadgeService.checkAndAwardMilestoneBadges(
    input.profileId, 
    input.totalActivities
  );
  
  if (!response.success) {
    throw new Error(response.error);
  }
  
  return response.data; // Array of newly awarded badges
});

export const badgeProgressionMachine = createMachine({
  types: {} as {
    context: BadgeProgressionContext;
    events: BadgeProgressionEvent;
  },
  id: 'badgeProgression',
  initial: 'idle',
  context: {
    profileId: null,
    totalActivities: 0,
    newBadges: [],
    currentBadge: null,
    celebratingBadge: null,
    error: null,
    isLoading: false,
  },
  states: {
    idle: {
      on: {
        CHECK_BADGES: {
          target: 'checking',
          actions: assign(({ event }) => ({
            profileId: event.profileId,
            totalActivities: event.totalActivities,
            error: null,
          })),
        },
        ACTIVITY_COMPLETED: {
          target: 'checking',
          actions: assign(({ event, context }) => ({
            totalActivities: event.totalActivities,
            error: null,
          })),
          guard: ({ context }) => context.profileId !== null,
        },
      },
    },
    
    checking: {
      entry: assign(() => ({ isLoading: true })),
      invoke: {
        id: 'checkBadges',
        src: checkBadgesActor,
        input: ({ context }) => context,
        onDone: {
          target: 'evaluated',
          actions: assign(({ event }) => ({
            newBadges: event.output,
            isLoading: false,
          })),
        },
        onError: {
          target: 'error',
          actions: assign(({ event }) => ({
            error: (event.error as Error)?.message || 'Failed to check badges',
            isLoading: false,
          })),
        },
      },
    },
    
    evaluated: {
      always: [
        {
          target: 'celebrating',
          guard: ({ context }) => context.newBadges.length > 0,
          actions: assign(({ context }) => ({
            // Start celebrating with the first new badge
            celebratingBadge: context.newBadges[0],
          })),
        },
        {
          target: 'idle',
          // No new badges, return to idle
        },
      ],
    },
    
    celebrating: {
      on: {
        DISMISS_CELEBRATION: [
          {
            target: 'celebrating',
            guard: ({ context }) => context.newBadges.length > 1,
            actions: assign(({ context }) => {
              // Move to next badge if there are more
              const remainingBadges = context.newBadges.slice(1);
              return {
                newBadges: remainingBadges,
                celebratingBadge: remainingBadges[0],
              };
            }),
          },
          {
            target: 'completed',
            // No more badges to celebrate
            actions: assign(() => ({
              celebratingBadge: null,
              newBadges: [],
            })),
          },
        ],
        VIEW_BADGE: {
          target: 'viewingBadge',
          actions: assign(({ event }) => ({
            currentBadge: event.badge,
          })),
        },
      },
    },
    
    viewingBadge: {
      on: {
        CLOSE_MODAL: 'celebrating',
        DISMISS_CELEBRATION: [
          {
            target: 'celebrating',
            guard: ({ context }) => context.newBadges.length > 1,
            actions: assign(({ context }) => {
              const remainingBadges = context.newBadges.slice(1);
              return {
                newBadges: remainingBadges,
                celebratingBadge: remainingBadges[0],
                currentBadge: null,
              };
            }),
          },
          {
            target: 'completed',
            actions: assign(() => ({
              celebratingBadge: null,
              newBadges: [],
              currentBadge: null,
            })),
          },
        ],
      },
    },
    
    completed: {
      after: {
        2000: 'idle', // Auto return to idle after 2 seconds
      },
      on: {
        CHECK_BADGES: {
          target: 'checking',
          actions: assign(({ event }) => ({
            profileId: event.profileId,
            totalActivities: event.totalActivities,
            error: null,
          })),
        },
        ACTIVITY_COMPLETED: {
          target: 'checking',
          actions: assign(({ event }) => ({
            totalActivities: event.totalActivities,
            error: null,
          })),
          guard: ({ context }) => context.profileId !== null,
        },
      },
    },
    
    error: {
      on: {
        RETRY: {
          target: 'checking',
          actions: assign(() => ({ error: null })),
        },
        RESET: {
          target: 'idle',
          actions: assign(() => ({
            profileId: null,
            totalActivities: 0,
            newBadges: [],
            currentBadge: null,
            celebratingBadge: null,
            error: null,
            isLoading: false,
          })),
        },
      },
    },
  },
});

// Helper selectors
export const badgeProgressionSelectors = {
  isCelebrating: (context: BadgeProgressionContext) => context.celebratingBadge !== null,
  hasNewBadges: (context: BadgeProgressionContext) => context.newBadges.length > 0,
  isViewingBadge: (context: BadgeProgressionContext) => context.currentBadge !== null,
  celebrationProgress: (context: BadgeProgressionContext) => {
    if (context.newBadges.length === 0) return 100;
    const totalBadges = context.newBadges.length + 1; // +1 for current celebrating badge
    const remaining = context.newBadges.length;
    return Math.round(((totalBadges - remaining) / totalBadges) * 100);
  },
};