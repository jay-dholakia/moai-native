import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a client with React Native optimizations
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // React Native specific optimizations
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
        retry: (failureCount, error: any) => {
          // Don't retry on network errors in React Native
          if (error?.message?.includes('Network request failed')) {
            return false;
          }
          // Don't retry on auth errors
          if (error?.message?.includes('JWT') || error?.message?.includes('Authentication')) {
            return false;
          }
          return failureCount < 2; // Reduce retry attempts for mobile
        },
        refetchOnWindowFocus: false, // Not applicable in React Native
        refetchOnReconnect: true, // Refetch when network reconnects
        networkMode: 'online', // Only run queries when online
      },
      mutations: {
        retry: (failureCount, error: any) => {
          // Don't retry mutations on auth errors
          if (error?.message?.includes('JWT') || error?.message?.includes('Authentication')) {
            return false;
          }
          return failureCount < 1; // Only retry once for mutations
        },
        networkMode: 'online',
      },
    },
  });
};

// Create query client instance
let queryClient: QueryClient;

export const getQueryClient = () => {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
};

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const client = getQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

// Utility functions for cache management
export const clearQueryCache = () => {
  const client = getQueryClient();
  client.clear();
};

export const invalidateAllQueries = () => {
  const client = getQueryClient();
  client.invalidateQueries();
};

export const removeQueriesForUser = (userId: string) => {
  const client = getQueryClient();
  client.removeQueries({ queryKey: ['profile', userId] });
  client.removeQueries({ queryKey: ['userMoais', userId] });
  // Add other user-specific queries as needed
};

// Prefetch utilities for better UX
export const prefetchUserData = async (userId: string) => {
  const client = getQueryClient();
  
  // We can add prefetching logic here if needed
  // For example, prefetch user profile and moais when app starts
};

// Cache persistence utilities (optional)
export const persistQueryClientToStorage = async () => {
  try {
    const client = getQueryClient();
    const clientState = JSON.stringify({
      queries: client.getQueryCache().getAll().map(query => ({
        queryKey: query.queryKey,
        queryHash: query.queryHash,
        state: query.state,
      })),
    });
    await AsyncStorage.setItem('queryClient', clientState);
  } catch (error) {
    console.error('Failed to persist query client to storage:', error);
  }
};

export const restoreQueryClientFromStorage = async () => {
  try {
    const clientState = await AsyncStorage.getItem('queryClient');
    if (clientState) {
      const parsedState = JSON.parse(clientState);
      // Implement restoration logic if needed
      console.log('Query client state restored from storage');
    }
  } catch (error) {
    console.error('Failed to restore query client from storage:', error);
  }
};