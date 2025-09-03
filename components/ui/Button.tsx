import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tw, spacing, text, bg, border, layout } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { InstagramFonts } from '@/constants/FontConfig';
import { InstagramColors } from '@/constants/InstagramTheme';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  testID?: string;
}

const Button = React.forwardRef<any, ButtonProps>(
  ({ 
    children, 
    onPress, 
    variant = 'default', 
    size = 'default', 
    disabled = false, 
    loading = false,
    style,
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
      { 
        minHeight: 44, // Instagram minimum touch target
        borderRadius: 8, // Instagram's button border radius
      }
    ];

    // Variant styles
    const variantStyles = {
      default: [
        { backgroundColor: colors.primary },
        disabled && { backgroundColor: colors.muted }
      ],
      destructive: [
        { backgroundColor: colors.destructive },
        disabled && { backgroundColor: colors.muted }
      ],
      outline: [
        { 
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border 
        },
        disabled && { borderColor: colors.muted }
      ],
      secondary: [
        { backgroundColor: colors.secondary },
        disabled && { backgroundColor: colors.muted }
      ],
      ghost: [
        { backgroundColor: 'transparent' }
      ],
      link: [
        { backgroundColor: 'transparent' }
      ],
      gradient: [
        { backgroundColor: 'transparent' },
        disabled && { backgroundColor: colors.muted }
      ]
    };

    // Size styles
    const sizeStyles = {
      default: tw(spacing.px(4), spacing.py(3)),
      sm: tw(spacing.px(3), spacing.py(2)),
      lg: tw(spacing.px(6), spacing.py(4)),
      icon: tw(spacing.p(3))
    };

    // Text color based on variant
    const getTextColor = () => {
      if (disabled) return colors.mutedForeground;
      
      switch (variant) {
        case 'default':
          return colors.primaryForeground;
        case 'destructive':
          return colors.destructiveForeground;
        case 'outline':
          return colors.foreground;
        case 'secondary':
          return colors.secondaryForeground;
        case 'ghost':
          return colors.foreground;
        case 'link':
          return colors.primary;
        case 'gradient':
          return '#FFFFFF';
        default:
          return colors.primaryForeground;
      }
    };

    // Instagram-style gradient colors
    const getGradientColors = (): [string, string, ...string[]] => {
      return InstagramColors.gradients.button as [string, string, ...string[]];
    };

    // Text size based on button size
    const getTextSize = () => {
      switch (size) {
        case 'sm':
          return tw(text.sm);
        case 'lg':
          return tw(text.base);
        case 'icon':
          return tw(text.sm);
        default:
          return tw(text.sm);
      }
    };

    const handlePress = () => {
      if (!disabled && !loading && onPress) {
        onPress();
      }
    };

    const buttonContent = (
      <>
        {loading && (
          <ActivityIndicator 
            size="small" 
            color={getTextColor()} 
            style={{ marginRight: 8 }}
          />
        )}
        
        {typeof children === 'string' ? (
          <Text 
            style={[
              getTextSize(),
              tw(text.semibold), // Instagram uses semibold for buttons
              {
                color: getTextColor(),
                fontFamily: InstagramFonts.family.primary,
                letterSpacing: 0, // Instagram style
              }
            ]}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </>
    );

    const buttonStyles = [
      baseStyles,
      variant !== 'gradient' && variantStyles[variant],
      sizeStyles[size],
      disabled && { opacity: 0.5 }
    ];

    if (variant === 'gradient' && !disabled) {
      return (
        <TouchableOpacity
          ref={ref}
          style={[buttonStyles, style]}
          onPress={handlePress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          testID={testID}
          {...props}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, layout.flexRow, border.rounded),
              sizeStyles[size]
            ]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        ref={ref}
        style={[buttonStyles, style]}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        testID={testID}
        {...props}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

export { Button };