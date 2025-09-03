import { createMachine } from 'xstate';
import { CoachClientRelationship, ClientProgress, ClientRelationshipStatus } from '@/services/coach-service';

// Context for coach-client relationship lifecycle
export interface CoachClientContext {
  relationshipId?: string;
  coachId: string;
  clientId: string;
  currentStatus: ClientRelationshipStatus;
  relationship?: CoachClientRelationship;
  clientProgress?: ClientProgress;
  pendingAction?: string;
  error?: string;
  notificationsSent: string[];
  lastInteractionDate?: string;
  subscriptionEndDate?: string;
  autoRenew: boolean;
}

// Events for coach-client relationship management
export type CoachClientEvent =
  | { type: 'INITIALIZE_RELATIONSHIP'; relationship: CoachClientRelationship }
  | { type: 'CLIENT_ACCEPTS' }
  | { type: 'CLIENT_DECLINES' }
  | { type: 'COACH_APPROVES' }
  | { type: 'COACH_REJECTS' }
  | { type: 'PAUSE_RELATIONSHIP'; reason?: string }
  | { type: 'RESUME_RELATIONSHIP' }
  | { type: 'CANCEL_SUBSCRIPTION'; reason?: string }
  | { type: 'COMPLETE_PROGRAM' }
  | { type: 'UPDATE_PROGRESS'; progress: ClientProgress }
  | { type: 'SEND_REMINDER' }
  | { type: 'CHECK_SUBSCRIPTION_STATUS' }
  | { type: 'PAYMENT_FAILED' }
  | { type: 'PAYMENT_SUCCESSFUL' }
  | { type: 'SCHEDULE_CHECK_IN' }
  | { type: 'COMPLETE_CHECK_IN' }
  | { type: 'RETRY_ACTION' }
  | { type: 'RESOLVE_ERROR' };

