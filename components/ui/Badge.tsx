import React from 'react';
import { View, Text } from 'react-native';
import { tw, spacing, text, bg, border, layout } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'default' | 'lg';
  style?: any;
  textStyle?: any;
  testID?: string;
}

const Badge = React.forwardRef<View, BadgeProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'default',
    style,
    textStyle,
    testID,
    ...props 
  }, ref) => {
    const { theme, colors } = useTheme();

    // Base styles
    const baseStyles = [
      tw(
        layout.flexRow,
        layout.itemsCenter,
        layout.justifyCenter,
        border.rounded
      ),
      { borderRadius: 12 } // More rounded for mobile
    ];

    // Variant styles
    const variantStyles = {
      default: {
        backgroundColor: colors.primary,
        textColor: colors.primaryForeground,
      },
      secondary: {
        backgroundColor: colors.secondary,
        textColor: colors.secondaryForeground,
      },
      destructive: {
        backgroundColor: colors.destructive,
        textColor: colors.destructiveForeground,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        textColor: colors.foreground,
      },
      success: {
        backgroundColor: '#10b981', // green-500
        textColor: '#ffffff',
      },
      warning: {
        backgroundColor: '#f59e0b', // yellow-500
        textColor: '#ffffff',
      },
    };

    // Size styles
    const sizeStyles = {
      sm: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        textSize: tw(text.xs),
      },
      default: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        textSize: tw(text.xs),
      },
      lg: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        textSize: tw(text.sm),
      },
    };

    const currentVariant = variantStyles[variant];
    const currentSize = sizeStyles[size];

    return (
      <View
        ref={ref}
        style={[
          baseStyles,
          {
            backgroundColor: currentVariant.backgroundColor,
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: variant === 'outline' ? (currentVariant as any).borderColor : 'transparent',
            paddingHorizontal: currentSize.paddingHorizontal,
            paddingVertical: currentSize.paddingVertical,
          },
          style
        ]}
        testID={testID}
        {...props}
      >
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text 
            style={[
              currentSize.textSize,
              tw(text.medium),
              { color: currentVariant.textColor },
              textStyle
            ]}
          >
            {String(children)}
          </Text>
        ) : (
          children
        )}
      </View>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };