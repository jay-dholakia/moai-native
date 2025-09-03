import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';

interface GlobalSignOutProps {
  children: React.ReactNode;
}

export const GlobalSignOut: React.FC<GlobalSignOutProps> = ({ children }) => {
  const [showQuickSignOut, setShowQuickSignOut] = useState(false);
  const [longPressTimeout, setLongPressTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { signOut } = useAuth();
  const { colors } = useTheme();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setShowQuickSignOut(false);
            await signOut();
          }
        },
      ]
    );
  };

  const handleLongPressStart = () => {
    const timeout = setTimeout(() => {
      setShowQuickSignOut(true);
    }, 2000); // 2 second long press
    setLongPressTimeout(timeout);
  };

  const handleLongPressEnd = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const hideQuickSignOut = () => {
    setShowQuickSignOut(false);
  };

  return (
    <View style={tw(layout.flex1)}>
      <Pressable
        style={tw(layout.flex1)}
        onLongPress={handleLongPressStart}
        onPressOut={handleLongPressEnd}
        delayLongPress={2000}
      >
        {children}
      </Pressable>

      {/* Quick Sign Out Overlay */}
      {showQuickSignOut && (
        <View style={tw(layout.absolute, {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          justifyContent: 'center',
          alignItems: 'center',
        })}>
          <View style={tw(spacing.p(6), border.rounded, spacing.m(6), {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            maxWidth: 300,
          })}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={tw(text.lg, text.semibold, { color: colors.foreground })}>
                Quick Sign Out
              </Text>
              <TouchableOpacity onPress={hideQuickSignOut}>
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={tw(text.sm, spacing.mb(6), { color: colors.mutedForeground })}>
              You can sign out from anywhere by long-pressing and holding for 2 seconds
            </Text>

            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <TouchableOpacity
                onPress={hideQuickSignOut}
                style={tw(layout.flex1, spacing.p(3), border.rounded, {
                  backgroundColor: colors.muted,
                })}
              >
                <Text style={tw(text.center, text.medium, { color: colors.foreground })}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSignOut}
                style={tw(layout.flex1, spacing.p(3), border.rounded, {
                  backgroundColor: colors.destructive,
                })}
              >
                <Text style={tw(text.center, text.medium, { color: colors.destructiveForeground })}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};