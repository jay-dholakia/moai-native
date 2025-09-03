import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { TypingUser } from '@/services/typing-indicator-service';
import { Avatar } from '@/components/ui/Avatar';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const { colors } = useTheme();
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Animate typing dots
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const animateDots = () => {
      const animations = animatedValues.map((value, index) =>
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(value, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.loop(
        Animated.parallel(animations),
        { iterations: -1 }
      ).start();
    };

    animateDots();

    return () => {
      animatedValues.forEach(value => {
        value.stopAnimation();
        value.setValue(0);
      });
    };
  }, [typingUsers.length, animatedValues]);

  if (typingUsers.length === 0) {
    return null;
  }

  const formatTypingText = () => {
    const names = typingUsers.map(user => user.first_name).filter(Boolean);
    
    if (names.length === 0) {
      return 'Someone is typing...';
    } else if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${names[0]} and ${names.length - 1} others are typing...`;
    }
  };

  return (
    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.p(3), spacing.gap(2))}>
      {/* Show avatars for typing users (max 3) */}
      <View style={tw(layout.flexRow, spacing.gap(1))}>
        {typingUsers.slice(0, 3).map((user, index) => (
          <Avatar
            key={user.user_id}
            source={user.profile_image}
            fallback={`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`}
            size="sm"
            style={{ marginLeft: index > 0 ? -8 : 0 }}
          />
        ))}
      </View>

      {/* Typing message bubble */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, spacing.px(3), spacing.py(2), border.rounded),
        { backgroundColor: colors.muted }
      ]}>
        <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
          {formatTypingText()}
        </Text>
        
        {/* Animated dots */}
        <View style={tw(layout.flexRow, spacing.ml(1), spacing.gap(1))}>
          {animatedValues.map((animatedValue, index) => (
            <Animated.View
              key={index}
              style={[
                {
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.mutedForeground,
                  opacity: animatedValue,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// Compact version for use in message input area
export function CompactTypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const { colors } = useTheme();
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const animateDots = () => {
      const animations = animatedValues.map((value, index) =>
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.loop(
        Animated.parallel(animations),
        { iterations: -1 }
      ).start();
    };

    animateDots();

    return () => {
      animatedValues.forEach(value => {
        value.stopAnimation();
        value.setValue(0);
      });
    };
  }, [typingUsers.length, animatedValues]);

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.px(3), spacing.py(1))}>
      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
        {typingUsers.length === 1 
          ? `${typingUsers[0].first_name} is typing` 
          : `${typingUsers.length} people are typing`
        }
      </Text>
      
      <View style={tw(layout.flexRow, spacing.ml(1), spacing.gap(1))}>
        {animatedValues.map((animatedValue, index) => (
          <Animated.View
            key={index}
            style={[
              {
                width: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: colors.mutedForeground,
                opacity: animatedValue,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}