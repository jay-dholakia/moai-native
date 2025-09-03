import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, Text, TextInput, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { BuddyCheckIn } from '@/services/buddy-service';
import { Ionicons } from '@expo/vector-icons';

interface BuddyCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (checkInData: any) => void;
  isLoading?: boolean;
  weekStart: string;
  existingCheckIn?: BuddyCheckIn;
}

export function BuddyCheckInModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  weekStart,
  existingCheckIn
}: BuddyCheckInModalProps) {
  const { colors: themeColors } = useTheme();
  
  const [formData, setFormData] = useState({
    activities_completed: existingCheckIn?.activities_completed || 0,
    goals_met: existingCheckIn?.goals_met || false,
    notes: existingCheckIn?.notes || '',
    mood_rating: existingCheckIn?.mood_rating || 3,
  });

  useEffect(() => {
    if (visible && existingCheckIn) {
      setFormData({
        activities_completed: existingCheckIn.activities_completed,
        goals_met: existingCheckIn.goals_met,
        notes: existingCheckIn.notes || '',
        mood_rating: existingCheckIn.mood_rating || 3,
      });
    }
  }, [visible, existingCheckIn]);

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      week_start: weekStart,
    });
  };

  const renderMoodRating = () => (
    <View style={tw(spacing.mb(6))}>
      <Text style={tw(text.base, text.semibold, spacing.mb(3))}>
        How are you feeling this week?
      </Text>
      <View style={tw(layout.flexRow, layout.justifyCenter, spacing.gap(3))}>
        {Array.from({ length: 5 }).map((_, index) => {
          const rating = index + 1;
          const isSelected = rating === formData.mood_rating;
          
          return (
            <TouchableOpacity
              key={rating}
              onPress={() => setFormData(prev => ({ ...prev, mood_rating: rating }))}
              style={[
                tw(spacing.p(3), border.rounded),
                {
                  backgroundColor: isSelected ? themeColors.primary : themeColors.secondary,
                }
              ]}
            >
              <Ionicons
                name={isSelected ? "star" : "star-outline"}
                size={24}
                color={isSelected ? "white" : themeColors.foreground}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mt(2))}>
        <Text style={tw(text.xs, text.muted)}>Not great</Text>
        <Text style={tw(text.xs, text.muted)}>Amazing!</Text>
      </View>
    </View>
  );

  const renderActivityCounter = () => (
    <View style={tw(spacing.mb(6))}>
      <Text style={tw(text.base, text.semibold, spacing.mb(3))}>
        How many workouts did you complete?
      </Text>
      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(4))}>
        <TouchableOpacity
          onPress={() => setFormData(prev => ({ 
            ...prev, 
            activities_completed: Math.max(0, prev.activities_completed - 1) 
          }))}
          style={[
            tw(spacing.w(12), spacing.h(12), border.rounded, layout.itemsCenter, layout.justifyCenter),
            { backgroundColor: themeColors.secondary }
          ]}
        >
          <Ionicons name="remove" size={24} color={themeColors.foreground} />
        </TouchableOpacity>
        
        <View
          style={[
            tw(spacing.w(16), spacing.h(12), border.rounded, layout.itemsCenter, layout.justifyCenter),
            { backgroundColor: themeColors.primary }
          ]}
        >
          <Text style={[tw(text['2xl'], text.semibold), { color: 'white' }]}>
            {formData.activities_completed}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => setFormData(prev => ({ 
            ...prev, 
            activities_completed: prev.activities_completed + 1 
          }))}
          style={[
            tw(spacing.w(12), spacing.h(12), border.rounded, layout.itemsCenter, layout.justifyCenter),
            { backgroundColor: themeColors.secondary }
          ]}
        >
          <Ionicons name="add" size={24} color={themeColors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGoalsMet = () => (
    <View style={tw(spacing.mb(6))}>
      <Text style={tw(text.base, text.semibold, spacing.mb(3))}>
        Did you meet your weekly goals?
      </Text>
      <View style={tw(layout.flexRow, spacing.gap(3))}>
        <TouchableOpacity
          onPress={() => setFormData(prev => ({ ...prev, goals_met: true }))}
          style={[
            tw(layout.flex1, spacing.p(4), border.rounded, border.border),
            {
              backgroundColor: formData.goals_met ? `${themeColors.primary}20` : themeColors.card,
              borderColor: formData.goals_met ? themeColors.primary : themeColors.border,
            }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2))}>
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color={formData.goals_met ? themeColors.primary : themeColors.muted} 
            />
            <Text 
              style={[
                tw(text.sm, text.semibold),
                { color: formData.goals_met ? themeColors.primary : themeColors.foreground }
              ]}
            >
              Yes
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setFormData(prev => ({ ...prev, goals_met: false }))}
          style={[
            tw(layout.flex1, spacing.p(4), border.rounded, border.border),
            {
              backgroundColor: !formData.goals_met ? `${themeColors.destructive}20` : themeColors.card,
              borderColor: !formData.goals_met ? themeColors.destructive : themeColors.border,
            }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2))}>
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={!formData.goals_met ? themeColors.destructive : themeColors.muted} 
            />
            <Text 
              style={[
                tw(text.sm, text.semibold),
                { color: !formData.goals_met ? themeColors.destructive : themeColors.foreground }
              ]}
            >
              Not quite
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[tw(layout.flex1), { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View 
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB, border.border),
            { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }
          ]}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={[tw(text.base), { color: themeColors.muted }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <Text style={tw(text.lg, text.semibold)}>
            Weekly Check-in
          </Text>
          
          <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
            <Text 
              style={[
                tw(text.base, text.semibold),
                { color: isLoading ? themeColors.muted : themeColors.primary }
              ]}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
          <Card elevation="sm">
            <View style={tw(spacing.p(4))}>
              {/* Week Info */}
              <View style={tw(layout.itemsCenter, spacing.mb(6))}>
                <Text style={tw(text.lg, text.semibold)}>
                  Week of {new Date(weekStart).toLocaleDateString()}
                </Text>
                <Text style={tw(text.sm, text.muted)}>
                  {existingCheckIn ? 'Update your progress' : 'Share your weekly progress'}
                </Text>
              </View>

              {renderActivityCounter()}
              {renderGoalsMet()}
              {renderMoodRating()}

              {/* Notes */}
              <View style={tw(spacing.mb(6))}>
                <Text style={tw(text.base, text.semibold, spacing.mb(3))}>
                  Notes (optional)
                </Text>
                <TextInput
                  style={[
                    tw(spacing.p(4), border.rounded, border.border, text.base),
                    {
                      backgroundColor: themeColors.secondary,
                      borderColor: themeColors.border,
                      color: themeColors.foreground,
                      minHeight: 100,
                      textAlignVertical: 'top',
                    }
                  ]}
                  placeholder="How did this week go? Any challenges or wins to share?"
                  placeholderTextColor={themeColors.muted}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Button
                onPress={handleSubmit}
                variant="gradient"
                size="lg"
                loading={isLoading}
              >
                {existingCheckIn ? 'Update Check-in' : 'Submit Check-in'}
              </Button>
            </View>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
}