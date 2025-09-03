import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { UserBadge } from '@/services/badge-service';
import { Ionicons } from '@expo/vector-icons';

interface BadgeCelebrationModalProps {
  visible: boolean;
  badge: UserBadge | null;
  onClose: () => void;
  onViewDetails?: (badge: UserBadge) => void;
  showProgress?: boolean;
  progress?: number;
}

export const BadgeCelebrationModal: React.FC<BadgeCelebrationModalProps> = ({
  visible,
  badge,
  onClose,
  onViewDetails,
  showProgress = false,
  progress = 0,
}) => {
  const { colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (visible && badge) {
      // Animate in
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Animate out
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, badge, scaleValue]);
  
  if (!badge) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[
        tw(layout.flex1, layout.itemsCenter, layout.justifyCenter),
        { backgroundColor: 'rgba(0,0,0,0.5)' }
      ]}>
        <Animated.View 
          style={[
            tw(spacing.mx(6), spacing.p(8), border.rounded),
            {
              backgroundColor: colors.background,
              transform: [{ scale: scaleValue }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }
          ]}
        >
          {/* Celebration Header */}
          <View style={tw(layout.itemsCenter, spacing.mb(6))}>
            <Text style={[tw(text.xl, text.bold, text.center), { color: colors.primary }]}>
              🎉 Badge Earned! 🎉
            </Text>
          </View>
          
          {/* Badge Display */}
          <View style={tw(layout.itemsCenter, spacing.mb(6))}>
            <View style={[
              tw(spacing.w(20), spacing.h(20), layout.itemsCenter, layout.justifyCenter, spacing.mb(4), border.rounded),
              {
                backgroundColor: colors.primary + '20',
                borderWidth: 3,
                borderColor: colors.primary,
              }
            ]}>
              <Text style={tw(text.xl)}>{badge.badge_icon}</Text>
            </View>
            
            <Text style={[tw(text.xl, text.bold, text.center), { color: colors.foreground }]}>
              {badge.badge_name}
            </Text>
            
            <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              {badge.badge_description}
            </Text>
            
            {badge.milestone_value && (
              <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                {badge.milestone_value} activities milestone
              </Text>
            )}
          </View>
          
          {/* Celebration Message */}
          <View style={tw(spacing.mb(6))}>
            <Text style={[tw(text.base, text.center), { color: colors.foreground }]}>
              Awesome work! Keep up the momentum and continue your fitness journey.
            </Text>
          </View>
          
          {/* Progress Indicator */}
          {showProgress && (
            <View style={tw(spacing.mb(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2))}>
                <Ionicons name="trophy" size={16} color={colors.primary} />
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  Badge {progress}% celebration complete
                </Text>
              </View>
              <View 
                style={[
                  tw(spacing.mt(2), border.rounded),
                  { height: 4, backgroundColor: colors.muted }
                ]}
              >
                <View 
                  style={[
                    tw(border.rounded),
                    { 
                      height: '100%', 
                      backgroundColor: colors.primary,
                      width: `${progress}%`
                    }
                  ]} 
                />
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={tw(spacing.gap(3))}>
            {onViewDetails && (
              <TouchableOpacity
                onPress={() => badge && onViewDetails(badge)}
                style={[
                  tw(spacing.py(3), spacing.px(6), border.rounded, layout.itemsCenter, border.border),
                  { borderColor: colors.border }
                ]}
              >
                <Text style={[tw(text.base, text.medium), { color: colors.foreground }]}>
                  View Details
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={onClose}
              style={[
                tw(spacing.py(3), spacing.px(6), border.rounded, layout.itemsCenter),
                { backgroundColor: colors.primary }
              ]}
            >
              <Text style={[tw(text.base, text.medium), { color: colors.primaryForeground }]}>
                {showProgress && progress < 100 ? 'Next Badge' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};