import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

import { useTheme } from '@/providers/theme-provider';
import { tw, layout, text, spacing, border } from '@/utils/styles';

const STEPS = [
  { id: 'intro', title: 'Welcome' },
  { id: 'details', title: 'Details' },
  { id: 'settings', title: 'Settings' },
  { id: 'invite', title: 'Invite' },
];

export function MoaiCreationModal({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle final step
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <MoaiIntroStep />;
      default:
        return (
          <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
            <Text style={{ color: colors.foreground }}>Step {currentStep + 1} Content</Text>
          </View>
        );
    }
  };

  return (
    <View style={tw(layout.flex1, `bg-black/60`, layout.justifyEnd)}>
      <View style={[{ backgroundColor: colors.background }, tw(`h-5/6`, border.roundedLg)]}>
        {/* Header */}
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), { borderBottomWidth: 1, borderColor: colors.border })}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            {STEPS[currentStep].title}
          </Text>
          <Pressable onPress={onClose} style={tw(spacing.p(2))}>
            <X size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Step Indicator */}
        <View style={tw(layout.flexRow, layout.justifyCenter, spacing.py(4))}>
          {STEPS.map((step, index) => (
            <View key={step.id} style={tw(layout.flexRow, layout.itemsCenter)}>
              <View
                style={[
                  tw(`w-8 h-8`, border.roundedFull, layout.itemsCenter, layout.justifyCenter),
                  {
                    backgroundColor: index <= currentStep ? colors.primary : colors.muted,
                  },
                ]}
              >
                <Text style={[tw(text.xs, text.medium), { color: index <= currentStep ? colors.primaryForeground : colors.mutedForeground }]}>
                  {index + 1}
                </Text>
              </View>
              {index < STEPS.length - 1 && (
                <View style={tw(`w-8 h-0.5 mx-1`, { backgroundColor: index < currentStep ? colors.primary : colors.muted })} />
              )}
            </View>
          ))}
        </View>

        {/* Content */}
        <View style={tw(layout.flex1, spacing.p(4))}>
          {renderStepContent()}
        </View>

        {/* Footer */}
        <View style={tw(layout.flexRow, layout.justifyBetween, spacing.p(4), { borderTopWidth: 1, borderColor: colors.border })}>
          <Pressable
            onPress={handleBack}
            disabled={currentStep === 0}
            style={tw(
              spacing.px(4),
              spacing.py(2),
              border.rounded,
              { backgroundColor: colors.secondary },
              currentStep === 0 && 'opacity-50'
            )}
          >
            <Text style={{ color: colors.secondaryForeground }}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleNext}
            style={tw(spacing.px(4), spacing.py(2), border.rounded, { backgroundColor: colors.primary })}
          >
            <Text style={{ color: colors.primaryForeground }}>
              {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MoaiIntroStep() {
  const { colors } = useTheme();
  return (
    <View style={tw(layout.flex1, layout.justifyCenter, layout.itemsCenter, spacing.p(4))}>
      <Text style={[tw(text.xl, text.bold, text.center, spacing.mb(4)), { color: colors.foreground }]}>
        Welcome to Moai Creation!
      </Text>
      <Text style={[tw(text.base, text.center), { color: colors.mutedForeground }]}>
        Let&apos;s get started on building your community.
      </Text>
    </View>
  );
}