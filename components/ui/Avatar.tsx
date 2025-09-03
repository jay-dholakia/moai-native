import React from 'react';
import { View, Text, Image } from 'react-native';
import { tw, spacing, text, bg, border, layout } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

export interface AvatarProps {
  size?: 'sm' | 'default' | 'md' | 'lg' | 'xl' | number;
  source?: { uri: string } | number | string;
  fallback?: string;
  style?: any;
  testID?: string;
}

export interface AvatarImageProps {
  source: { uri: string } | number;
  style?: any;
}

export interface AvatarFallbackProps {
  children: React.ReactNode;
  style?: any;
}

const Avatar = React.forwardRef<View, AvatarProps>(
  ({ 
    size = 'default',
    source,
    fallback,
    style,
    testID,
    ...props 
  }, ref) => {
    const { theme, colors } = useTheme();
    const [imageError, setImageError] = React.useState(false);

    // Size configurations
    const sizeConfigs = {
      sm: { width: 32, height: 32, fontSize: tw(text.xs) },
      default: { width: 40, height: 40, fontSize: tw(text.sm) },
      md: { width: 44, height: 44, fontSize: tw(text.sm) },
      lg: { width: 48, height: 48, fontSize: tw(text.base) },
      xl: { width: 64, height: 64, fontSize: tw(text.lg) },
    };

    const currentSize = typeof size === 'number' 
      ? { width: size, height: size, fontSize: tw(text.sm) }
      : sizeConfigs[size];

    const baseStyles = [
      tw(layout.itemsCenter, layout.justifyCenter),
      {
        width: currentSize.width,
        height: currentSize.height,
        borderRadius: currentSize.width / 2,
        backgroundColor: colors.muted,
        overflow: 'hidden',
      }
    ];

    // Convert string source to proper format
    const imageSource = React.useMemo(() => {
      if (!source) return undefined;
      if (typeof source === 'string') {
        return { uri: source };
      }
      return source;
    }, [source]);

    // Show fallback if no source or image failed to load
    const showFallback = !imageSource || imageError;

    return (
      <View
        ref={ref}
        style={[baseStyles, style]}
        testID={testID}
        {...props}
      >
        {!showFallback && imageSource && (
          <Image
            source={imageSource}
            style={{
              width: currentSize.width,
              height: currentSize.height,
              borderRadius: currentSize.width / 2,
            }}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        )}
        
        {showFallback && fallback && (
          <Text 
            style={[
              currentSize.fontSize,
              tw(text.medium),
              { color: colors.mutedForeground }
            ]}
          >
            {fallback.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
    );
  }
);

const AvatarImage = React.forwardRef<Image, AvatarImageProps>(
  ({ source, style, ...props }, ref) => {
    return (
      <Image
        ref={ref}
        source={source}
        style={[
          {
            width: '100%',
            height: '100%',
          },
          style
        ]}
        resizeMode="cover"
        {...props}
      />
    );
  }
);

const AvatarFallback = React.forwardRef<View, AvatarFallbackProps>(
  ({ children, style, ...props }, ref) => {
    const { theme, colors } = useTheme();

    return (
      <View
        ref={ref}
        style={[
          tw(layout.flex1, layout.itemsCenter, layout.justifyCenter),
          {
            backgroundColor: colors.muted,
          },
          style
        ]}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text 
            style={[
              tw(text.sm, text.medium),
              { color: colors.mutedForeground }
            ]}
          >
            {children.charAt(0).toUpperCase()}
          </Text>
        ) : (
          children
        )}
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';
AvatarImage.displayName = 'AvatarImage';
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };