import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text,
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  BackHandler
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/hooks/useAuth';
import { useOnboarding, useSaveOnboardingProgress, useCompleteOnboarding } from '@/hooks/use-onboarding-progress';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, layout, text } from '@/utils/styles';
import { MobileLayout } from '@/components/layouts/MobileLayout';

import { StepProgress } from './StepProgress';
import { OnboardingNavigation } from './OnboardingNavigation';
import { OnboardingFormData, OnboardingValidationResult } from '@/types/onboarding';

// Import step components - Updated to match web flow
import { IdentityPersonalInfoStep } from './steps/IdentityPersonalInfoStep';
import { GoalSettingStep } from './steps/GoalSettingStep';
import { MovementSnapshotStep } from './steps/MovementSnapshotStep';
import { AccessConstraintsStep } from './steps/AccessConstraintsStep';
import { WeeklyCommitmentStep } from './steps/WeeklyCommitmentStep';
import { MoaiSetupStep } from './steps/MoaiSetupStep';

interface OnboardingNavigatorProps {
  initialStep?: number;
}

export const OnboardingNavigator = ({ initialStep = 0 }: OnboardingNavigatorProps) => {
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();
  const { 
    currentStep: savedStep, 
    profileData, 
    isLoading: onboardingLoading 
  } = useOnboarding();
  
  const saveProgress = useSaveOnboardingProgress();
  const completeOnboarding = useCompleteOnboarding();

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    lastName: '',
    birthDate: '',
    height: null,
    weight: null,
    measurementSystem: 'imperial',
    profileImage: null,
    fitnessGoals: [],
    movementActivities: {},
    equipmentAccess: [],
    physicalLimitations: '',
    weeklyCommitment: {},
    moaiPath: '',
    selectedMoaiType: undefined,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});
  const [stepValidationAttempted, setStepValidationAttempted] = useState(false);

  const totalSteps = 6; // Match web's 6-step flow (0-5)

  // Initialize form data from saved profile data
  useEffect(() => {
    if (profileData) {
      setFormData(prev => ({
        ...prev,
        ...profileData,
      }));
    }
  }, [profileData]);

  // Initialize current step from saved progress
  useEffect(() => {
    if (savedStep > 0 && savedStep !== currentStep) {
      setCurrentStep(savedStep);
    }
  }, [savedStep]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep > 0) {
        handleBack();
        return true; // Prevent default behavior
      }
      
      // Show confirmation dialog for leaving onboarding
      Alert.alert(
        'Exit Onboarding',
        'Are you sure you want to exit? Your progress will be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => router.back() }
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [currentStep, router]);

  const steps = [
    IdentityPersonalInfoStep,
    GoalSettingStep,
    MovementSnapshotStep,
    AccessConstraintsStep,
    WeeklyCommitmentStep,
    MoaiSetupStep,
  ];

  const validateCurrentStep = (): OnboardingValidationResult => {
    const newErrors: Partial<Record<keyof OnboardingFormData, string>> = {};
    
    switch (currentStep) {
      case 0: // Personal Info (Identity & Personal Info)
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        break;
        
      case 1: // Goal Setting
        if (!formData.fitnessGoals || formData.fitnessGoals.length === 0) {
          newErrors.fitnessGoals = 'Please select at least one fitness goal';
        }
        break;
        
      case 2: // Movement Snapshot
        if (!formData.movementActivities || Object.keys(formData.movementActivities).length === 0) {
          newErrors.movementActivities = 'Please add at least one activity';
        }
        break;
        
      case 3: // Access & Constraints
        if (!formData.equipmentAccess || formData.equipmentAccess.length === 0) {
          newErrors.equipmentAccess = 'Please select at least one equipment option';
        }
        break;
        
      case 4: // Weekly Commitment
        if (!formData.weeklyCommitment || 
            !formData.weeklyCommitment.daysPerWeek || 
            !formData.weeklyCommitment.minutesPerSession) {
          newErrors.weeklyCommitment = 'Please set your weekly commitment';
        }
        break;
        
      case 5: // Moai Setup - optional
        break;
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  const handleInputChange = (field: any, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field as keyof OnboardingFormData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof OnboardingFormData];
        return newErrors;
      });
    }
  };

  const handleNext = async () => {
    setStepValidationAttempted(true);
    
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      return;
    }

    // Save progress for current step
    try {
      const result = await saveProgress.mutateAsync({
        step: currentStep,
        data: formData,
        profileImage: formData.profileImage,
        selectedHobbies: formData.hobbies,
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to save progress');
        return;
      }

      // Move to next step or complete onboarding
      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
        setStepValidationAttempted(false);
      } else {
        // Complete onboarding
        await handleComplete();
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setStepValidationAttempted(false);
    }
  };

  const handleComplete = async () => {
    try {
      const result = await completeOnboarding.mutateAsync(formData);
      
      if (result.success) {
        Alert.alert(
          'Welcome to Moai!', 
          'Your profile is complete. Let\'s start your fitness journey!',
          [
            { 
              text: 'Get Started', 
              onPress: () => router.replace('/(tabs)') 
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };

  const handleSkip = () => {
    // Only allow skipping optional steps
    const optionalSteps = [1]; // Profile photo step
    
    if (optionalSteps.includes(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setStepValidationAttempted(false);
    }
  };

  if (onboardingLoading) {
    return (
      <MobileLayout scrollable={false} safeArea={true} padding={false}>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.p(6), {
          backgroundColor: colors.background
        })}>
          <Text style={tw(text.base, { color: colors.foreground })}>
            Loading onboarding...
          </Text>
        </View>
      </MobileLayout>
    );
  }

  const CurrentStepComponent = steps[currentStep];
  const canGoBack = currentStep > 0;
  const canGoNext = !saveProgress.isPending && !completeOnboarding.isPending;
  const isLoading = saveProgress.isPending || completeOnboarding.isPending;

  return (
    <KeyboardAvoidingView 
      style={tw(layout.flex1)} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <MobileLayout scrollable={false} safeArea={true} padding={false}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        
        <ScrollView
          style={tw(layout.flex1)}
          contentContainerStyle={tw(spacing.p(6), spacing.pb(8))}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bounces={true}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          {/* Progress Indicator */}
          <StepProgress 
            currentStep={currentStep} 
            totalSteps={totalSteps}
          />

          {/* Current Step Content */}
          <View style={tw(layout.flex1)}>
            <CurrentStepComponent
              formData={formData}
              onChange={handleInputChange}
              errors={errors}
              stepValidationAttempted={stepValidationAttempted}
              onNext={handleNext}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          </View>

          {/* Navigation */}
          <OnboardingNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            canGoBack={canGoBack}
            canGoNext={canGoNext}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={currentStep === 1 ? handleSkip : undefined} // Only allow skip on profile photo
            isLoading={isLoading}
          />
        </ScrollView>
      </MobileLayout>
    </KeyboardAvoidingView>
  );
};