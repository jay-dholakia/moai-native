import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCoachOnboarding } from '@/hooks/use-coach-platform';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface CoachOnboardingProps {
  onStartCoaching?: () => void;
  onCompleteProfile?: () => void;
  onApplyToCoach?: () => void;
}

export const CoachOnboarding: React.FC<CoachOnboardingProps> = ({
  onStartCoaching,
  onCompleteProfile,
  onApplyToCoach,
}) => {
  const { colors } = useTheme();
  
  const {
    isCoach,
    hasProfile,
    profileComplete,
    isActive,
    completionPercentage,
    nextStep,
    isLoading,
  } = useCoachOnboarding();

  if (isLoading) {
    return (
      <View style={tw(layout.itemsCenter, spacing.py(6))}>
        <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
          Loading coach status...
        </Text>
      </View>
    );
  }

  if (isActive && profileComplete) {
    return (
      <Card elevation="sm">
        <LinearGradient
          colors={[colors.primary + '10', colors.primary + '05'] as [string, string, ...string[]]}
          style={tw(spacing.p(6), border.rounded)}
        >
          <View style={tw(layout.itemsCenter, spacing.gap(4))}>
            <View style={[
              tw(spacing.w(16), spacing.h(16), layout.itemsCenter, layout.justifyCenter, border.rounded),
              { backgroundColor: colors.primary + '20' }
            ]}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            
            <View style={tw(layout.itemsCenter)}>
              <Text style={[tw(text.lg, text.semibold, text.center), { color: colors.foreground }]}>
                Welcome, Coach! 🎉
              </Text>
              <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                Your coaching profile is active and ready to accept clients.
              </Text>
            </View>

            <Button
              onPress={onStartCoaching}
              variant="default"
              size="lg"
              style={tw(layout.wFull)}
            >
              Go to Coach Dashboard
            </Button>
          </View>
        </LinearGradient>
      </Card>
    );
  }

  return (
    <Card elevation="sm">
      <View style={tw(spacing.p(6))}>
        {/* Progress Header */}
        <View style={tw(layout.itemsCenter, spacing.mb(6))}>
          <View style={[
            tw(spacing.w(16), spacing.h(16), layout.itemsCenter, layout.justifyCenter, border.rounded),
            { backgroundColor: colors.primary + '20' }
          ]}>
            <Ionicons name="school" size={32} color={colors.primary} />
          </View>
          
          <Text style={[tw(text.lg, text.semibold, spacing.mt(4), text.center), { color: colors.foreground }]}>
            Become a MOAI Coach
          </Text>
          <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
            Help others achieve their fitness goals and earn income
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={tw(spacing.mb(6))}>
          <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(2))}>
            <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
              Setup Progress
            </Text>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {Math.round(completionPercentage)}%
            </Text>
          </View>
          
          <View style={[
            tw(spacing.h(2), border.rounded),
            { backgroundColor: colors.muted }
          ]}>
            <View style={[
              tw(layout.hFull, border.rounded),
              {
                backgroundColor: colors.primary,
                width: `${completionPercentage}%`,
              }
            ]} />
          </View>
        </View>

        {/* Steps Checklist */}
        <View style={tw(spacing.gap(3), spacing.mb(6))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Ionicons 
              name={isCoach ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={isCoach ? colors.primary : colors.mutedForeground} 
            />
            <Text style={[
              tw(text.sm),
              { color: isCoach ? colors.foreground : colors.mutedForeground }
            ]}>
              Apply to become a coach
            </Text>
          </View>
          
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Ionicons 
              name={hasProfile ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={hasProfile ? colors.primary : colors.mutedForeground} 
            />
            <Text style={[
              tw(text.sm),
              { color: hasProfile ? colors.foreground : colors.mutedForeground }
            ]}>
              Set up coach profile
            </Text>
          </View>
          
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Ionicons 
              name={profileComplete ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={profileComplete ? colors.primary : colors.mutedForeground} 
            />
            <Text style={[
              tw(text.sm),
              { color: profileComplete ? colors.foreground : colors.mutedForeground }
            ]}>
              Add bio and specialties
            </Text>
          </View>
          
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Ionicons 
              name={isActive ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={isActive ? colors.primary : colors.mutedForeground} 
            />
            <Text style={[
              tw(text.sm),
              { color: isActive ? colors.foreground : colors.mutedForeground }
            ]}>
              Activate coaching profile
            </Text>
          </View>
        </View>

        {/* Next Step Action */}
        <View style={tw(spacing.gap(3))}>
          {!isCoach && (
            <Button
              onPress={onApplyToCoach}
              variant="default"
              size="lg"
            >
              Apply to Become Coach
            </Button>
          )}
          
          {isCoach && !profileComplete && (
            <Button
              onPress={onCompleteProfile}
              variant="default"
              size="lg"
            >
              Complete Profile Setup
            </Button>
          )}
          
          {isCoach && profileComplete && !isActive && (
            <Button
              onPress={onCompleteProfile}
              variant="default"
              size="lg"
            >
              Activate Profile
            </Button>
          )}
          
          <Text style={[tw(text.xs, text.center), { color: colors.mutedForeground }]}>
            Next: {nextStep}
          </Text>
        </View>

        {/* Benefits Section */}
        <View style={[tw(spacing.mt(6), spacing.pt(6), border.borderT), { borderTopColor: colors.border }]}>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Coach Benefits
          </Text>
          
          <View style={tw(spacing.gap(2))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <Ionicons name="cash" size={16} color={colors.primary} />
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                Earn $79-199/month per client
              </Text>
            </View>
            
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <Ionicons name="people" size={16} color={colors.primary} />
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                Build meaningful client relationships
              </Text>
            </View>
            
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                Flexible schedule that works for you
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
};

export default CoachOnboarding;