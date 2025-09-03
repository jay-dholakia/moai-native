import { createMachine, assign, fromPromise } from 'xstate';
import { BuddyService, BuddyPreferences as ServiceBuddyPreferences, BuddyMatch, BuddyRequest } from '@/services/buddy-service';

// Re-export types from service
export type BuddyPreferences = ServiceBuddyPreferences;
export type PotentialBuddy = BuddyMatch;

export interface BuddyMatchContext {
  preferences: BuddyPreferences | null;
  potentialMatches: PotentialBuddy[];
  selectedBuddy: PotentialBuddy | null;
  buddyRequest: BuddyRequest | null;
  error: string | null;
  isLoading: boolean;
}

export type BuddyMatchEvent =
  | { type: 'SET_PREFERENCES'; preferences: BuddyPreferences }
  | { type: 'SEARCH_BUDDIES' }
  | { type: 'SELECT_BUDDY'; buddy: PotentialBuddy }
  | { type: 'SEND_REQUEST' }
  | { type: 'CANCEL_REQUEST' }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// Define actor logic outside the machine
const searchBuddiesActor = fromPromise(async ({ input }: { input: BuddyMatchContext }) => {
  if (!input.preferences) {
    throw new Error('No preferences set');
  }
  
  const response = await BuddyService.findPotentialMatches(input.preferences);
  if (!response.success) {
    throw new Error(response.error);
  }
  
  return response.data;
});

const sendBuddyRequestActor = fromPromise(async ({ input }: { input: BuddyMatchContext }) => {
  if (!input.selectedBuddy) {
    throw new Error('No buddy selected');
  }
  
  const response = await BuddyService.sendBuddyRequest(
    input.selectedBuddy.user_id,
    'Hi! I would love to be workout buddies!'
  );
  
  if (!response.success) {
    throw new Error(response.error);
  }
  
  return response.data;
});

export const buddyMatchingMachine = createMachine({
  types: {} as {
    context: BuddyMatchContext;
    events: BuddyMatchEvent;
  },
  id: 'buddyMatching',
  initial: 'idle',
  context: {
    preferences: null,
    potentialMatches: [],
    selectedBuddy: null,
    buddyRequest: null,
    error: null,
    isLoading: false,
  },
  states: {
    idle: {
      on: {
        SET_PREFERENCES: {
          target: 'settingPreferences',
          actions: assign(({ event }) => {
            if (event.type !== 'SET_PREFERENCES') return {};
            return {
              preferences: event.preferences,
            };
          }),
        },
      },
    },
    
    settingPreferences: {
      on: {
        SEARCH_BUDDIES: 'searching',
        SET_PREFERENCES: {
          actions: assign(({ event }) => {
            if (event.type !== 'SET_PREFERENCES') return {};
            return {
              preferences: event.preferences,
            };
          }),
        },
      },
    },
    
    searching: {
      entry: assign(() => ({ isLoading: true, error: null })),
      invoke: {
        id: 'searchBuddies',
        src: searchBuddiesActor,
        input: ({ context }: { context: BuddyMatchContext }) => context,
        onDone: {
          target: 'browsing',
          actions: assign(({ event }) => ({
            potentialMatches: event.output,
            isLoading: false,
          })),
        },
        onError: {
          target: 'error',
          actions: assign(({ event }) => ({
            error: (event.error as Error)?.message || 'Failed to find buddies',
            isLoading: false,
          })),
        },
      },
    },
    
    browsing: {
      on: {
        SELECT_BUDDY: {
          target: 'confirming',
          actions: assign(({ event }) => {
            if (event.type !== 'SELECT_BUDDY') return {};
            return {
              selectedBuddy: event.buddy,
            };
          }),
        },
        SEARCH_BUDDIES: 'searching',
        SET_PREFERENCES: {
          target: 'settingPreferences',
          actions: assign(({ event }) => {
            if (event.type !== 'SET_PREFERENCES') return {};
            return {
              preferences: event.preferences,
            };
          }),
        },
      },
    },
    
    confirming: {
      on: {
        SEND_REQUEST: 'sendingRequest',
        SELECT_BUDDY: {
          actions: assign(({ event }) => {
            if (event.type !== 'SELECT_BUDDY') return {};
            return {
              selectedBuddy: event.buddy,
            };
          }),
        },
        CANCEL_REQUEST: 'browsing',
      },
    },
    
    sendingRequest: {
      entry: assign(() => ({ isLoading: true, error: null })),
      invoke: {
        id: 'sendBuddyRequest',
        src: sendBuddyRequestActor,
        input: ({ context }: { context: BuddyMatchContext }) => context,
        onDone: {
          target: 'requestSent',
          actions: assign(({ event }) => ({
            buddyRequest: event.output,
            isLoading: false,
          })),
        },
        onError: {
          target: 'error',
          actions: assign(({ event }) => ({
            error: (event.error as Error)?.message || 'Failed to send buddy request',
            isLoading: false,
          })),
        },
      },
    },
    
    requestSent: {
      after: {
        3000: 'completed',
      },
      on: {
        RESET: {
          target: 'idle',
          actions: assign(() => ({
            preferences: null,
            potentialMatches: [],
            selectedBuddy: null,
            buddyRequest: null,
            error: null,
            isLoading: false,
          })),
        },
      },
    },
    
    completed: {
      type: 'final',
    },
    
    error: {
      on: {
        RETRY: {
          target: 'searching',
          guard: ({ context }: { context: BuddyMatchContext }) => context.preferences !== null,
        },
        RESET: {
          target: 'idle',
          actions: assign(() => ({
            preferences: null,
            potentialMatches: [],
            selectedBuddy: null,
            buddyRequest: null,
            error: null,
            isLoading: false,
          })),
        },
      },
    },
  },
});

// Helper selectors
export const buddyMatchSelectors = {
  hasPreferences: (context: BuddyMatchContext) => context.preferences !== null,
  hasMatches: (context: BuddyMatchContext) => context.potentialMatches.length > 0,
  topMatch: (context: BuddyMatchContext) => 
    context.potentialMatches.sort((a, b) => b.compatibility_score - a.compatibility_score)[0],
  matchCount: (context: BuddyMatchContext) => context.potentialMatches.length,
};