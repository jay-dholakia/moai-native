import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { Colors } from '@/constants/Tokens';
import { useTheme } from '@/providers/theme-provider';
import { Ionicons } from '@expo/vector-icons';

interface RestTimerProps {
  seconds: number;
  onSkip: () => void;
}

export function RestTimer({ seconds, onSkip }: RestTimerProps) {
  const { colors: themeColors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for urgency
  useEffect(() => {
    if (seconds <= 10 && seconds > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [seconds]);

  // Progress animation
  useEffect(() => {
    if (seconds > 0) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [seconds]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (seconds <= 10) return Colors.light.destructive;
    if (seconds <= 30) return Colors.moai.yellow;
    return themeColors.primary;
  };

  const getTimerMessage = () => {
    if (seconds <= 10) return 'Almost ready! 💪';
    if (seconds <= 30) return 'Get ready for the next set';
    return 'Rest time - catch your breath';
  };

  if (isExpanded) {
    return (
      <View style={tw(spacing.p(4))}>
        <Card elevation="md">
          <View style={tw(spacing.p(6), layout.itemsCenter, layout.justifyCenter)}>
            {/* Large Timer Display */}
            <Animated.View 
              style={[
                tw(layout.itemsCenter, layout.justifyCenter, spacing.mb(4)),
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View
                style={[
                  tw(spacing.w(32), spacing.h(32), border.roundedFull, layout.itemsCenter, layout.justifyCenter),
                  { borderColor: getTimerColor(), borderWidth: 4 }
                ]}
              >
                <Text 
                  style={[
                    tw(text['4xl'], text.semibold),
                    { color: getTimerColor() }
                  ]}
                >
                  {formatTime(seconds)}
                </Text>
              </View>
            </Animated.View>

            {/* Timer Message */}
            <Text style={tw(text.lg, text.center, spacing.mb(6))}>
              {getTimerMessage()}
            </Text>

            {/* Progress Bar */}
            <View 
              style={[
                tw(spacing.w(32), spacing.h(2), border.rounded, spacing.mb(6)),
                { backgroundColor: themeColors.border, width: '100%' }
              ]}
            >
              <Animated.View
                style={[
                  tw(spacing.h(2), border.rounded),
                  {
                    backgroundColor: getTimerColor(),
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* Action Buttons */}
            <View style={tw(layout.flexRow, spacing.gap(4))}>
              <Button
                onPress={() => setIsExpanded(false)}
                variant="outline"
                size="lg"
              >
                <Ionicons name="chevron-down" size={20} color={themeColors.foreground} />
                <Text style={tw(spacing.ml(2))}>Minimize</Text>
              </Button>
              <Button
                onPress={onSkip}
                variant="gradient"
                size="lg"
              >
                Skip Rest
              </Button>
            </View>
          </View>
        </Card>
      </View>
    );
  }

  // Minimized view
  return (
    <View style={tw(spacing.p(4))}>
      <Card 
        elevation="sm"
        style={[
          tw(border.borderL),
          { borderLeftColor: getTimerColor(), borderLeftWidth: 4 }
        ]}
      >
        <View style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <Ionicons 
                name="timer-outline" 
                size={24} 
                color={getTimerColor()}
              />
              <View>
                <Text 
                  style={[
                    tw(text.lg, text.semibold),
                    { color: getTimerColor() }
                  ]}
                >
                  {formatTime(seconds)}
                </Text>
                <Text style={tw(text.sm, text.muted)}>
                  Rest time
                </Text>
              </View>
            </View>

            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <Button
                onPress={() => setIsExpanded(true)}
                variant="outline"
                size="sm"
              >
                <Ionicons name="expand" size={16} color={themeColors.foreground} />
              </Button>
              <Button
                onPress={onSkip}
                variant="secondary"
                size="sm"
              >
                Skip
              </Button>
            </View>
          </View>

          {/* Mini Progress Bar */}
          <View 
            style={[
              tw(spacing.w(32), spacing.h(1), border.rounded, spacing.mt(3)),
              { backgroundColor: themeColors.border, width: '100%' }
            ]}
          >
            <Animated.View
              style={[
                tw(spacing.h(1), border.rounded),
                {
                  backgroundColor: getTimerColor(),
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </Card>
    </View>
  );
}