import React from 'react';
import { View, Platform, Dimensions, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tw, spacing, layout, text } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

interface SafeLayoutProps {
  children: React.ReactNode;
  style?: any;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
}

export const SafeLayout: React.FC<SafeLayoutProps> = ({
  children,
  style,
  edges = ['top', 'bottom'],
  backgroundColor
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width, height } = Dimensions.get('window');

  // iPhone Dynamic Island detection (iPhone 14 Pro and later)
  const isDynamicIslandDevice = Platform.OS === 'ios' && 
    (insets.top > 50 || // Dynamic Island devices typically have >50pt top inset
     (width === 393 && height === 852) || // iPhone 14 Pro
     (width === 430 && height === 932));   // iPhone 14 Pro Max

  // Adjust top padding for Dynamic Island
  const topPadding = edges.includes('top') 
    ? isDynamicIslandDevice 
      ? Math.max(insets.top + 8, 60) // Extra padding for Dynamic Island
      : Math.max(insets.top, 44)     // Standard safe area
    : 0;

  const bottomPadding = edges.includes('bottom') 
    ? Math.max(insets.bottom, 20) 
    : 0;

  const leftPadding = edges.includes('left') 
    ? insets.left 
    : 0;

  const rightPadding = edges.includes('right') 
    ? insets.right 
    : 0;

  return (
    <View
      style={[
        tw(layout.flex1),
        {
          backgroundColor: backgroundColor || colors.background,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          paddingLeft: leftPadding,
          paddingRight: rightPadding,
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

// Instagram-style header component with Dynamic Island awareness
interface InstagramHeaderProps {
  title?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showBorder?: boolean;
}

export const InstagramHeader: React.FC<InstagramHeaderProps> = ({
  title,
  leftAction,
  rightAction,
  showBorder = true
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

  // Dynamic Island detection
  const isDynamicIslandDevice = Platform.OS === 'ios' && 
    (insets.top > 50 || 
     (width === 393 && height === 852) || 
     (width === 430 && height === 932));

  // Instagram-style header height with Dynamic Island consideration
  const headerHeight = isDynamicIslandDevice 
    ? Math.max(insets.top + 52, 112) // Taller for Dynamic Island
    : Math.max(insets.top + 44, 88);  // Standard height

  return (
    <View
      style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.px(4)),
        {
          height: headerHeight,
          backgroundColor: colors.background,
          paddingTop: isDynamicIslandDevice 
            ? Math.max(insets.top + 8, 60) 
            : Math.max(insets.top, 44),
          borderBottomWidth: showBorder ? 1 : 0,
          borderBottomColor: colors.border,
        }
      ]}
    >
      <View style={tw(layout.flex1, layout.itemsStart)}>
        {leftAction}
      </View>

      {title && (
        <View style={tw(layout.flex2, layout.itemsCenter)}>
          <Text
            style={[
              tw(text.lg, text.semibold),
              {
                color: colors.foreground,
                fontFamily: 'System', // Instagram uses system font for headers
                fontWeight: '600',
              }
            ]}
          >
            {title}
          </Text>
        </View>
      )}

      <View style={tw(layout.flex1, layout.itemsEnd)}>
        {rightAction}
      </View>
    </View>
  );
};

// Instagram-style tab bar with Dynamic Island support
interface InstagramTabBarProps {
  children: React.ReactNode;
}

export const InstagramTabBar: React.FC<InstagramTabBarProps> = ({ children }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyAround, spacing.px(4)),
        {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 20),
          paddingTop: 12,
          height: Platform.OS === 'ios' 
            ? Math.max(insets.bottom + 60, 80)
            : 68,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }
      ]}
    >
      {children}
    </View>
  );
};