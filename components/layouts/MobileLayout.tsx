import React from 'react';
import { View, ScrollView, SafeAreaView, Dimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tw, layout, spacing, bg } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

const { width: screenWidth } = Dimensions.get('window');

export interface MobileLayoutProps {
  children: React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
  scrollable?: boolean;
  hideNavigation?: boolean;
  maxWidth?: number;
  padding?: boolean;
  safeArea?: boolean;
  testID?: string;
}

/**
 * Responsive layout component for consistent page structure across React Native
 * Adapted from the web app's MobileLayout with React Native optimizations
 */
export const MobileLayout = React.forwardRef<ScrollView | View, MobileLayoutProps>(
  ({ 
    children,
    style,
    contentContainerStyle,
    scrollable = true,
    hideNavigation = false,
    maxWidth,
    padding = true,
    safeArea = true,
    testID,
    ...props 
  }, ref) => {
    const { theme, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { width, height } = Dimensions.get('window');

    // Simplified safe area handling
    const topPadding = safeArea ? insets.top : 0;
    const bottomPadding = safeArea ? insets.bottom : 0;

    // Base container styles
    const containerStyles = [
      tw(layout.flex1),
      {
        backgroundColor: colors.background,
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
      },
      style
    ];

    // Content styles with proper spacing
    const contentStyles = [
      tw(layout.flex1),
      padding && tw(spacing.px(4)),
      !hideNavigation && tw(spacing.pb(20)), // Space for bottom navigation
      maxWidth && { maxWidth, alignSelf: 'center' as const, width: '100%' },
      contentContainerStyle
    ];

    // Render scrollable or non-scrollable content
    const renderContent = () => {
      if (scrollable) {
        return (
          <ScrollView
            ref={ref as React.Ref<ScrollView>}
            style={tw(layout.flex1)}
            contentContainerStyle={contentStyles}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            testID={testID}
            {...props}
          >
            {children}
          </ScrollView>
        );
      }
      
      return (
        <View
          ref={ref as React.Ref<View>}
          style={contentStyles}
          testID={testID}
          {...props}
        >
          {children}
        </View>
      );
    };

    // Always use View with custom padding for better Dynamic Island control
    return (
      <View style={containerStyles}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        {renderContent()}
      </View>
    );
  }
);

MobileLayout.displayName = 'MobileLayout';

export default MobileLayout;