import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface AccessConstraintsStepProps {
  formData: {
    equipmentAccess?: string[];
    physicalLimitations?: string;
  };
  onChange: (field: keyof any, value: any) => void;
  errors?: Record<string, string>;
}

const equipmentOptions = [
  {
    id: 'home_gym',
    title: 'Home Gym',
    description: 'Weights, machines, or equipment at home',
    icon: '🏠'
  },
  {
    id: 'commercial_gym',
    title: 'Commercial Gym',
    description: 'Full gym membership with all equipment',
    icon: '🏋️'
  },
  {
    id: 'basic_equipment',
    title: 'Basic Equipment',
    description: 'Resistance bands, dumbbells, yoga mat',
    icon: '🎯'
  },
  {
    id: 'bodyweight_only',
    title: 'Bodyweight Only',
    description: 'No equipment needed, just my body',
    icon: '💪'
  },
  {
    id: 'outdoor_space',
    title: 'Outdoor Space',
    description: 'Parks, trails, outdoor workout areas',
    icon: '🌳'
  },
  {
    id: 'swimming_pool',
    title: 'Swimming Pool',
    description: 'Access to pool for swimming/water exercise',
    icon: '🏊'
  },
  {
    id: 'sports_facilities',
    title: 'Sports Facilities',
    description: 'Courts, fields, recreational centers',
    icon: '⚽'
  },
  {
    id: 'limited_access',
    title: 'Very Limited Access',
    description: 'Minimal equipment or space available',
    icon: '🤷'
  }
];

export const AccessConstraintsStep = ({ formData, onChange, errors }: AccessConstraintsStepProps) => {
  const { colors } = useTheme();
  const selectedEquipment = formData.equipmentAccess || [];
  const physicalLimitations = formData.physicalLimitations || '';

  const toggleEquipment = (equipmentId: string) => {
    const currentEquipment = selectedEquipment || [];
    const isSelected = currentEquipment.includes(equipmentId);
    
    let newEquipment;
    if (isSelected) {
      newEquipment = currentEquipment.filter(id => id !== equipmentId);
    } else {
      newEquipment = [...currentEquipment, equipmentId];
    }
    
    onChange('equipmentAccess', newEquipment);
  };

  const handleLimitationsChange = (text: string) => {
    onChange('physicalLimitations', text);
  };

  return (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.px(4), spacing.py(6))}>
        <Card>
          <CardHeader>
            <CardTitle>Equipment & Constraints</CardTitle>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Tell us what you have access to and any limitations we should know about.
            </Text>
          </CardHeader>
          
          <CardContent>
            <View style={tw(spacing.gap(6))}>
              {/* Equipment Access Section */}
              <View>
                <Text style={[
                  tw(text.base, text.medium, spacing.mb(3)),
                  { color: colors.foreground }
                ]}>
                  What equipment or facilities do you have access to?
                </Text>
                
                <View style={tw(spacing.gap(3))}>
                  {equipmentOptions.map((equipment) => {
                    const isSelected = selectedEquipment.includes(equipment.id);
                    
                    return (
                      <TouchableOpacity
                        key={equipment.id}
                        onPress={() => toggleEquipment(equipment.id)}
                        style={[
                          tw(
                            spacing.p(3),
                            border.rounded,
                            layout.flexRow,
                            layout.itemsCenter,
                            spacing.gap(3)
                          ),
                          {
                            backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                            minHeight: 64,
                          }
                        ]}
                      >
                        {/* Icon */}
                        <View style={[
                          tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
                          { backgroundColor: colors.muted }
                        ]}>
                          <Text style={tw(text.lg)}>{equipment.icon}</Text>
                        </View>
                        
                        {/* Content */}
                        <View style={tw(layout.flex1, spacing.gap(1))}>
                          <Text style={[
                            tw(text.sm, text.medium),
                            { color: colors.foreground }
                          ]}>
                            {equipment.title}
                          </Text>
                          <Text style={[
                            tw(text.xs),
                            { color: colors.mutedForeground }
                          ]}>
                            {equipment.description}
                          </Text>
                        </View>
                        
                        {/* Selection indicator */}
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
                
                {errors?.equipmentAccess && (
                  <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.destructive }]}>
                    {errors.equipmentAccess}
                  </Text>
                )}
              </View>
              
              {/* Physical Limitations Section */}
              <View>
                <Text style={[
                  tw(text.base, text.medium, spacing.mb(2)),
                  { color: colors.foreground }
                ]}>
                  Physical limitations or injuries (optional)
                </Text>
                <Text style={[
                  tw(text.sm, spacing.mb(3)),
                  { color: colors.mutedForeground }
                ]}>
                  Tell us about any injuries, health conditions, or physical constraints we should consider when recommending activities.
                </Text>
                
                <TextInput
                  style={[
                    tw(
                      border.rounded,
                      spacing.p(3),
                      text.sm
                    ),
                    {
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.foreground,
                      minHeight: 100,
                      textAlignVertical: 'top',
                    }
                  ]}
                  placeholder="e.g., knee injury, back pain, balance issues, etc."
                  placeholderTextColor={colors.mutedForeground}
                  value={physicalLimitations}
                  onChangeText={handleLimitationsChange}
                  multiline
                  numberOfLines={4}
                />
                
                {errors?.physicalLimitations && (
                  <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.destructive }]}>
                    {errors.physicalLimitations}
                  </Text>
                )}
              </View>
              
              {/* Summary */}
              {selectedEquipment.length > 0 && (
                <View style={[
                  tw(spacing.p(3), border.rounded),
                  { backgroundColor: colors.muted }
                ]}>
                  <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                    Selected equipment: {selectedEquipment.length}
                  </Text>
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                    Perfect! We'll create workouts that match your available resources.
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