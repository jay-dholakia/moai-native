import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Our custom providers
import { QueryProvider } from './query-provider';
import { SupabaseProvider } from './supabase-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root provider component that wraps the entire app with all necessary providers.
 * This ensures proper order of provider nesting and makes it easy to manage all app-wide context.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryProvider>
            <SupabaseProvider>
              <ToastProvider>
                <StatusBarManager />
                {children}
              </ToastProvider>
            </SupabaseProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Component that manages the status bar based on the current theme
 */
function StatusBarManager() {
  // We'll implement this once we have theme hook available
  return <StatusBar style="auto" />;
}

// Export individual providers for flexibility
export { QueryProvider } from './query-provider';
export { SupabaseProvider } from './supabase-provider';
export { ThemeProvider } from './theme-provider';
export { ToastProvider } from './toast-provider';