import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { Home, Users, BarChart3, MessageCircle, Bell, User } from 'lucide-react-native';
import { GlobalSignOut } from '@/components/ui/GlobalSignOut';
import { ContentSpacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/providers/theme-provider';
import { ProfileGuard } from '@/components/guards';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

  // Simplified device handling

  return (
    <ProfileGuard>
      <GlobalSignOut>
        <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' 
            ? insets.bottom + 8 
            : 12,
          paddingTop: 12,
          paddingHorizontal: ContentSpacing.screenPadding,
          height: Platform.OS === 'ios' 
            ? insets.bottom + 68
            : 68,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="moais"
        options={{
          title: 'Moais',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
        </Tabs>
      </GlobalSignOut>
    </ProfileGuard>
  );
}