import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Clock, Calendar } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface WeeklyCommitmentStepProps {
  formData: {
    weeklyCommitment?: {
      daysPerWeek?: number;
      minutesPerSession?: number;
      preferredDays?: string[];
      preferredTimes?: string[];
    };
  };
  onChange: (field: keyof any, value: any) => void;
  errors?: Record<string, string>;
}

const daysOptions = [
  { value: 2, label: '2 days/week', description: 'Light commitment, perfect for starting' },
  { value: 3, label: '3 days/week', description: 'Moderate routine, great for consistency' },
  { value: 4, label: '4 days/week', description: 'Active lifestyle, good progress' },
  { value: 5, label: '5 days/week', description: 'Dedicated routine, excellent results' },
  { value: 6, label: '6 days/week', description: 'High commitment, advanced training' },
];

const durationOptions = [
  { value: 15, label: '15 minutes', description: 'Quick and efficient' },
  { value: 30, label: '30 minutes', description: 'Standard session length' },
  { value: 45, label: '45 minutes', description: 'Comprehensive workout' },
  { value: 60, label: '60 minutes', description: 'Extended training session' },
  { value: 90, label: '90+ minutes', description: 'Long, detailed workouts' },
];

const weekDays = [
  { id: 'monday', label: 'Mon', fullName: 'Monday' },
  { id: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
  { id: 'thursday', label: 'Thu', fullName: 'Thursday' },
  { id: 'friday', label: 'Fri', fullName: 'Friday' },
  { id: 'saturday', label: 'Sat', fullName: 'Saturday' },
  { id: 'sunday', label: 'Sun', fullName: 'Sunday' },
];

const timeSlots = [
  { id: 'early_morning', label: 'Early Morning', description: '5-7 AM' },
  { id: 'morning', label: 'Morning', description: '7-10 AM' },
  { id: 'late_morning', label: 'Late Morning', description: '10 AM-12 PM' },
  { id: 'afternoon', label: 'Afternoon', description: '12-5 PM' },
  { id: 'evening', label: 'Evening', description: '5-8 PM' },
  { id: 'night', label: 'Night', description: '8-11 PM' },
];

export const WeeklyCommitmentStep = ({ formData, onChange, errors }: WeeklyCommitmentStepProps) => {
  const { colors } = useTheme();
  const commitment = formData.weeklyCommitment || {};

  const updateCommitment = (field: string, value: any) => {
    const newCommitment = {
      ...commitment,
      [field]: value
    };
    onChange('weeklyCommitment', newCommitment);
  };

  const toggleDay = (dayId: string) => {
    const currentDays = commitment.preferredDays || [];
    const isSelected = currentDays.includes(dayId);
    
    let newDays;
    if (isSelected) {
      newDays = currentDays.filter(id => id !== dayId);
    } else {
      newDays = [...currentDays, dayId];
    }
    
    updateCommitment('preferredDays', newDays);
  };

  const toggleTime = (timeId: string) => {
    const currentTimes = commitment.preferredTimes || [];
    const isSelected = currentTimes.includes(timeId);
    
    let newTimes;
    if (isSelected) {
      newTimes = currentTimes.filter(id => id !== timeId);
    } else {
      newTimes = [...currentTimes, timeId];
    }
    
    updateCommitment('preferredTimes', newTimes);
  };

  return (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.px(4), spacing.py(6))}>
        <Card>
          <CardHeader>
            <CardTitle>Weekly Commitment</CardTitle>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Let's plan a realistic schedule that fits your lifestyle.
            </Text>
          </CardHeader>
          
          <CardContent>
            <View style={tw(spacing.gap(6))}>
              {/* Days per week */}
              <View>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(3))}>
                  <Calendar size={20} color={colors.primary} />
                  <Text style={[
                    tw(text.base, text.medium),
                    { color: colors.foreground }
                  ]}>
                    How many days per week?
                  </Text>
                </View>
                
                <View style={tw(spacing.gap(2))}>
                  {daysOptions.map((option) => {
                    const isSelected = commitment.daysPerWeek === option.value;
                    
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => updateCommitment('daysPerWeek', option.value)}
                        style={[
                          tw(
                            spacing.p(3),
                            border.rounded,
                            layout.flexRow,
                            layout.itemsCenter,
                            layout.justifyBetween
                          ),
                          {
                            backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                          }
                        ]}
                      >
                        <View>
                          <Text style={[
                            tw(text.sm, text.medium),
                            { color: colors.foreground }
                          ]}>
                            {option.label}
                          </Text>
                          <Text style={[
                            tw(text.xs),
                            { color: colors.mutedForeground }
                          ]}>
                            {option.description}
                          </Text>
                        </View>
                        
                        <View style={[
                          tw(spacing.w(5), spacing.h(5), layout.itemsCenter, layout.justifyCenter, border.rounded),
                          {
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                          }
                        ]}>
                          {isSelected && (
                            <Check size={14} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Duration per session */}
              <View>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(3))}>
                  <Clock size={20} color={colors.primary} />
                  <Text style={[
                    tw(text.base, text.medium),
                    { color: colors.foreground }
                  ]}>
                    How long per session?
                  </Text>
                </View>
                
                <View style={tw(spacing.gap(2))}>
                  {durationOptions.map((option) => {
                    const isSelected = commitment.minutesPerSession === option.value;
                    
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => updateCommitment('minutesPerSession', option.value)}
                        style={[
                          tw(
                            spacing.p(3),
                            border.rounded,
                            layout.flexRow,
                            layout.itemsCenter,
                            layout.justifyBetween
                          ),
                          {
                            backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                          }
                        ]}
                      >
                        <View>
                          <Text style={[
                            tw(text.sm, text.medium),
                            { color: colors.foreground }
                          ]}>
                            {option.label}
                          </Text>
                          <Text style={[
                            tw(text.xs),
                            { color: colors.mutedForeground }
                          ]}>
                            {option.description}
                          </Text>
                        </View>
                        
                        <View style={[
                          tw(spacing.w(5), spacing.h(5), layout.itemsCenter, layout.justifyCenter, border.rounded),
                          {
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                          }
                        ]}>
                          {isSelected && (
                            <Check size={14} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Preferred days */}
              <View>
                <Text style={[
                  tw(text.base, text.medium, spacing.mb(3)),
                  { color: colors.foreground }
                ]}>
                  Preferred days (optional)
                </Text>
                
                <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                  {weekDays.map((day) => {
                    const isSelected = commitment.preferredDays?.includes(day.id);
                    
                    return (
                      <TouchableOpacity
                        key={day.id}
                        onPress={() => toggleDay(day.id)}
                        style={[
                          tw(
                            spacing.px(3),
                            spacing.py(2),
                            border.rounded,
                            layout.itemsCenter,
                            layout.justifyCenter
                          ),
                          {
                            backgroundColor: isSelected ? colors.primary : colors.card,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                            minWidth: 50,
                          }
                        ]}
                      >
                        <Text style={[
                          tw(text.sm, text.medium),
                          { color: isSelected ? '#FFFFFF' : colors.foreground }
                        ]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Preferred times */}
              <View>
                <Text style={[
                  tw(text.base, text.medium, spacing.mb(3)),
                  { color: colors.foreground }
                ]}>
                  Preferred times (optional)
                </Text>
                
                <View style={tw(spacing.gap(2))}>
                  {timeSlots.map((timeSlot) => {
                    const isSelected = commitment.preferredTimes?.includes(timeSlot.id);
                    
                    return (
                      <TouchableOpacity
                        key={timeSlot.id}
                        onPress={() => toggleTime(timeSlot.id)}
                        style={[
                          tw(
                            spacing.p(3),
                            border.rounded,
                            layout.flexRow,
                            layout.itemsCenter,
                            layout.justifyBetween
                          ),
                          {
                            backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                          }
                        ]}
                      >
                        <View>
                          <Text style={[
                            tw(text.sm, text.medium),
                            { color: colors.foreground }
                          ]}>
                            {timeSlot.label}
                          </Text>
                          <Text style={[
                            tw(text.xs),
                            { color: colors.mutedForeground }
                          ]}>
                            {timeSlot.description}
                          </Text>
                        </View>
                        
                        <View style={[
                          tw(spacing.w(5), spacing.h(5), layout.itemsCenter, layout.justifyCenter, border.rounded),
                          {
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                          }
                        ]}>
                          {isSelected && (
                            <Check size={14} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {errors?.weeklyCommitment && (
                <Text style={[tw(text.sm), { color: colors.destructive }]}>
                  {errors.weeklyCommitment}
                </Text>
              )}
              
              {/* Summary */}
              {(commitment.daysPerWeek && commitment.minutesPerSession) && (
                <View style={[
                  tw(spacing.p(3), border.rounded),
                  { backgroundColor: colors.muted }
                ]}>
                  <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                    Your commitment: {commitment.daysPerWeek} days × {commitment.minutesPerSession} minutes
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.primary }]}>
                    = {commitment.daysPerWeek * commitment.minutesPerSession} minutes/week total
                  </Text>
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                    This is a {commitment.daysPerWeek * commitment.minutesPerSession < 90 ? 'light' : 
                              commitment.daysPerWeek * commitment.minutesPerSession < 180 ? 'moderate' : 'strong'} commitment that fits your lifestyle.
                  </Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
};