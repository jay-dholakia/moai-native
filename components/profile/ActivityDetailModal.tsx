import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { Button } from '@/components/ui/Button';
import { ActivityLog, ActivityLogService } from '@/services/activity-log-service';

interface ActivityDetailModalProps {
  visible: boolean;
  activity: ActivityLog | null;
  onClose: () => void;
  onEdit?: (activity: ActivityLog) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  visible,
  activity,
  onClose,
  onEdit
}) => {
  const { theme, colors } = useTheme();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ActivityLogService.deleteActivity(id),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userActivities'] });
      queryClient.invalidateQueries({ queryKey: ['profileStats'] });
      queryClient.invalidateQueries({ queryKey: ['tokenHistory'] });
      
      Alert.alert(
        'Activity Deleted',
        'Your activity has been successfully deleted.',
        [{ text: 'OK', onPress: () => onClose() }]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Delete Failed',
        error?.message || 'Failed to delete activity. Please try again.',
        [{ text: 'OK' }]
      );
    }
  });

  const handleDeletePress = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (activity?.id) {
      deleteMutation.mutate(activity.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleEditPress = () => {
    if (activity && onEdit) {
      onEdit(activity);
    }
    onClose();
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not specified';
    
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatMuscleGroups = (muscleGroups: any[] | null) => {
    if (!muscleGroups || muscleGroups.length === 0) return 'Not specified';
    if (Array.isArray(muscleGroups)) {
      return muscleGroups.map(group => typeof group === 'string' ? group : JSON.stringify(group)).join(', ');
    }
    return JSON.stringify(muscleGroups);
  };

  if (!activity) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={onClose}
      >
        <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
          {/* Header */}
          <View 
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), spacing.pt(12)),
              { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }
            ]}
          >
            <Text style={tw(text.lg, text.bold, text.foreground(theme))}>
              Activity Details
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={tw(layout.flex1)}
            contentContainerStyle={tw(spacing.p(4), spacing.pb(20))}
            showsVerticalScrollIndicator={false}
          >
            {/* Activity Header */}
            <View 
              style={[
                tw(layout.itemsCenter, spacing.p(6), border.rounded, spacing.mb(6)),
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
              ]}
            >
              <Text style={tw(text['4xl'], spacing.mb(2))}>
                {activity.emoji}
              </Text>
              <Text style={tw(text.xl, text.bold, text.foreground(theme), text.center)}>
                {activity.activity_type}
              </Text>
              <Text style={tw(text.sm, text.muted(theme), text.center, spacing.mt(2))}>
                {format(new Date(activity.logged_at), 'EEEE, MMMM d, yyyy • h:mm a')}
              </Text>
            </View>

            {/* Activity Details */}
            <View 
              style={[
                tw(spacing.p(4), border.rounded, spacing.mb(6)),
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
              ]}
            >
              <Text style={tw(text.base, text.bold, text.foreground(theme), spacing.mb(4))}>
                Details
              </Text>

              {/* Duration */}
              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
                <Text style={tw(text.sm, text.muted(theme))}>Duration</Text>
                <Text style={tw(text.sm, text.foreground(theme))}>
                  {formatDuration(activity.duration_minutes)}
                </Text>
              </View>

              {/* Location */}
              {activity.location && (
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
                  <Text style={tw(text.sm, text.muted(theme))}>Location</Text>
                  <Text style={tw(text.sm, text.foreground(theme))}>
                    {activity.location}
                  </Text>
                </View>
              )}

              {/* Muscle Groups */}
              <View style={tw(layout.flexRow, layout.itemsStart, layout.justifyBetween, spacing.mb(3))}>
                <Text style={tw(text.sm, text.muted(theme))}>Muscle Groups</Text>
                <Text style={tw(text.sm, text.foreground(theme), text.right, layout.flex1, spacing.ml(4))}>
                  {formatMuscleGroups(activity.muscle_groups)}
                </Text>
              </View>

              {/* Activity Partners */}
              {activity.activity_partners && activity.activity_partners.length > 0 && (
                <View style={tw(layout.flexRow, layout.itemsStart, layout.justifyBetween, spacing.mb(3))}>
                  <Text style={tw(text.sm, text.muted(theme))}>Partners</Text>
                  <Text style={tw(text.sm, text.foreground(theme), text.right, layout.flex1, spacing.ml(4))}>
                    {Array.isArray(activity.activity_partners)
                      ? activity.activity_partners.map(partner => typeof partner === 'string' ? partner : JSON.stringify(partner)).join(', ')
                      : JSON.stringify(activity.activity_partners)}
                  </Text>
                </View>
              )}
            </View>

            {/* Notes */}
            {activity.notes && (
              <View 
                style={[
                  tw(spacing.p(4), border.rounded, spacing.mb(6)),
                  { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
                ]}
              >
                <Text style={tw(text.base, text.bold, text.foreground(theme), spacing.mb(3))}>
                  Notes
                </Text>
                <Text style={tw(text.sm, text.foreground(theme))}>
                  {activity.notes}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(6))}>
              {onEdit && (
                <Button
                  onPress={handleEditPress}
                  variant="outline"
                  style={tw(layout.flex1)}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                    <Ionicons name="pencil" size={16} color={colors.foreground} />
                    <Text style={[tw(text.sm), { color: colors.foreground }]}>
                      Edit
                    </Text>
                  </View>
                </Button>
              )}
              
              <Button
                onPress={handleDeletePress}
                variant="destructive"
                style={tw(layout.flex1)}
                loading={deleteMutation.isPending}
              >
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={tw(text.sm, { color: 'white' })}>
                    Delete
                  </Text>
                </View>
              </Button>
            </View>

            {/* Metadata */}
            <View 
              style={[
                tw(spacing.p(4), border.rounded),
                { backgroundColor: colors.muted + '20', borderWidth: 1, borderColor: colors.border }
              ]}
            >
              <Text style={tw(text.xs, text.muted(theme), text.center, spacing.mb(2))}>
                Activity Metadata
              </Text>
              <Text style={tw(text.xs, text.muted(theme), text.center)}>
                Created: {format(new Date(activity.created_at), 'MMM d, yyyy • h:mm a')}
              </Text>
              {activity.updated_at !== activity.created_at && (
                <Text style={tw(text.xs, text.muted(theme), text.center, spacing.mt(1))}>
                  Last updated: {format(new Date(activity.updated_at), 'MMM d, yyyy • h:mm a')}
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Alert */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={[tw(layout.flex1, layout.itemsCenter, layout.justifyCenter), { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View 
            style={[
              tw(spacing.p(6), spacing.m(4), border.rounded),
              { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, maxWidth: 340 }
            ]}
          >
            <View style={tw(layout.itemsCenter, spacing.mb(4))}>
              <View 
                style={[
                  tw(layout.itemsCenter, layout.justifyCenter, border.rounded, spacing.mb(3)),
                  { width: 60, height: 60, backgroundColor: colors.destructive + '20' }
                ]}
              >
                <Ionicons name="warning" size={28} color={colors.destructive} />
              </View>
              <Text style={tw(text.lg, text.bold, text.foreground(theme), text.center)}>
                Delete Activity
              </Text>
            </View>

            <Text style={tw(text.sm, text.muted(theme), text.center, spacing.mb(6))}>
              Are you sure you want to delete this activity? This action cannot be undone and will also affect your token balance.
            </Text>

            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <Button
                onPress={() => setShowDeleteConfirm(false)}
                variant="outline"
                style={tw(layout.flex1)}
              >
                Cancel
              </Button>
              <Button
                onPress={handleConfirmDelete}
                variant="destructive"
                style={tw(layout.flex1)}
                loading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};