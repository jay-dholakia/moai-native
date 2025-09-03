import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Users, Sparkles, ArrowRight, Check } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface MoaiSetupStepProps {
  formData: {
    moaiPath?: string;
    selectedMoaiType?: 'create' | 'join' | 'skip';
  };
  onChange: (field: keyof any, value: any) => void;
  errors?: Record<string, string>;
}

const moaiOptions = [
  {
    id: 'create',
    title: 'Create a Moai',
    description: 'Start your own fitness community and invite friends',
    icon: '🚀',
    features: ['Lead your own group', 'Set group goals', 'Invite friends & family', 'Custom challenges'],
    color: '#06B6D4'
  },
  {
    id: 'join',
    title: 'Join a Moai',
    description: 'Find and join an existing fitness community',
    icon: '🤝',
    features: ['Browse public moais', 'Join based on interests', 'Meet like-minded people', 'Shared accountability'],
    color: '#10B981'
  },
  {
    id: 'skip',
    title: 'Skip for Now',
    description: 'Focus on personal fitness first, join community later',
    icon: '✨',
    features: ['Personal tracking', 'Individual goals', 'Join moais anytime', 'Private progress'],
    color: '#8B5CF6'
  }
];

export const MoaiSetupStep = ({ formData, onChange, errors }: MoaiSetupStepProps) => {
  const { colors } = useTheme();
  const selectedOption = formData.selectedMoaiType;

  const selectOption = (optionId: 'create' | 'join' | 'skip') => {
    onChange('selectedMoaiType', optionId);
    onChange('moaiPath', optionId);
  };

  return (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.px(4), spacing.py(6))}>
        <Card>
          <CardHeader>
            <View style={tw(layout.itemsCenter, spacing.mb(4))}>
              <View style={[
                tw(spacing.w(16), spacing.h(16), layout.itemsCenter, layout.justifyCenter, border.rounded),
                { backgroundColor: colors.primary + '20' }
              ]}>
                <Users size={32} color={colors.primary} />
              </View>
            </View>
            
            <CardTitle style={tw(text.center)}>Join the Moai Community</CardTitle>
            <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
              Moais are small fitness communities focused on mutual support and accountability. Choose how you'd like to get started.
            </Text>
          </CardHeader>
          
          <CardContent>
            <View style={tw(spacing.gap(4))}>
              {moaiOptions.map((option) => {
                const isSelected = selectedOption === option.id;
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => selectOption(option.id as 'create' | 'join' | 'skip')}
                    style={[
                      tw(
                        spacing.p(4),
                        border.rounded,
                        layout.relative
                      ),
                      {
                        backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <View style={[
                        tw(spacing.w(6), spacing.h(6), layout.itemsCenter, layout.justifyCenter, border.rounded),
                        {
                          backgroundColor: colors.primary,
                          position: 'absolute',
                          top: 12,
                          right: 12,
                        }
                      ]}>
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}
                    
                    {/* Header */}
                    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(3))}>
                      <View style={[
                        tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, border.rounded),
                        { backgroundColor: option.color + '20' }
                      ]}>
                        <Text style={tw(text.xl)}>{option.icon}</Text>
                      </View>
                      
                      <View style={tw(layout.flex1)}>
                        <Text style={[
                          tw(text.lg, text.medium),
                          { color: colors.foreground }
                        ]}>
                          {option.title}
                        </Text>
                        <Text style={[
                          tw(text.sm),
                          { color: colors.mutedForeground }
                        ]}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Features */}
                    <View style={tw(spacing.gap(2))}>
                      {option.features.map((feature, index) => (
                        <View key={index} style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                          <View style={[
                            tw(spacing.w(1), spacing.h(1), border.rounded),
                            { backgroundColor: option.color }
                          ]} />
                          <Text style={[
                            tw(text.xs),
                            { color: colors.mutedForeground }
                          ]}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                    
                    {/* Call to action */}
                    {isSelected && (
                      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.mt(3))}>
                        <Text style={[
                          tw(text.sm, text.medium),
                          { color: colors.primary }
                        ]}>
                          {option.id === 'create' ? 'Ready to lead!' : 
                           option.id === 'join' ? 'Ready to connect!' : 
                           'Ready to start solo!'}
                        </Text>
                        <ArrowRight size={16} color={colors.primary} style={tw(spacing.ml(1))} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {errors?.selectedMoaiType && (
              <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.destructive }]}>
                {errors.selectedMoaiType}
              </Text>
            )}
            
            {/* Information box */}
            <View style={[
              tw(spacing.mt(6), spacing.p(4), border.rounded),
              { backgroundColor: colors.muted }
            ]}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(2))}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                  What is a Moai?
                </Text>
              </View>
              <Text style={[tw(text.xs, spacing.mb(2)), { color: colors.mutedForeground }]}>
                Inspired by the Japanese concept of mutual support, Moais are small groups (5-8 people) who commit to supporting each other's fitness journey.
              </Text>
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                • Share progress and celebrate wins together{'\n'}
                • Hold each other accountable to fitness goals{'\n'}
                • Participate in group challenges and activities{'\n'}
                • Build lasting friendships through shared commitment
              </Text>
            </View>
            
            {selectedOption && (
              <View style={[
                tw(spacing.mt(4), spacing.p(3), border.rounded),
                { backgroundColor: colors.primary + '10' }
              ]}>
                <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
                  {selectedOption === 'create' ? 'You chose to create a moai!' :
                   selectedOption === 'join' ? 'You chose to join a moai!' :
                   'You chose to start solo!'}
                </Text>
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  {selectedOption === 'create' ? 'After onboarding, you\'ll be guided through creating your moai and inviting members.' :
                   selectedOption === 'join' ? 'After onboarding, you\'ll see available moais to join based on your interests.' :
                   'You can always create or join a moai later from your profile settings.'}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
};