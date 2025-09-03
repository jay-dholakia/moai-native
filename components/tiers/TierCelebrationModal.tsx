import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { TierBadge } from './TierBadge';
import { TierLevel } from '@/services/tier-system-service';
import { useTierRequirements } from '@/hooks/use-tier-system';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export interface TierCelebrationModalProps {
  visible: boolean;
  oldTier: TierLevel;
  newTier: TierLevel;
  consecutiveWeeks: number;
  onClose: () => void;
  onViewProgress?: () => void;
}

export const TierCelebrationModal: React.FC<TierCelebrationModalProps> = ({
  visible,
  oldTier,
  newTier,
  consecutiveWeeks,
  onClose,
  onViewProgress,
}) => {
  const { colors } = useTheme();
  const { getTierColor, getTierDescription } = useTierRequirements();
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      sparkleAnim.setValue(0);
      slideUpAnim.setValue(50);
      fadeAnim.setValue(0);

      // Start celebration animations
      Animated.sequence([
        // Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale up tier badge
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // Slide up content and sparkle effect
        Animated.parallel([
          Animated.timing(slideUpAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            })
          ),
        ]),
      ]).start();
    }
  }, [visible]);

  const newTierColor = getTierColor(newTier);
  const newTierDescription = getTierDescription(newTier);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          tw(layout.flex1, layout.itemsCenter, layout.justifyCenter),
          {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Sparkle Background Effect */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: width * 2,
              height: height * 2,
              opacity: sparkleAnim,
            }
          ]}
        >
          {/* Create sparkle dots */}
          {Array.from({ length: 20 }).map((_, index) => (
            <Animated.View
              key={index}
              style={[
                {
                  position: 'absolute',
                  width: 4,
                  height: 4,
                  backgroundColor: newTierColor,
                  borderRadius: 2,
                  left: Math.random() * width * 2,
                  top: Math.random() * height * 2,
                  opacity: sparkleAnim,
                }
              ]}
            />
          ))}
        </Animated.View>

        {/* Main Content Card */}
        <Animated.View 
          style={[
            tw(spacing.mx(8), border.rounded),
            {
              backgroundColor: colors.card,
              transform: [{ translateY: slideUpAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          <LinearGradient
            colors={[newTierColor + '10', newTierColor + '05'] as [string, string, ...string[]]}
            style={tw(border.rounded)}
          >
            <View style={tw(spacing.p(6))}>
              {/* Header */}
              <View style={tw(layout.itemsCenter, spacing.mb(6))}>
                <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
                  🎉 Tier Promotion! 🎉
                </Text>
                <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                  Congratulations on your consistency!
                </Text>
              </View>

              {/* Tier Transition */}
              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(4), spacing.mb(6))}>
                {/* Old Tier */}
                <View style={tw(layout.itemsCenter)}>
                  <TierBadge tier={oldTier} size="lg" />
                  <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    FROM
                  </Text>
                </View>

                {/* Arrow */}
                <Ionicons 
                  name="arrow-forward" 
                  size={24} 
                  color={colors.primary}
                  style={tw(spacing.mx(2))}
                />

                {/* New Tier */}
                <Animated.View 
                  style={[
                    tw(layout.itemsCenter),
                    { transform: [{ scale: scaleAnim }] }
                  ]}
                >
                  <TierBadge tier={newTier} size="xl" />
                  <Text style={[tw(text.sm, spacing.mt(2), text.semibold), { color: newTierColor }]}>
                    TO {newTier.toUpperCase()}!
                  </Text>
                </Animated.View>
              </View>

              {/* Achievement Details */}
              <View style={tw(spacing.mb(6))}>
                <Text style={[tw(text.base, text.center, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  You achieved {newTier.toUpperCase()} tier!
                </Text>
                <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                  {newTierDescription}
                </Text>
                <Text style={[tw(text.sm, text.center, spacing.mt(2), text.semibold), { color: colors.primary }]}>
                  {consecutiveWeeks} consecutive weeks of commitment
                </Text>
              </View>

              {/* Motivational Message */}
              <View 
                style={[
                  tw(spacing.p(4), border.rounded, spacing.mb(6)),
                  { backgroundColor: newTierColor + '10' }
                ]}
              >
                <Text style={[tw(text.sm, text.center), { color: colors.foreground }]}>
                  {getMotivationalMessage(newTier)}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={tw(spacing.gap(3))}>
                {onViewProgress && (
                  <TouchableOpacity
                    onPress={() => {
                      onViewProgress();
                      onClose();
                    }}
                    style={[
                      tw(spacing.py(3), spacing.px(6), border.rounded, layout.itemsCenter),
                      { backgroundColor: newTierColor }
                    ]}
                  >
                    <Text style={[tw(text.base, text.semibold), { color: 'white' }]}>
                      View Progress Dashboard
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    tw(spacing.py(3), spacing.px(6), border.rounded, border.border, layout.itemsCenter),
                    { borderColor: colors.border }
                  ]}
                >
                  <Text style={[tw(text.base), { color: colors.foreground }]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

function getMotivationalMessage(tier: TierLevel): string {
  const messages = {
    bronze: "Great start! You're building a consistent fitness habit. Keep it up!",
    silver: "Excellent progress! Your consistency is paying off. Stay strong!",
    gold: "Outstanding commitment! You're among the most dedicated members!",
    elite: "Legendary status achieved! You're an inspiration to the entire community!",
  };
  
  return messages[tier];
}

export default TierCelebrationModal;