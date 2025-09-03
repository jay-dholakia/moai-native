import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Play, Heart, Clock, Flame } from 'lucide-react-native';

import { Exercise } from '@/services/exercise-service';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  onSelect?: () => void;
  showSelectButton?: boolean;
  isSelected?: boolean;
}

export function ExerciseCard({ 
  exercise, 
  onPress, 
  onSelect, 
  showSelectButton = false,
  isSelected = false 
}: ExerciseCardProps) {
  const { colors } = useTheme();

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.destructive;
      default: return colors.muted;
    }
  };

  const getExerciseTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return '💪';
      case 'cardio': return '🏃';
      case 'flexibility': return '🧘';
      case 'balance': return '⚖️';
      case 'sports': return '⚽';
      default: return '🏋️';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw(spacing.mb(3)),
        isSelected && { 
          borderWidth: 2, 
          borderColor: colors.primary,
          borderRadius: 12
        }
      ]}
      activeOpacity={0.7}
    >
      <Card>
        <CardContent style={tw(spacing.p(0))}>
          {/* Exercise Image */}
          <View style={tw(layout.relative)}>
            {exercise.image_url ? (
              <Image
                source={{ uri: exercise.image_url }}
                style={[
                  tw(layout.wFull, layout.h(40), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={[
                  tw(layout.wFull, layout.h(40), border.rounded, layout.itemsCenter, layout.justifyCenter),
                  { backgroundColor: colors.muted }
                ]}
              >
                <Text style={[tw(text['2xl']), { color: colors.mutedForeground }]}>
                  {getExerciseTypeIcon(exercise.exercise_type)}
                </Text>
              </View>
            )}

            {/* Exercise Type Badge */}
            <View style={[tw(spacing.absolute), { top: 8, left: 8 }]}>
              <Badge variant="secondary">
                <Text style={[tw(text.xs), { color: colors.foreground }]}>
                  {exercise.exercise_type}
                </Text>
              </Badge>
            </View>

            {/* Difficulty Badge */}
            <View style={[tw(spacing.absolute), { top: 8, right: 8 }]}>
              <Badge 
                variant="outline"
                style={{ borderColor: getDifficultyColor(exercise.difficulty_level) }}
              >
                <Text style={[tw(text.xs), { color: getDifficultyColor(exercise.difficulty_level) }]}>
                  {exercise.difficulty_level}
                </Text>
              </Badge>
            </View>

            {/* Play Button Overlay */}
            {exercise.video_url && (
              <View style={tw(spacing.absolute, layout.inset(0), layout.itemsCenter, layout.justifyCenter)}>
                <View 
                  style={[
                    tw(spacing.p(3), border.roundedFull),
                    { backgroundColor: 'rgba(0,0,0,0.7)' }
                  ]}
                >
                  <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
            )}
          </View>

          {/* Exercise Info */}
          <View style={tw(spacing.p(4))}>
            <Text 
              style={[tw(text.lg, text.semibold, spacing.mb(2)), { color: colors.foreground }]}
              numberOfLines={2}
            >
              {exercise.name}
            </Text>

            {exercise.description && (
              <Text 
                style={[tw(text.sm, spacing.mb(3)), { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {exercise.description}
              </Text>
            )}

            {/* Muscle Groups */}
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(1), spacing.mb(3))}>
              {exercise.muscle_groups.slice(0, 3).map((muscle, index) => (
                <Badge key={index} variant="outline" style={tw(spacing.mb(1))}>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    {muscle}
                  </Text>
                </Badge>
              ))}
              {exercise.muscle_groups.length > 3 && (
                <Badge variant="outline" style={tw(spacing.mb(1))}>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    +{exercise.muscle_groups.length - 3}
                  </Text>
                </Badge>
              )}
            </View>

            {/* Equipment */}
            {exercise.equipment.length > 0 && (
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(2))}>
                <Text style={[tw(text.xs, spacing.mr(2)), { color: colors.mutedForeground }]}>
                  Equipment:
                </Text>
                <Text style={[tw(text.xs), { color: colors.foreground }]}>
                  {exercise.equipment.slice(0, 2).join(', ')}
                  {exercise.equipment.length > 2 && '...'}
                </Text>
              </View>
            )}

            {/* Calories */}
            {exercise.calories_per_minute && (
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(3))}>
                <Flame size={14} color={colors.warning} />
                <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.foreground }]}>
                  {exercise.calories_per_minute} cal/min
                </Text>
              </View>
            )}

            {/* Action Button */}
            {showSelectButton && onSelect && (
              <TouchableOpacity
                onPress={onSelect}
                style={[
                  tw(spacing.py(2), spacing.px(4), border.rounded, layout.itemsCenter),
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.muted,
                    opacity: isSelected ? 0.8 : 1
                  }
                ]}
              >
                <Text style={[
                  tw(text.sm, text.semibold),
                  { color: isSelected ? colors.primaryForeground : colors.foreground }
                ]}>
                  {isSelected ? 'Selected' : 'Select Exercise'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}