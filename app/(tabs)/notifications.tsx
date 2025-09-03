import React from 'react';
import { View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Settings } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, layout } from '@/utils/styles';
import { NotificationList } from '@/components/notifications/NotificationList';
import { AppHeader } from '@/components/ui/AppHeader';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const handleNotificationNavigation = (notification: any) => {
    switch (notification.type) {
      case 'activity_tag':
        // Navigate to activity detail or activities tab
        router.push('/(tabs)/activities');
        break;
      case 'moai_invitation':
      case 'moai_join':
        // Navigate to moais tab
        router.push('/(tabs)/moais');
        break;
      case 'friend_request':
        // Navigate to profile tab
        router.push('/(tabs)/profile');
        break;
      case 'badge_earned':
        // Navigate to profile to see badges
        router.push('/(tabs)/profile');
        break;
      default:
        // Default to home
        router.push('/(tabs)');
        break;
    }
  };
  
  return (
    <View style={tw(layout.flex1)}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <AppHeader 
        title="Notifications" 
        showProfile={true}
        rightAction={{
          icon: Settings,
          onPress: () => {/* TODO: Implement notification settings */},
          label: 'Notification settings'
        }}
      />
      
      <ScrollView 
        style={tw(layout.flex1)}
        contentContainerStyle={tw(spacing.p(4))}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <NotificationList
          onNavigate={handleNotificationNavigation}
          allowDelete={true}
        />
      </ScrollView>
    </View>
  );
}