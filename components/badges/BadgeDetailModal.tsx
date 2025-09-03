import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { UserBadge } from '@/services/badge-service';
import { Ionicons } from '@expo/vector-icons';

interface BadgeDetailModalProps {
  visible: boolean;
  badge: UserBadge | null;
  onClose: () => void;
  onContinue?: () => void;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  visible,
  badge,
  onClose,
  onContinue,
}) => {
  const { colors } = useTheme();
  
  if (!badge) return null;
  
  const earnedDate = new Date(badge.earned_at);
  const isMilestone = badge.badge_type === 'milestone';
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
        {/* Header */}
        <View 
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB, border.border),
            { backgroundColor: colors.card, borderBottomColor: colors.border }
          ]}
        >
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Badge Details
          </Text>
          
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(6))}>
          {/* Badge Display */}
          <View style={tw(layout.itemsCenter, spacing.mb(8))}>
            <View style={[
              tw(spacing.w(32), spacing.h(32), layout.itemsCenter, layout.justifyCenter, spacing.mb(4), border.rounded),
              {
                backgroundColor: colors.primary + '20',
                borderWidth: 4,
                borderColor: colors.primary,
              }
            ]}>
              <Text style={tw(text.xl)}>{badge.badge_icon}</Text>
            </View>
            
            <Text style={[tw(text['2xl'], text.bold, text.center), { color: colors.foreground }]}>
              {badge.badge_name}
            </Text>
            
            <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              {badge.badge_description}
            </Text>
          </View>

          {/* Badge Information */}
          <View style={tw(spacing.gap(4))}>
            {/* Badge Type */}
            <View style={[
              tw(spacing.p(4), border.rounded),
              { backgroundColor: colors.secondary }
            ]}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Ionicons 
                  name={isMilestone ? "trending-up" : "star"} 
                  size={20} 
                  color={colors.primary} 
                />
                <View style={tw(layout.flex1)}>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    Badge Type
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {isMilestone ? 'Milestone Achievement' : 'Moai Mover'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Milestone Value */}
            {badge.milestone_value && (
              <View style={[
                tw(spacing.p(4), border.rounded),
                { backgroundColor: colors.secondary }
              ]}>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                  <Ionicons name="fitness" size={20} color={colors.primary} />
                  <View style={tw(layout.flex1)}>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                      Activities Milestone
                    </Text>
                    <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                      {badge.milestone_value} activities completed
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Earned Date */}
            <View style={[
              tw(spacing.p(4), border.rounded),
              { backgroundColor: colors.secondary }
            ]}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <View style={tw(layout.flex1)}>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    Earned On
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {earnedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    {earnedDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Achievement Story */}
            <View style={[
              tw(spacing.p(4), border.rounded),
              { backgroundColor: colors.secondary }
            ]}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(3))}>
                <Ionicons name="book" size={20} color={colors.primary} />
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  Your Achievement
                </Text>
              </View>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {isMilestone 
                  ? `You've reached an incredible milestone! ${badge.milestone_value} activities shows your dedication to fitness and personal growth. Each activity brings you closer to your goals and strengthens your commitment to a healthy lifestyle.`
                  : `Congratulations on becoming a Moai Mover! This badge represents your active participation in the community and your commitment to supporting others on their fitness journey.`
                }
              </Text>
            </View>

            {/* Motivational Message */}
            <View style={[
              tw(spacing.p(4), border.rounded, border.border),
              { 
                backgroundColor: colors.primary + '10',
                borderColor: colors.primary + '30'
              }
            ]}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(2))}>
                <Ionicons name="flash" size={20} color={colors.primary} />
                <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                  Keep Going!
                </Text>
              </View>
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                This badge is proof of your progress. Stay consistent, keep challenging yourself, and watch as you unlock even more achievements on your fitness journey!
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View 
          style={[
            tw(spacing.p(4), border.borderT, border.border),
            { backgroundColor: colors.card, borderTopColor: colors.border }
          ]}
        >
          <View style={tw(layout.flexRow, spacing.gap(3))}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                tw(layout.flex1, spacing.py(3), border.rounded, layout.itemsCenter, border.border),
                { borderColor: colors.border }
              ]}
            >
              <Text style={[tw(text.base, text.medium), { color: colors.foreground }]}>
                Close
              </Text>
            </TouchableOpacity>
            
            {onContinue && (
              <TouchableOpacity
                onPress={onContinue}
                style={[
                  tw(layout.flex1, spacing.py(3), border.rounded, layout.itemsCenter),
                  { backgroundColor: colors.primary }
                ]}
              >
                <Text style={[tw(text.base, text.medium), { color: colors.primaryForeground }]}>
                  Continue Celebration
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};