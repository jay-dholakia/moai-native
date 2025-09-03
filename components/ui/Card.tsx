import React from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { tw, spacing, text, bg, border, layout } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

export interface CardProps {
  children: React.ReactNode;
  style?: any;
  testID?: string;
  blur?: boolean;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardHeaderProps {
  children: React.ReactNode;
  style?: any;
}

export interface CardTitleProps {
  children: React.ReactNode;
  style?: any;
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  style?: any;
}

export interface CardContentProps {
  children: React.ReactNode;
  style?: any;
}

export interface CardFooterProps {
  children: React.ReactNode;
  style?: any;
}

const Card = React.forwardRef<View, CardProps>(
  ({ children, style, testID, blur = false, elevation = 'md', ...props }, ref) => {
    const { theme, colors } = useTheme();

    // Enhanced shadow configurations
    const shadowConfigs = {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
      },
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
      },
    };

    const baseStyles = [
      tw(border.rounded, spacing.p(0)),
      {
        borderWidth: 1,
        borderColor: colors.border,
        ...shadowConfigs[elevation],
      },
      style
    ];

    if (blur && theme === 'dark') {
      return (
        <BlurView
          intensity={80}
          tint="dark"
          style={[
            baseStyles,
            {
              backgroundColor: 'transparent',
              overflow: 'hidden',
            }
          ]}
          {...props}
        >
          <View style={[
            tw(layout.flex1),
            { backgroundColor: colors.card + '80' } // Semi-transparent overlay
          ]}>
            {children}
          </View>
        </BlurView>
      );
    }

    return (
      <View
        ref={ref}
        style={[
          baseStyles,
          { backgroundColor: colors.card }
        ]}
        testID={testID}
        {...props}
      >
        {children}
      </View>
    );
  }
);

const CardHeader = React.forwardRef<View, CardHeaderProps>(
  ({ children, style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          tw(layout.flex1, layout.flexCol, spacing.p(6), spacing.pb(0)),
          style
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }
);

const CardTitle = React.forwardRef<Text, CardTitleProps>(
  ({ children, style, ...props }, ref) => {
    const { theme, colors } = useTheme();

    return (
      <Text
        ref={ref}
        style={[
          tw(text.lg, text.semibold),
          { color: colors.foreground },
          style
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

const CardDescription = React.forwardRef<Text, CardDescriptionProps>(
  ({ children, style, ...props }, ref) => {
    const { theme, colors } = useTheme();

    return (
      <Text
        ref={ref}
        style={[
          tw(text.sm, spacing.mt(1)),
          { color: colors.mutedForeground },
          style
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

const CardContent = React.forwardRef<View, CardContentProps>(
  ({ children, style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          tw(spacing.p(6), spacing.pt(0)),
          style
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }
);

const CardFooter = React.forwardRef<View, CardFooterProps>(
  ({ children, style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          tw(layout.flexRow, layout.itemsCenter, spacing.p(6), spacing.pt(0)),
          style
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
};