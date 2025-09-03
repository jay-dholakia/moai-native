import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity, Image, Linking } from 'react-native';
import { X, Play, Clock, Flame, Target, Dumbbell, Info } from 'lucide-react-native';

import { Exercise } from '@/services/exercise-service';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isVisible: boolean;
  onClose: () => void;
  onSelect?: (exercise: Exercise) => void;
  showSelectButton?: boolean;
}

export function ExerciseDetailModal({
  exercise,
  isVisible,
  onClose,
  onSelect,
  showSelectButton = false
}: ExerciseDetailModalProps) {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  if (!exercise) return null;

  const handleVideoPress = async () => {
    if (exercise.video_url) {
      try {
        await Linking.openURL(exercise.video_url);
      } catch (error) {
        console.error('Error opening video URL:', error);
      }
    }
  };

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
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.px(4), spacing.py(3)),
          { borderBottomWidth: 1, borderBottomColor: colors.border }
        ]}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Exercise Details
          </Text>
          
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
          {/* Exercise Image/Video */}
          <View style={tw(layout.relative)}>
            {exercise.image_url && !imageError ? (
              <Image
                source={{ uri: exercise.image_url }}
                style={[
                  tw(layout.w('full'), layout.h(64)),
                  { backgroundColor: colors.muted }
                ]}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View 
                style={[
                  tw(layout.w('full'), layout.h(64), layout.itemsCenter, layout.justifyCenter),
                  { backgroundColor: colors.muted }
                ]}
              >
                <Text style={[tw(text['6xl']), { color: colors.mutedForeground }]}>
                  {getExerciseTypeIcon(exercise.exercise_type)}
                </Text>
              </View>
            )}

            {/* Video Play Button */}
            {exercise.video_url && (
              <TouchableOpacity
                onPress={handleVideoPress}
                style={tw(spacing.absolute, layout.inset(0), layout.itemsCenter, layout.justifyCenter)}
              >
                <View 
                  style={[
                    tw(spacing.p(4), border.roundedFull),
                    { backgroundColor: 'rgba(0,0,0,0.7)' }
                  ]}
                >
                  <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}

            {/* Badges Overlay */}
            <View style={tw(layout.absolute, layout.top(16), layout.left(16))}>
              <Badge variant="secondary">
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  {exercise.exercise_type}
                </Text>
              </Badge>
            </View>

            <View style={tw(layout.absolute, layout.top(16), layout.right(16))}>
              <Badge 
                variant="outline"
                style={{ borderColor: getDifficultyColor(exercise.difficulty_level) }}
              >
                <Text style={[tw(text.sm), { color: getDifficultyColor(exercise.difficulty_level) }]}>
                  {exercise.difficulty_level}
                </Text>
              </Badge>
            </View>
          </View>

          <View style={tw(spacing.p(4))}>
            {/* Exercise Name */}
            <Text style={[tw(text['2xl'], text.bold, spacing.mb(4)), { color: colors.foreground }]}>
              {exercise.name}
            </Text>

            {/* Quick Stats */}
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(4), spacing.mb(6))}>
              {exercise.calories_per_minute && (
                <View style={tw(layout.flexRow, layout.itemsCenter)}>
                  <Flame size={16} color={colors.warning} />
                  <Text style={[tw(text.sm, spacing.ml(1)), { color: colors.foreground }]}>
                    {exercise.calories_per_minute} cal/min
                  </Text>
                </View>
              )}
              
              <View style={tw(layout.flexRow, layout.itemsCenter)}>
                <Target size={16} color={colors.primary} />
                <Text style={[tw(text.sm, spacing.ml(1)), { color: colors.foreground }]}>
                  {exercise.difficulty_level}
                </Text>
              </View>
            </View>

            {/* Description */}
            {exercise.description && (
              <Card style={tw(spacing.mb(6))}>
                <CardHeader>
                  <CardTitle>
                    <View style={tw(layout.flexRow, layout.itemsCenter)}>
                      <Info size={16} color={colors.foreground} />
                      <Text style={[tw(text.lg, text.semibold, spacing.ml(2)), { color: colors.foreground }]}>
                        Description
                      </Text>
                    </View>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Text style={[tw(text.base, layout.leading6), { color: colors.foreground }]}>
                    {exercise.description}
                  </Text>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {exercise.instructions && (
              <Card style={tw(spacing.mb(6))}>
                <CardHeader>
                  <CardTitle>
                    <View style={tw(layout.flexRow, layout.itemsCenter)}>
                      <Text style={tw(text.base, spacing.mr(2))}>📋</Text>
                      <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                        Instructions
                      </Text>
                    </View>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Text style={[tw(text.base, layout.leading6), { color: colors.foreground }]}>
                    {exercise.instructions}
                  </Text>
                </CardContent>
              </Card>
            )}

            {/* Muscle Groups */}
            <Card style={tw(spacing.mb(6))}>
              <CardHeader>
                <CardTitle>
                  <View style={tw(layout.flexRow, layout.itemsCenter)}>
                    <Text style={tw(text.base, spacing.mr(2))}>💪</Text>
                    <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                      Target Muscles
                    </Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                  {exercise.muscle_groups.map((muscle, index) => (
                    <Badge key={index} variant="outline">
                      <Text style={[tw(text.sm), { color: colors.foreground }]}>
                        {muscle}
                      </Text>
                    </Badge>
                  ))}
                </View>
              </CardContent>
            </Card>

            {/* Equipment */}
            {exercise.equipment.length > 0 && (
              <Card style={tw(spacing.mb(6))}>
                <CardHeader>
                  <CardTitle>
                    <View style={tw(layout.flexRow, layout.itemsCenter)}>
                      <Dumbbell size={16} color={colors.foreground} />
                      <Text style={[tw(text.lg, text.semibold, spacing.ml(2)), { color: colors.foreground }]}>
                        Equipment Needed
                      </Text>
                    </View>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                    {exercise.equipment.map((equipment, index) => (
                      <Badge key={index} variant="secondary">
                        <Text style={[tw(text.sm), { color: colors.foreground }]}>
                          {equipment}
                        </Text>
                      </Badge>
                    ))}
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <View style={tw(spacing.gap(3), spacing.mb(8))}>
              {exercise.video_url && (
                <Button
                  variant="outline"
                  onPress={handleVideoPress}
                  style={tw(layout.w('full'))}
                >
                  <Play size={16} color={colors.foreground} />
                  <Text style={[tw(text.base, spacing.ml(2)), { color: colors.foreground }]}>
                    Watch Video
                  </Text>
                </Button>
              )}

              {showSelectButton && onSelect && (
                <Button
                  variant="gradient"
                  onPress={() => {
                    onSelect(exercise);
                    onClose();
                  }}
                  style={tw(layout.w('full'))}
                >
                  <Text style={[tw(text.base, text.semibold), { color: '#FFFFFF' }]}>
                    Select Exercise
                  </Text>
                </Button>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}