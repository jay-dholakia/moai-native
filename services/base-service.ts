import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import { ServiceResponse } from './types';

// Helper function to get valid session before making requests
export const getValidSessionForRequest = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session error:", error);
      return null;
    }
    
    if (!session) {
      console.log("No session available");
      return null;
    }
    
    // Check if token is expired or about to expire (within 3 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    if (expiresAt && expiresAt < (now + 180)) { // 3 minutes threshold
      console.log("Token expiring soon, refreshing...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error("Failed to refresh session:", refreshError);
        return null;
      }
      
      console.log("Session refreshed successfully");
      return refreshData.session;
    }
    
    return session;
  } catch (error) {
    console.error("Error in getValidSessionForRequest:", error);
    return null;
  }
};

// Generic error handler for React Native
export const handleServiceError = (error: any, operation: string): void => {
  console.error(`Error in ${operation}:`, error);
  
  // Don't show alerts for authentication errors - handle them at app level
  if (error?.message?.includes('JWT')) {
    console.log('JWT error detected, will be handled by auth context');
    return;
  }
  
  // Show user-friendly error messages
  const errorMessage = error?.message || 'An unexpected error occurred';
  Alert.alert(
    'Error',
    `${operation}: ${errorMessage}`,
    [{ text: 'OK', style: 'default' }],
    { cancelable: true }
  );
};

// Success message handler for React Native
export const showSuccessMessage = (message: string): void => {
  Alert.alert(
    'Success',
    message,
    [{ text: 'OK', style: 'default' }],
    { cancelable: true }
  );
};

// Generic service wrapper that handles common patterns
export const withServiceWrapper = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  showSuccess: boolean = false,
  successMessage?: string
): Promise<ServiceResponse<T>> => {
  try {
    // Check for valid session before making the request
    const session = await getValidSessionForRequest();
    if (!session) {
      return {
        error: 'Authentication required',
        success: false
      };
    }

    const result = await operation();
    
    if (showSuccess) {
      showSuccessMessage(successMessage || `${operationName} completed successfully`);
    }
    
    return {
      data: result,
      success: true
    };
  } catch (error: any) {
    handleServiceError(error, operationName);
    return {
      error: error?.message || 'An unexpected error occurred',
      success: false
    };
  }
};

// Utility for handling file uploads in React Native
export const uploadFile = async (
  bucket: string,
  path: string,
  file: Blob | File,
  options?: { 
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
): Promise<ServiceResponse<string>> => {
  return withServiceWrapper(async () => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
        contentType: options?.contentType
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }, 'File upload');
};

// Utility for deleting files
export const deleteFile = async (
  bucket: string,
  path: string
): Promise<ServiceResponse<boolean>> => {
  return withServiceWrapper(async () => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  }, 'File deletion');
};

// Utility for real-time subscriptions
export const createRealtimeSubscription = (
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) => {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      },
      (payload) => {
        console.log(`Real-time update for ${table}:`, payload);
        callback?.(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Utility for pagination
export const withPagination = async <T>(
  query: any,
  page: number = 0,
  limit: number = 20
): Promise<{ data: T[]; count: number; hasMore: boolean }> => {
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    hasMore: (data?.length || 0) === limit
  };
};

// Base service class that other services can extend
export abstract class BaseService {
  protected static supabase = supabase;
  
  protected static async handleError(error: any, operation: string): Promise<ServiceResponse<any>> {
    console.error(`${operation} error:`, error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
  
  protected static async withErrorHandling<T>(
    operation: () => Promise<{ data: T; error: any }>,
    operationName: string
  ): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        return this.handleError(error, operationName);
      }
      
      return { success: true, data };
    } catch (error) {
      return this.handleError(error, operationName);
    }
  }
}