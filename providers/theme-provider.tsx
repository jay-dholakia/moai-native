import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Tokens';
import { Theme, getThemeColors } from '@/utils/styles';

type ThemeContextType = {
  theme: Theme;
  colors: ReturnType<typeof getThemeColors>;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@moai-theme';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'light',
  storageKey = THEME_STORAGE_KEY 
}: ThemeProviderProps) {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from storage on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(storageKey);
        if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
          setThemeState(storedTheme as Theme);
        } else {
          // Use device color scheme if no stored preference
          setThemeState(deviceColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Failed to load theme from storage:', error);
        // Fallback to device color scheme
        setThemeState(deviceColorScheme === 'dark' ? 'dark' : 'light');
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, [storageKey, deviceColorScheme]);

  // Save theme to storage when it changes
  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.error('Failed to save theme to storage:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const value: ThemeContextType = {
    theme,
    colors,
    toggleTheme,
    setTheme,
    isDark,
  };

  // Don't render children until theme is loaded from storage
  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for accessing themed colors directly
export function useThemedColors() {
  const { colors } = useTheme();
  return colors;
}

// Hook for theme-aware styles
export function useThemedStyles<T>(
  createStyles: (theme: Theme, colors: ReturnType<typeof getThemeColors>) => T
) {
  const { theme, colors } = useTheme();
  return React.useMemo(() => createStyles(theme, colors), [theme, colors, createStyles]);
}

// Theme-aware component wrapper
interface ThemedViewProps {
  children: React.ReactNode;
  style?: any;
  lightColor?: string;
  darkColor?: string;
}

export function ThemedView({ 
  children, 
  style, 
  lightColor, 
  darkColor, 
  ...props 
}: ThemedViewProps) {
  const { theme } = useTheme();
  const backgroundColor = theme === 'light' ? lightColor : darkColor;
  
  return (
    <View style={[{ backgroundColor }, style]} {...props}>
      {children}
    </View>
  );
}

interface ThemedTextProps {
  children: React.ReactNode;
  style?: any;
  lightColor?: string;
  darkColor?: string;
}

export function ThemedText({ 
  children, 
  style, 
  lightColor, 
  darkColor, 
  ...props 
}: ThemedTextProps) {
  const { theme } = useTheme();
  const color = theme === 'light' ? lightColor : darkColor;
  
  return (
    <Text style={[{ color }, style]} {...props}>
      {children}
    </Text>
  );
}

// Status bar style helper
export function useStatusBarStyle() {
  const { isDark } = useTheme();
  return isDark ? 'light' : 'dark';
}

// System theme detection helper
export function useSystemTheme() {
  const deviceColorScheme = useDeviceColorScheme();
  return deviceColorScheme === 'dark' ? 'dark' : 'light';
}

// Theme preset configurations
export const themePresets = {
  light: {
    colors: Colors.light,
    statusBarStyle: 'dark-content' as const,
  },
  dark: {
    colors: Colors.dark,
    statusBarStyle: 'light-content' as const,
  },
} as const;