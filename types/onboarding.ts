import React from 'react';

export interface OnboardingFormData {
  // Step 1: Identity & Personal Info
  firstName: string;
  lastName: string;
  birthDate?: string;
  height?: number | null;
  heightFeet?: string;
  heightInches?: string;
  weight?: number | null;
  measurementSystem?: 'imperial' | 'metric';
  profileImage?: string | null; // Changed to string for React Native
  
  // Birth date parts for UI
  birthMonth?: string;
  birthDay?: string;
  birthYear?: string;
  
  // Step 2: Goal Setting
  fitnessGoals?: string[];
  
  // Step 3: Movement Snapshot
  movementActivities?: {
    [key: string]: {
      selected: boolean;
      frequency: number; // days per week
    };
  };
  
  // Step 4: Access & Constraints
  equipmentAccess?: string[];
  physicalLimitations?: string;
  
  // Step 5: Weekly Commitment
  weeklyCommitment?: {
    [key: string]: boolean; // Mon-Sun commitment
  };
  
  // Step 6: Moai Setup
  moaiPath?: string;
  selectedMoaiType?: 'create' | 'join' | 'skip';
  
  // Legacy fields (may be needed for compatibility)
  age?: string;
  gender?: string;
  bio?: string;
  phoneNumber?: string;
  relationshipStatus?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  location?: string;
  hobbies?: string[];
  socialHandles?: {
    instagram: string;
    twitter: string;
    facebook: string;
  };
  primaryGoal?: string;
  movementFrequency?: string;
  preferredActivities?: string[];
  movementTime?: string;
  userArchetype?: string;
  accountabilityStyle?: string;
  paymentCompleted?: boolean;
}

export interface StepProps {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: string | string[] | File | null | boolean) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
  stepValidationAttempted: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  isRequired: boolean;
  validator?: (data: OnboardingFormData) => string | null;
}

// Fitness Goal Options
export const FITNESS_GOALS = [
  {
    id: 'weight_loss',
    title: 'Weight Loss',
    description: 'Lose weight and improve body composition',
    emoji: '⚖️'
  },
  {
    id: 'muscle_gain',
    title: 'Build Muscle',
    description: 'Gain strength and muscle mass',
    emoji: '💪'
  },
  {
    id: 'endurance',
    title: 'Improve Endurance',
    description: 'Build cardiovascular fitness',
    emoji: '🏃'
  },
  {
    id: 'flexibility',
    title: 'Flexibility & Mobility',
    description: 'Improve range of motion and flexibility',
    emoji: '🧘'
  },
  {
    id: 'general_fitness',
    title: 'General Fitness',
    description: 'Overall health and wellness',
    emoji: '🌟'
  },
  {
    id: 'stress_relief',
    title: 'Stress Relief',
    description: 'Mental health and stress management',
    emoji: '😌'
  }
];

// Movement Frequency Options
export const MOVEMENT_FREQUENCY = [
  {
    id: '1_2_times',
    title: '1-2 times per week',
    description: 'Just getting started',
    emoji: '🌱'
  },
  {
    id: '3_4_times',
    title: '3-4 times per week',
    description: 'Building a routine',
    emoji: '📈'
  },
  {
    id: '5_6_times',
    title: '5-6 times per week',
    description: 'Very active',
    emoji: '🔥'
  },
  {
    id: 'daily',
    title: 'Daily',
    description: 'Movement is life',
    emoji: '⚡'
  }
];

// Movement Time Options
export const MOVEMENT_TIME = [
  {
    id: 'early_morning',
    title: 'Early Morning',
    description: '5:00 AM - 8:00 AM',
    emoji: '🌅'
  },
  {
    id: 'morning',
    title: 'Morning',
    description: '8:00 AM - 12:00 PM',
    emoji: '☀️'
  },
  {
    id: 'afternoon',
    title: 'Afternoon',
    description: '12:00 PM - 5:00 PM',
    emoji: '🌞'
  },
  {
    id: 'evening',
    title: 'Evening',
    description: '5:00 PM - 8:00 PM',
    emoji: '🌆'
  },
  {
    id: 'night',
    title: 'Night',
    description: '8:00 PM - 11:00 PM',
    emoji: '🌙'
  },
  {
    id: 'flexible',
    title: 'Flexible',
    description: 'Whenever I can fit it in',
    emoji: '🔄'
  }
];

// User Archetype Options
export const USER_ARCHETYPES = [
  {
    id: 'competitor',
    title: 'The Competitor',
    description: 'Thrives on competition and beating personal records',
    emoji: '🏆'
  },
  {
    id: 'social_butterfly',
    title: 'The Social Butterfly',
    description: 'Loves group activities and making fitness friends',
    emoji: '🦋'
  },
  {
    id: 'steady_achiever',
    title: 'The Steady Achiever',
    description: 'Prefers consistent progress and routine',
    emoji: '📊'
  },
  {
    id: 'adventure_seeker',
    title: 'The Adventure Seeker',
    description: 'Enjoys trying new activities and challenges',
    emoji: '🗻'
  },
  {
    id: 'mindful_mover',
    title: 'The Mindful Mover',
    description: 'Focuses on mind-body connection and wellness',
    emoji: '🧘‍♀️'
  },
  {
    id: 'time_efficient',
    title: 'The Time-Efficient',
    description: 'Needs quick, effective workouts that fit busy schedule',
    emoji: '⏰'
  }
];

// Accountability Style Options
export const ACCOUNTABILITY_STYLES = [
  {
    id: 'gentle_encouragement',
    title: 'Gentle Encouragement',
    description: 'Positive support and gentle reminders',
    emoji: '🤗'
  },
  {
    id: 'direct_feedback',
    title: 'Direct Feedback',
    description: 'Honest, straightforward accountability',
    emoji: '💬'
  },
  {
    id: 'competitive_challenge',
    title: 'Competitive Challenge',
    description: 'Friendly competition and challenges',
    emoji: '⚔️'
  },
  {
    id: 'celebration_focused',
    title: 'Celebration Focused',
    description: 'Emphasis on celebrating wins and progress',
    emoji: '🎉'
  },
  {
    id: 'problem_solving',
    title: 'Problem Solving',
    description: 'Help finding solutions when facing obstacles',
    emoji: '🔧'
  },
  {
    id: 'check_in_buddy',
    title: 'Check-in Buddy',
    description: 'Regular check-ins and progress sharing',
    emoji: '📞'
  }
];

// Preferred Activities
export const PREFERRED_ACTIVITIES = [
  { id: 'running', title: 'Running', emoji: '🏃' },
  { id: 'walking', title: 'Walking', emoji: '🚶' },
  { id: 'cycling', title: 'Cycling', emoji: '🚴' },
  { id: 'swimming', title: 'Swimming', emoji: '🏊' },
  { id: 'strength_training', title: 'Strength Training', emoji: '💪' },
  { id: 'yoga', title: 'Yoga', emoji: '🧘' },
  { id: 'pilates', title: 'Pilates', emoji: '🤸' },
  { id: 'crossfit', title: 'CrossFit', emoji: '🏋️' },
  { id: 'basketball', title: 'Basketball', emoji: '🏀' },
  { id: 'tennis', title: 'Tennis', emoji: '🎾' },
  { id: 'soccer', title: 'Soccer', emoji: '⚽' },
  { id: 'hiking', title: 'Hiking', emoji: '🥾' },
  { id: 'rock_climbing', title: 'Rock Climbing', emoji: '🧗' },
  { id: 'dancing', title: 'Dancing', emoji: '💃' },
  { id: 'boxing', title: 'Boxing', emoji: '🥊' },
  { id: 'martial_arts', title: 'Martial Arts', emoji: '🥋' },
  { id: 'surfing', title: 'Surfing', emoji: '🏄' },
  { id: 'skiing', title: 'Skiing', emoji: '⛷️' },
  { id: 'other', title: 'Other', emoji: '🌟' }
];

// Gender Options
export const GENDER_OPTIONS = [
  { id: 'male', title: 'Male' },
  { id: 'female', title: 'Female' },
  { id: 'non_binary', title: 'Non-binary' },
  { id: 'prefer_not_to_say', title: 'Prefer not to say' }
];

// Relationship Status Options
export const RELATIONSHIP_STATUS_OPTIONS = [
  { id: 'single', title: 'Single' },
  { id: 'in_relationship', title: 'In a relationship' },
  { id: 'married', title: 'Married' },
  { id: 'prefer_not_to_say', title: 'Prefer not to say' }
];

// Onboarding Progress State
export interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  isComplete: boolean;
  lastSavedAt: string;
  userId: string;
}

// Service Types
export interface SaveOnboardingProgressParams {
  step: number;
  data: Partial<OnboardingFormData>;
  profileImage?: string | null; // React Native uses string for image URIs
  selectedHobbies?: string[];
  location?: any;
}

export interface OnboardingValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

// Navigation Types
export interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

// Step Progress Types
export interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number[];
}