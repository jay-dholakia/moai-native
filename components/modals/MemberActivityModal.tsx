import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { X, Calendar, Activity, Trophy } from 'lucide-react-native';
import { format } from 'date-fns';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MemberWeeklyProgressData } from '@/hooks/use-moai-progress';

interface ActivityLog {
  id: string;
  activity_name: string;
  activity_type?: string;
  duration_minutes?: number;
  created_at: string;
  notes?: string;
}

interface MemberActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberWeeklyProgressData | null;
  selectedDate: Date | null;
  activities?: ActivityLog[];
}

export const MemberActivityModal: React.FC<MemberActivityModalProps> = ({
  isOpen,
  onClose,
  member,
  selectedDate,
  activities = [],
}) => {
  const { colors } = useTheme();

  if (!member || !selectedDate) return null;

  const displayName = `${member.first_name} ${member.last_name || ''}`.trim();
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');

  // Filter activities for the selected date
  const dayActivities = activities.filter(activity => 
    format(new Date(activity.created_at), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.px(4), spacing.py(4), border.borderB),
          { borderBottomColor: colors.border }
        ]}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Image
              source={{ uri: member.profile_image || '/placeholder.svg' }}
              style={tw(spacing.w(8), spacing.h(8), border.rounded)}
            />
            <View>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                {displayName}
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {formattedDate}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={onClose}
            style={[
              tw(spacing.w(8), spacing.h(8), border.rounded, layout.itemsCenter, layout.justifyCenter),
              { backgroundColor: colors.muted }
            ]}
          >
            <X size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={tw(layout.flex1)} 
          contentContainerStyle={tw(spacing.p(4), spacing.gap(4))}
        >
          {/* Activity Summary Card */}
          <Card>
            <CardContent style={tw(spacing.p(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(3))}>
                <Calendar size={16} color={colors.primary} />
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  Daily Summary
                </Text>
              </View>
              
              <View style={tw(layout.flexRow, spacing.gap(4))}>
                <View style={tw(layout.itemsCenter, spacing.gap(1))}>
                  <Text style={[tw(text.xl, text.bold), { color: colors.primary }]}>
                    {dayActivities.length}
                  </Text>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Activities
                  </Text>
                </View>
                
                <View style={tw(layout.itemsCenter, spacing.gap(1))}>
                  <Text style={[tw(text.xl, text.bold), { color: colors.primary }]}>
                    {dayActivities.reduce((total, activity) => total + (activity.duration_minutes || 0), 0)}
                  </Text>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Minutes
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Activities List */}
          <Card>
            <CardContent style={tw(spacing.p(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(3))}>
                <Activity size={16} color={colors.primary} />
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  Activities ({dayActivities.length})
                </Text>
              </View>

              {dayActivities.length === 0 ? (
                <View style={tw(spacing.py(8), layout.itemsCenter)}>
                  <Activity size={48} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
                  <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    No activities logged for this day
                  </Text>
                </View>
              ) : (
                <View style={tw(spacing.gap(3))}>
                  {dayActivities.map((activity, index) => (
                    <View
                      key={activity.id}
                      style={[
                        tw(spacing.p(3), border.rounded),
                        { backgroundColor: colors.muted }
                      ]}
                    >
                      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(1))}>
                        <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                          {activity.activity_name}
                        </Text>
                        {activity.duration_minutes && (
                          <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                            {activity.duration_minutes} min
                          </Text>
                        )}
                      </View>
                      
                      {activity.activity_type && (
                        <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                          {activity.activity_type}
                        </Text>
                      )}
                      
                      {activity.notes && (
                        <Text style={[tw(text.xs, spacing.mt(2)), { color: colors.mutedForeground }]}>
                          {activity.notes}
                        </Text>
                      )}
                      
                      <Text style={[tw(text.xs, spacing.mt(2)), { color: colors.mutedForeground }]}>
                        {format(new Date(activity.created_at), 'h:mm a')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>

          {/* Weekly Progress Context */}
          <Card>
            <CardContent style={tw(spacing.p(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(3))}>
                <Trophy size={16} color={colors.primary} />
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  Weekly Progress
                </Text>
              </View>
              
              <View style={tw(spacing.gap(2))}>
                <View style={tw(layout.flexRow, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Days Completed
                  </Text>
                  <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                    {member.daysCompleted} / {member.movementDaysGoal}
                  </Text>
                </View>
                
                <View style={tw(layout.flexRow, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Commitment Status
                  </Text>
                  <Text style={[
                    tw(text.sm, text.medium),
                    { color: member.metCommitment ? '#059669' : '#F59E0B' } // green or amber
                  ]}>
                    {member.metCommitment ? 'Complete' : 'In Progress'}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </ScrollView>

        {/* Footer */}
        <View style={[
          tw(spacing.p(4), border.borderT),
          { borderTopColor: colors.border }
        ]}>
          <Button onPress={onClose} variant="outline">
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
};

export default MemberActivityModal;