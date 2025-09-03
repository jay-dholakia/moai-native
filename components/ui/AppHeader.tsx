import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
// Removed useSafeAreaInsets - MobileLayout handles safe area

import { InstagramFonts } from '@/constants/FontConfig';
import { InstagramColors } from '@/constants/InstagramTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { border, layout, spacing, text, tw } from '@/utils/styles';

interface AppHeaderProps {
  title?: string | React.ReactNode;
  showSignOut?: boolean;
  showProfile?: boolean;
  showBackButton?: boolean;
  rightAction?: {
    icon: React.ComponentType<any>;
    onPress: () => void;
    label: string;
  };
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'Moai',
  showSignOut = true,
  showProfile = false,
  showBackButton = false,
  rightAction,
}) => {
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  // No need for insets - MobileLayout handles safe area

  // FIXED: Don't apply safe area - MobileLayout already handles it!
  // MobileLayout applies paddingTop: insets.top, so we just need content padding
  const headerHeight = 56; // Fixed content height - no safe area
  const topPadding = 8; // Just content padding, no safe area
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
            await signOut();
          }
        },
      ]
    );
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={[
      tw(spacing.px(4), layout.flexRow, layout.itemsCenter, layout.justifyBetween, border.borderB),
      {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        minHeight: headerHeight,
        paddingTop: topPadding,
        paddingBottom: 4, // Further reduced padding
      }
    ]}>
      {/* Left Section - Back Button + Title */}
      <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
        {/* Back Button */}
        {showBackButton && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw(spacing.p(2), spacing.mr(3), {
              backgroundColor: InstagramColors.light.muted,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: InstagramColors.light.border,
            })}
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}
        
        {/* Title */}
        {typeof title === 'string' ? (
          <Text style={[
            tw(text.xl, text.semibold), 
            { 
              color: colors.foreground,
              fontFamily: InstagramFonts.family.display,
              fontWeight: '600',
              letterSpacing: -0.02,
              flex: 1
            }
          ]}>
            {title}
          </Text>
        ) : (
          <View style={tw(layout.flex1)}>
            {title}
          </View>
        )}
      </View>

      {/* Right Actions */}
      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
        {/* Custom Right Action */}
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={tw(spacing.p(2), {
              backgroundColor: InstagramColors.light.muted,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: InstagramColors.light.border,
            })}
            accessibilityLabel={rightAction.label}
            activeOpacity={0.7}
          >
            <rightAction.icon size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}

        {/* Profile Button */}
        {showProfile && (
          <TouchableOpacity
            onPress={handleProfilePress}
            style={tw(spacing.p(2), {
              backgroundColor: InstagramColors.light.muted,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: InstagramColors.light.border,
            })}
            accessibilityLabel="Go to profile"
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}

        {/* Sign Out Button */}
        {showSignOut && (
          <TouchableOpacity
            onPress={handleSignOut}
            style={tw(spacing.p(2), {
              backgroundColor: InstagramColors.light.destructive + '10',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: InstagramColors.light.destructive + '20',
            })}
            accessibilityLabel="Sign out"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color={InstagramColors.light.destructive} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Quick access sign out button for floating usage
export const QuickSignOutButton: React.FC<{ style?: any }> = ({ style }) => {
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
            await signOut();
          }
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      style={[
        tw(spacing.p(3), border.rounded, {
          backgroundColor: colors.destructive,
          position: 'absolute',
          top: 60,
          right: 20,
          zIndex: 1000,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }),
        style,
      ]}
      accessibilityLabel="Sign out"
    >
      <Ionicons name="log-out" size={20} color={colors.destructiveForeground} />
    </TouchableOpacity>
  );
};