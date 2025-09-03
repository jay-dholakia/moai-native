import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { Colors } from '@/constants/Tokens';
import { useTheme } from '@/providers/theme-provider';
import { ExercisePerformance } from '@/lib/machines/workout-execution-machine';
import { Ionicons } from '@expo/vector-icons';

interface ExercisePerformanceInputProps {
  exercise: any;
  setNumber: number;
  previousPerformance?: ExercisePerformance;
  onComplete: (performance: ExercisePerformance) => void;
  onSkip: () => void;
}

export function ExercisePerformanceInput({
  exercise,
  setNumber,
  previousPerformance,
  onComplete,
  onSkip,
}: ExercisePerformanceInputProps) {
  const { colors: themeColors } = useTheme();
  const [reps, setReps] = useState<string>(
    previousPerformance?.reps?.toString() || exercise.reps?.toString() || ''
  );
  const [weight, setWeight] = useState<string>(
    previousPerformance?.weight?.toString() || exercise.weight?.toString() || ''
  );
  const [duration, setDuration] = useState<string>(
    previousPerformance?.duration?.toString() || exercise.duration?.toString() || ''
  );
  const [distance, setDistance] = useState<string>(
    previousPerformance?.distance?.toString() || exercise.distance?.toString() || ''
  );
  const [notes, setNotes] = useState<string>(previousPerformance?.notes || '');

  // Quick adjustment buttons
  const adjustValue = (setValue: (value: string) => void, currentValue: string, delta: number) => {
    const current = parseFloat(currentValue) || 0;
    const newValue = Math.max(0, current + delta);
    setValue(newValue.toString());
  };

  const handleComplete = () => {
    const performance: ExercisePerformance = {
      setNumber,
      completedAt: new Date(),
    };

    if (reps) performance.reps = parseInt(reps);
    if (weight) performance.weight = parseFloat(weight);
    if (duration) performance.duration = parseFloat(duration);
    if (distance) performance.distance = parseFloat(distance);
    if (notes) performance.notes = notes;

    onComplete(performance);
  };

  const isStrengthExercise = exercise.exercise?.category === 'strength' || 
    exercise.exercise?.muscle_group || 
    exercise.reps || 
    exercise.weight;

  const isCardioExercise = exercise.exercise?.category === 'cardio' || 
    exercise.duration || 
    exercise.distance;

  return (
    <View style={tw(spacing.p(4))}>
      <Text style={tw(text.lg, text.semibold, spacing.mb(4))}>
        Set {setNumber}
      </Text>

      {/* Previous Performance Reference */}
      {previousPerformance && (
        <View 
          style={[
            tw(spacing.p(3), spacing.mb(4), border.rounded, border.border),
            { backgroundColor: themeColors.muted, borderColor: themeColors.border }
          ]}
        >
          <Text style={tw(text.sm, text.muted, spacing.mb(1))}>
            Previous Set:
          </Text>
          <Text style={tw(text.sm)}>
            {previousPerformance.reps && `${previousPerformance.reps} reps`}
            {previousPerformance.weight && ` @ ${previousPerformance.weight} lbs`}
            {previousPerformance.duration && `${previousPerformance.duration} min`}
            {previousPerformance.distance && ` • ${previousPerformance.distance} mi`}
          </Text>
        </View>
      )}

      <View style={tw(spacing.gap(4))}>
        {/* Strength Training Inputs */}
        {isStrengthExercise && (
          <>
            {/* Reps Input */}
            <View>
              <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(2))}>
                <Text style={tw(text.sm, text.semibold)}>Reps</Text>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  <TouchableOpacity
                    onPress={() => adjustValue(setReps, reps, -1)}
                    style={[
                      tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
                      { backgroundColor: themeColors.secondary }
                    ]}
                  >
                    <Ionicons name="remove" size={16} color={themeColors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => adjustValue(setReps, reps, 1)}
                    style={[
                      tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
                      { backgroundColor: themeColors.secondary }
                    ]}
                  >
                    <Ionicons name="add" size={16} color={themeColors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>
              <Input
                value={reps}
                onChangeText={setReps}
                placeholder="12"
                keyboardType="numeric"
              />
            </View>

            {/* Weight Input */}
            <View>
              <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(2))}>
                <Text style={tw(text.sm, text.semibold)}>Weight (lbs)</Text>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  <TouchableOpacity
                    onPress={() => adjustValue(setWeight, weight, -5)}
                    style={[
                      tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
                      { backgroundColor: themeColors.secondary }
                    ]}
                  >
                    <Text style={tw(text.xs)}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => adjustValue(setWeight, weight, 5)}
                    style={[
                      tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
                      { backgroundColor: themeColors.secondary }
                    ]}
                  >
                    <Text style={tw(text.xs)}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Input
                value={weight}
                onChangeText={setWeight}
                placeholder="135"
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        {/* Cardio Inputs */}
        {isCardioExercise && (
          <>
            {/* Duration Input */}
            <View>
              <Text style={tw(text.sm, text.semibold, spacing.mb(2))}>
                Duration (minutes)
              </Text>
              <Input
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>

            {/* Distance Input */}
            <View>
              <Text style={tw(text.sm, text.semibold, spacing.mb(2))}>
                Distance (miles)
              </Text>
              <Input
                value={distance}
                onChangeText={setDistance}
                placeholder="3.1"
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        {/* Notes Input */}
        <View>
          <Text style={tw(text.sm, text.semibold, spacing.mb(2))}>
            Notes (optional)
          </Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="How did this set feel?"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Action Buttons */}
        <View style={tw(layout.flexRow, spacing.gap(3), spacing.mt(4))}>
          <Button
            onPress={onSkip}
            variant="outline"
            style={tw(layout.flex1)}
          >
            Skip Set
          </Button>
          <Button
            onPress={handleComplete}
            variant="gradient"
            style={tw(layout.flex1)}
            disabled={!reps && !duration && !distance}
          >
            Complete Set
          </Button>
        </View>
      </View>
    </View>
  );
}