import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { Colors } from '@/constants/Tokens';
import { useTheme } from '@/providers/theme-provider';
import { useQuickLogActivity } from '@/hooks/use-activity-with-badges';
import { Ionicons } from '@expo/vector-icons';

interface QuickActivity {
  type: string;
  emoji: string;
  defaultDuration?: number;
}

const QUICK_ACTIVITIES: QuickActivity[] = [
  { type: 'workout', emoji: '💪', defaultDuration: 45 },
  { type: 'running', emoji: '🏃‍♂️', defaultDuration: 30 },
  { type: 'cycling', emoji: '🚴‍♂️', defaultDuration: 60 },
  { type: 'swimming', emoji: '🏊‍♂️', defaultDuration: 30 },
  { type: 'yoga', emoji: '🧘‍♀️', defaultDuration: 60 },
  { type: 'walking', emoji: '🚶‍♂️', defaultDuration: 30 },
];

interface QuickLogButtonProps {
  onSuccess?: () => void;
}

export function QuickLogButton({ onSuccess }: QuickLogButtonProps) {
  const { colors: themeColors } = useTheme();
  const { quickLog, isLogging } = useQuickLogActivity();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<QuickActivity | null>(null);
  const [duration, setDuration] = useState<string>('');
  const [customActivity, setCustomActivity] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleQuickLog = (activity: QuickActivity) => {
    quickLog(activity.type, activity.emoji, activity.defaultDuration);
    setIsModalVisible(false);
    onSuccess?.();
  };

  const handleCustomLog = () => {
    if (!customActivity || !customEmoji) return;
    
    const durationValue = duration ? parseInt(duration) : undefined;
    quickLog(customActivity, customEmoji, durationValue);
    
    // Reset form
    setCustomActivity('');
    setCustomEmoji('');
    setDuration('');
    setShowCustomForm(false);
    setIsModalVisible(false);
    onSuccess?.();
  };

  const handleActivityWithDuration = () => {
    if (!selectedActivity) return;
    
    const durationValue = duration ? parseInt(duration) : selectedActivity.defaultDuration;
    quickLog(selectedActivity.type, selectedActivity.emoji, durationValue);
    
    setSelectedActivity(null);
    setDuration('');
    setIsModalVisible(false);
    onSuccess?.();
  };

  return (
    <>
      {/* Quick Log Button */}
      <TouchableOpacity
        onPress={() => setIsModalVisible(true)}
        style={[
          tw(spacing.w(12), spacing.h(12), border.roundedFull, layout.itemsCenter, layout.justifyCenter),
          { backgroundColor: themeColors.primary }
        ]}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Quick Log Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={tw(layout.flex1, spacing.p(4))}>
          {/* Header */}
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(6))}>
            <Text style={tw(text['3xl'], text.semibold)}>Quick Log Activity</Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={tw(spacing.p(2))}
            >
              <Ionicons name="close" size={24} color={themeColors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Duration Selection Modal */}
          {selectedActivity && (
            <Card elevation="md">
              <View style={tw(spacing.p(4))}>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(4))}>
                  <Text style={tw(text['5xl'])}>{selectedActivity.emoji}</Text>
                  <View>
                    <Text style={tw(text.lg, text.semibold)}>
                      {selectedActivity.type.charAt(0).toUpperCase() + selectedActivity.type.slice(1)}
                    </Text>
                    <Text style={tw(text.sm, text.muted)}>
                      How long did you exercise?
                    </Text>
                  </View>
                </View>

                <View style={tw(spacing.mb(4))}>
                  <Text style={tw(text.sm, text.semibold, spacing.mb(2))}>
                    Duration (minutes)
                  </Text>
                  <Input
                    value={duration}
                    onChangeText={setDuration}
                    placeholder={selectedActivity.defaultDuration?.toString() || '30'}
                    keyboardType="numeric"
                  />
                </View>

                <View style={tw(layout.flexRow, spacing.gap(3))}>
                  <Button
                    onPress={() => {
                      setSelectedActivity(null);
                      setDuration('');
                    }}
                    variant="outline"
                    style={tw(layout.flex1)}
                  >
                    Back
                  </Button>
                  <Button
                    onPress={handleActivityWithDuration}
                    variant="gradient"
                    style={tw(layout.flex1)}
                    loading={isLogging}
                  >
                    Log Activity
                  </Button>
                </View>
              </View>
            </Card>
          )}

          {/* Custom Activity Form */}
          {showCustomForm && !selectedActivity && (
            <Card elevation="md">
              <View style={tw(spacing.p(4))}>
                <Text style={tw(text.lg, text.semibold, spacing.mb(4))}>
                  Custom Activity
                </Text>

                <View style={tw(spacing.gap(4))}>
                  <View>
                    <Text style={tw(text.sm, text.semibold, spacing.mb(2))}>
                      Activity Type
                    </Text>
                    <Input
                      value={customActivity}
                      onChangeText={setCustomActivity}
                      placeholder="e.g., basketball, hiking, dancing"
                    />
                  </View>

                  <View>
                    <Text style={tw(text.sm, text.semibold, spacing.mb(2))}>
                      Emoji
                    </Text>
                    <Input
                      value={customEmoji}
                      onChangeText={setCustomEmoji}
                      placeholder="🏀"
                      maxLength={4}
                    />
                  </View>

                  <View>
                    <Text style={tw(text.sm, text.semibold, spacing.mb(2))}>
                      Duration (minutes) - Optional
                    </Text>
                    <Input
                      value={duration}
                      onChangeText={setDuration}
                      placeholder="30"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={tw(layout.flexRow, spacing.gap(3), spacing.mt(6))}>
                  <Button
                    onPress={() => setShowCustomForm(false)}
                    variant="outline"
                    style={tw(layout.flex1)}
                  >
                    Back
                  </Button>
                  <Button
                    onPress={handleCustomLog}
                    variant="gradient"
                    style={tw(layout.flex1)}
                    loading={isLogging}
                    disabled={!customActivity || !customEmoji}
                  >
                    Log Activity
                  </Button>
                </View>
              </View>
            </Card>
          )}

          {/* Quick Activities Grid */}
          {!selectedActivity && !showCustomForm && (
            <>
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3), spacing.mb(6))}>
                {QUICK_ACTIVITIES.map((activity, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedActivity(activity)}
                    style={[
                      tw(spacing.w(24), spacing.h(20), border.rounded, layout.itemsCenter, layout.justifyCenter, border.border),
                      { 
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border 
                      }
                    ]}
                  >
                    <Text style={tw(text['5xl'], spacing.mb(1))}>
                      {activity.emoji}
                    </Text>
                    <Text style={tw(text.xs, text.center, text.semibold)}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Text>
                    {activity.defaultDuration && (
                      <Text style={tw(text.xs, text.center, text.muted)}>
                        {activity.defaultDuration}m
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Activity Button */}
              <Button
                onPress={() => setShowCustomForm(true)}
                variant="outline"
                size="lg"
              >
                <Ionicons name="create" size={20} color={themeColors.foreground} />
                <Text style={tw(spacing.ml(2))}>Custom Activity</Text>
              </Button>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}