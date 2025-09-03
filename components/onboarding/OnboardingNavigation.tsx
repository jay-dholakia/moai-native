import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Button } from '@/components/ui/Button';
import { OnboardingNavigationProps } from '@/types/onboarding';

export const OnboardingNavigation = ({
  currentStep,
  totalSteps,
  canGoBack,
  canGoNext,
  onNext,
  onBack,
  onSkip,
  isLoading = false,
}: OnboardingNavigationProps) => {
  const { colors } = useTheme();

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View style={tw(spacing.mt(8))}>
      <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
        {/* Back Button */}
        {canGoBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[
              tw(layout.flexRow, layout.itemsCenter, spacing.px(4), spacing.py(3), border.rounded),
              { backgroundColor: colors.muted }
            ]}
            disabled={isLoading}
          >
            <ArrowLeft size={16} color={colors.foreground} style={tw(spacing.mr(2))} />
            <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
              Back
            </Text>
          </TouchableOpacity>
        ) : (
          // Spacer element
          <View style={{ width: 64 }} />
        )}

        {/* Skip Button (if available and not last step) */}
        {onSkip && !isLastStep ? (
          <TouchableOpacity
            onPress={onSkip}
            style={tw(layout.flexRow, layout.itemsCenter, spacing.px(3), spacing.py(2))}
            disabled={isLoading}
          >
            <SkipForward size={14} color={colors.mutedForeground} style={tw(spacing.mr(1))} />
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Skip
            </Text>
          </TouchableOpacity>
        ) : (
          // Spacer element
          <View style={{ width: 64 }} />
        )}

        {/* Next/Complete Button */}
        <Button
          variant="gradient"
          size="default"
          onPress={onNext}
          disabled={!canGoNext || isLoading}
          loading={isLoading}
          style={tw(layout.flexRow, layout.itemsCenter)}
        >
          <Text style={[tw(text.sm, text.medium), { color: '#FFFFFF' }]}>
            {isLastStep ? 'Complete' : 'Next'}
          </Text>
          {!isLastStep && (
            <ArrowRight size={16} color="#FFFFFF" style={tw(spacing.ml(2))} />
          )}
        </Button>
      </View>
    </View>
  );
};