export const coachClientMachine = createMachine({
  types: {} as {
    context: CoachClientContext;
    events: CoachClientEvent;
  },
  id: 'coachClient',
  initial: 'initializing',
  context: {
    coachId: '',
    clientId: '',
    currentStatus: 'pending',
    notificationsSent: [],
    autoRenew: true,
  },
  states: {
    initializing: {
      description: 'Loading relationship data and determining initial state',
      on: {
        INITIALIZE_RELATIONSHIP: {
          actions: 'setRelationshipData',
          target: 'routing',
        },
      },
    },

    routing: {
      description: 'Route to appropriate state based on current status',
      always: [
        {
          guard: 'isPendingApproval',
          target: 'pendingApproval',
        },
        {
          guard: 'isActive',
          target: 'active',
        },
        {
          guard: 'isPaused',
          target: 'paused',
        },
        {
          guard: 'isCancelled',
          target: 'cancelled',
        },
        {
          guard: 'isCompleted',
          target: 'completed',
        },
        {
          target: 'error',
        },
      ],
    },

    pendingApproval: {
      description: 'Awaiting coach or client approval',
      entry: 'sendPendingNotification',
      on: {
        CLIENT_ACCEPTS: {
          actions: 'markClientAccepted',
          target: 'awaitingCoachApproval',
        },
        CLIENT_DECLINES: {
          actions: 'markClientDeclined',
          target: 'cancelled',
        },
        COACH_APPROVES: {
          actions: 'approveRelationship',
          target: 'activating',
        },
        COACH_REJECTS: {
          actions: 'rejectRelationship',
          target: 'cancelled',
        },
      },
      after: {
        // Auto-expire pending relationships after 7 days
        604800000: {
          actions: 'expirePendingRelationship',
          target: 'cancelled',
        },
      },
    },

    awaitingCoachApproval: {
      description: 'Client accepted, waiting for coach approval',
      entry: 'notifyCoachForApproval',
      on: {
        COACH_APPROVES: {
          actions: 'approveRelationship',
          target: 'activating',
        },
        COACH_REJECTS: {
          actions: 'rejectRelationship',
          target: 'cancelled',
        },
      },
      after: {
        // Remind coach after 24 hours
        86400000: {
          actions: 'sendCoachReminder',
        },
      },
    },

    activating: {
      description: 'Setting up active coaching relationship',
      entry: 'setupActiveRelationship',
      on: {
        PAYMENT_SUCCESSFUL: {
          actions: 'confirmPayment',
          target: 'active',
        },
        PAYMENT_FAILED: {
          actions: 'handlePaymentFailure',
          target: 'paymentIssue',
        },
      },
      after: {
        // Timeout if activation takes too long
        300000: {  // 5 minutes
          target: 'error',
        },
      },
    },

    active: {
      description: 'Active coaching relationship',
      entry: 'startActiveCoaching',
      initial: 'monitoring',
      states: {
        monitoring: {
          description: 'Monitoring client progress and engagement',
          on: {
            UPDATE_PROGRESS: {
              actions: 'updateClientProgress',
            },
            SCHEDULE_CHECK_IN: {
              target: 'checkInPending',
            },
            SEND_REMINDER: {
              actions: 'sendProgressReminder',
            },
          },
          after: {
            // Regular progress checks every week
            604800000: {
              actions: 'scheduleProgressCheck',
            },
          },
        },

        checkInPending: {
          description: 'Waiting for scheduled check-in completion',
          entry: 'sendCheckInReminder',
          on: {
            COMPLETE_CHECK_IN: {
              actions: 'recordCheckIn',
              target: 'monitoring',
            },
          },
          after: {
            // Escalate if check-in not completed within 3 days
            259200000: {
              actions: 'escalateCheckIn',
              target: 'monitoring',
            },
          },
        },
      },
      on: {
        PAUSE_RELATIONSHIP: {
          actions: 'pauseRelationship',
          target: 'paused',
        },
        CANCEL_SUBSCRIPTION: {
          actions: 'cancelSubscription',
          target: 'cancelling',
        },
        COMPLETE_PROGRAM: {
          actions: 'completeProgram',
          target: 'completed',
        },
        PAYMENT_FAILED: {
          actions: 'handlePaymentFailure',
          target: 'paymentIssue',
        },
        CHECK_SUBSCRIPTION_STATUS: {
          actions: 'verifySubscriptionStatus',
        },
      },
    },

    paused: {
      description: 'Coaching relationship temporarily paused',
      entry: 'pauseAllServices',
      on: {
        RESUME_RELATIONSHIP: {
          actions: 'resumeRelationship',
          target: 'active',
        },
        CANCEL_SUBSCRIPTION: {
          actions: 'cancelSubscription',
          target: 'cancelled',
        },
      },
      after: {
        // Auto-check for resume after 30 days
        2592000000: {
          actions: 'checkForResume',
        },
      },
    },

    paymentIssue: {
      description: 'Payment processing issue needs resolution',
      entry: 'notifyPaymentIssue',
      on: {
        PAYMENT_SUCCESSFUL: {
          actions: 'resolvePaymentIssue',
          target: 'active',
        },
        RETRY_ACTION: {
          actions: 'retryPayment',
        },
        CANCEL_SUBSCRIPTION: {
          actions: 'cancelDueToPayment',
          target: 'cancelled',
        },
      },
      after: {
        // Grace period of 3 days for payment resolution
        259200000: {
          actions: 'suspendForPayment',
          target: 'paused',
        },
      },
    },

    cancelling: {
      description: 'Processing cancellation request',
      entry: 'processCancellation',
      on: {
        PAYMENT_SUCCESSFUL: {
          // Handle final payment if needed
          actions: 'processFinalPayment',
          target: 'cancelled',
        },
      },
      after: {
        // Complete cancellation after processing
        60000: {  // 1 minute
          target: 'cancelled',
        },
      },
    },

    cancelled: {
      description: 'Coaching relationship cancelled',
      type: 'final',
      entry: 'finalizeCancellation',
    },

    completed: {
      description: 'Coaching program successfully completed',
      type: 'final',
      entry: 'finalizeCompletion',
    },

    error: {
      description: 'Error state requiring manual intervention',
      entry: 'logError',
      on: {
        RESOLVE_ERROR: {
          target: 'routing',
        },
        RETRY_ACTION: {
          target: 'initializing',
        },
      },
    },
  },
}, {
  actions: {
    setRelationshipData: ({ context, event }) => {
      if (event.type === 'INITIALIZE_RELATIONSHIP') {
        context.relationship = event.relationship;
        context.relationshipId = event.relationship.id;
        context.coachId = event.relationship.coach_id;
        context.clientId = event.relationship.client_id;
        context.currentStatus = event.relationship.status;
        context.subscriptionEndDate = event.relationship.end_date;
        context.autoRenew = event.relationship.auto_renew;
      }
    },

    sendPendingNotification: ({ context }) => {
      context.notificationsSent.push('pending_approval');
    },

    markClientAccepted: ({ context }) => {
      context.currentStatus = 'pending';
      context.pendingAction = 'awaiting_coach_approval';
    },

    markClientDeclined: ({ context }) => {
      context.currentStatus = 'cancelled';
    },

    approveRelationship: ({ context }) => {
      context.currentStatus = 'active';
      context.pendingAction = 'activating';
    },

    rejectRelationship: ({ context }) => {
      context.currentStatus = 'cancelled';
    },

    expirePendingRelationship: ({ context }) => {
      context.currentStatus = 'cancelled';
      context.error = 'Pending relationship expired';
    },

    notifyCoachForApproval: ({ context }) => {
      context.notificationsSent.push('coach_approval_needed');
    },

    sendCoachReminder: ({ context }) => {
      context.notificationsSent.push('coach_approval_reminder');
    },

    setupActiveRelationship: ({ context }) => {
      context.pendingAction = 'setting_up_payment';
    },

    confirmPayment: ({ context }) => {
      context.pendingAction = undefined;
    },

    handlePaymentFailure: ({ context }) => {
      context.error = 'Payment processing failed';
    },

    startActiveCoaching: ({ context }) => {
      context.lastInteractionDate = new Date().toISOString();
    },

    updateClientProgress: ({ context, event }) => {
      if (event.type === 'UPDATE_PROGRESS') {
        context.clientProgress = event.progress;
      }
    },

    sendProgressReminder: ({ context }) => {
      context.notificationsSent.push('progress_reminder');
    },

    scheduleProgressCheck: ({ context }) => {
      context.pendingAction = 'progress_check_scheduled';
    },

    sendCheckInReminder: ({ context }) => {
      context.notificationsSent.push('checkin_reminder');
    },

    recordCheckIn: ({ context }) => {
      context.lastInteractionDate = new Date().toISOString();
    },

    escalateCheckIn: ({ context }) => {
      context.notificationsSent.push('checkin_escalated');
    },

    pauseRelationship: ({ context, event }) => {
      if (event.type === 'PAUSE_RELATIONSHIP') {
        context.currentStatus = 'paused';
      }
    },

    resumeRelationship: ({ context }) => {
      context.currentStatus = 'active';
    },

    cancelSubscription: ({ context, event }) => {
      if (event.type === 'CANCEL_SUBSCRIPTION') {
        context.currentStatus = 'cancelled';
        context.pendingAction = 'cancelling';
      }
    },

    completeProgram: ({ context }) => {
      context.currentStatus = 'completed';
    },

    pauseAllServices: ({ context }) => {
      context.pendingAction = 'services_paused';
    },

    verifySubscriptionStatus: ({ context }) => {
      context.pendingAction = 'verifying_subscription';
    },

    notifyPaymentIssue: ({ context }) => {
      context.notificationsSent.push('payment_issue');
    },

    resolvePaymentIssue: ({ context }) => {
      context.error = undefined;
    },

    retryPayment: ({ context }) => {
      context.pendingAction = 'retrying_payment';
    },

    cancelDueToPayment: ({ context }) => {
      context.currentStatus = 'cancelled';
      context.error = 'Cancelled due to payment issues';
    },

    suspendForPayment: ({ context }) => {
      context.currentStatus = 'paused';
    },

    processCancellation: ({ context }) => {
      context.pendingAction = 'processing_cancellation';
    },

    processFinalPayment: ({ context }) => {
      context.pendingAction = 'final_payment_processed';
    },

    finalizeCancellation: ({ context }) => {
      context.pendingAction = undefined;
      context.notificationsSent.push('cancellation_finalized');
    },

    finalizeCompletion: ({ context }) => {
      context.pendingAction = undefined;
      context.notificationsSent.push('program_completed');
    },

    checkForResume: ({ context }) => {
      context.notificationsSent.push('resume_check');
    },

    logError: ({ context }) => {
      console.error('Coach-Client relationship error:', context.error);
    },
  },

  guards: {
    isPendingApproval: ({ context }) => context.currentStatus === 'pending',
    isActive: ({ context }) => context.currentStatus === 'active',
    isPaused: ({ context }) => context.currentStatus === 'paused',
    isCancelled: ({ context }) => context.currentStatus === 'cancelled',
    isCompleted: ({ context }) => context.currentStatus === 'completed',
  },
});

export type CoachClientMachine = typeof coachClientMachine;