import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface MovementSnapshotStepProps {
  formData: {
    movementActivities?: {
      [key: string]: {
        selected: boolean;
        frequency: number;
      };
    };
  };
  onChange: (field: keyof any, value: any) => void;
  errors?: Record<string, string>;
}

const activityOptions = [
  {
    id: 'strength_training',
    title: 'Strength Training',
    description: 'Weights, resistance bands, bodyweight exercises',
    icon: '🏋️',
    unit: 'sessions per week'
  },
  {
    id: 'cardio',
    title: 'Cardio/Aerobic',
    description: 'Running, cycling, swimming, dancing',
    icon: '🏃',
    unit: 'sessions per week'
  },
  {
    id: 'walking',
    title: 'Walking',
    description: 'Casual walks, hiking, daily movement',
    icon: '🚶',
    unit: 'sessions per week'
  },
  {
    id: 'yoga_stretching',
    title: 'Yoga/Stretching',
    description: 'Flexibility, mobility, mindful movement',
    icon: '🧘',
    unit: 'sessions per week'
  },
  {
    id: 'sports',
    title: 'Sports/Recreation',
    description: 'Tennis, basketball, team sports, games',
    icon: '⚽',
    unit: 'sessions per week'
  },
  {
    id: 'outdoor_activities',
    title: 'Outdoor Activities',
    description: 'Hiking, rock climbing, skiing, surfing',
    icon: '🏔️',
    unit: 'sessions per week'
  }
];

export const MovementSnapshotStep = ({ formData, onChange, errors }: MovementSnapshotStepProps) => {
  const { colors } = useTheme();
  const movementActivities = formData.movementActivities || {};

  const updateActivityFrequency = (activityId: string, frequency: number) => {
    const newActivities = {
      ...movementActivities,
      [activityId]: {
        selected: frequency > 0,
        frequency: Math.max(0, Math.min(7, frequency)) // Limit between 0-7
      }
    };
    
    // Remove activities with 0 frequency
    if (newActivities[activityId].frequency === 0) {
      delete newActivities[activityId];
    }
    
    onChange('movementActivities', newActivities);
  };

  const getActivityFrequency = (activityId: string): number => {
    return movementActivities[activityId]?.frequency || 0;
  };

  const getTotalSessions = (): number => {
    return Object.values(movementActivities).reduce((sum, activity) => sum + activity.frequency, 0);
  };

  return (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.px(4), spacing.py(6))}>
        <Card>
          <CardHeader>
            <CardTitle>Current Movement Snapshot</CardTitle>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Tell us about your current activity level. How often do you do these activities?
            </Text>
          </CardHeader>
          
          <CardContent>
            <View style={tw(spacing.gap(4))}>
              {activityOptions.map((activity) => {
                const frequency = getActivityFrequency(activity.id);
                
                return (
                  <View
                    key={activity.id}
                    style={[
                      tw(spacing.p(4), border.rounded),
                      {
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: frequency > 0 ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    {/* Activity Header */}
                    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(3))}>
                      <View style={[
                        tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
                        { backgroundColor: colors.muted }
                      ]}>
                        <Text style={tw(text.lg)}>{activity.icon}</Text>
                      </View>
                      
                      <View style={tw(layout.flex1)}>
                        <Text style={[
                          tw(text.base, text.medium),
                          { color: colors.foreground }
                        ]}>
                          {activity.title}
                        </Text>
                        <Text style={[
                          tw(text.sm),
                          { color: colors.mutedForeground }
                        ]}>
                          {activity.description}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Frequency Selector */}
                    <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                      <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                        {activity.unit}
                      </Text>
                      
                      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                        <TouchableOpacity
                          onPress={() => updateActivityFrequency(activity.id, frequency - 1)}
                          disabled={frequency === 0}
                          style={[
                            tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
                            {
                              backgroundColor: frequency === 0 ? colors.muted : colors.primary,
                              opacity: frequency === 0 ? 0.5 : 1,
                            }
                          ]}
                        >
                          <Minus size={16} color={frequency === 0 ? colors.mutedForeground : '#FFFFFF'} />
                        </TouchableOpacity>
                        
                        <View style={tw(spacing.w(12), layout.itemsCenter)}>
                          <Text style={[
                            tw(text.lg, text.medium),
                            { color: colors.foreground }
                          ]}>
                            {frequency}
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          onPress={() => updateActivityFrequency(activity.id, frequency + 1)}
                          disabled={frequency === 7}
                          style={[
                            tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
                            {
                              backgroundColor: frequency === 7 ? colors.muted : colors.primary,
                              opacity: frequency === 7 ? 0.5 : 1,
                            }
                          ]}
                        >
                          <Plus size={16} color={frequency === 7 ? colors.mutedForeground : '#FFFFFF'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
            
            {errors?.movementActivities && (
              <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.destructive }]}>
                {errors.movementActivities}
              </Text>
            )}
            
            {getTotalSessions() > 0 && (
              <View style={[
                tw(spacing.mt(4), spacing.p(3), border.rounded),
                { backgroundColor: colors.muted }
              ]}>
                <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                  Total weekly sessions: {getTotalSessions()}
                </Text>
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  {getTotalSessions() < 3 
                    ? "Great starting point! We'll help you build consistency."
                    : getTotalSessions() < 6
                    ? "Nice! You're already building a solid routine."
                    : "Excellent! You're very active. We'll help optimize your training."
                  }
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
};