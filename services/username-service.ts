import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

/**
 * Validates username format
 * @param username - The username to validate
 * @returns Error message if invalid, null if valid
 */
export function validateUsername(username: string): string | null {
  if (!username) {
    return 'Username is required';
  }

  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (username.length > 20) {
    return 'Username must be less than 20 characters';
  }

  // Only allow alphanumeric, underscore, and dash
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and dashes';
  }

  // Don't allow consecutive special characters
  if (/[_-]{2,}/.test(username)) {
    return 'Username cannot have consecutive special characters';
  }

  // Don't allow starting or ending with special characters
  if (/^[_-]|[_-]$/.test(username)) {
    return 'Username cannot start or end with special characters';
  }

  return null;
}

/**
 * Checks if a username is available
 * @param username - The username to check
 * @returns true if available, false if taken
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single();

    // If we get an error or no data, username is available
    if (error && error.code === 'PGRST116') {
      // No rows returned, username is available
      return true;
    }

    if (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }

    // If we got data, username is taken
    return false;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
}

/**
 * Updates a user's username
 * @param userId - The user's ID
 * @param username - The new username
 * @returns ServiceResponse indicating success or failure
 */
export async function updateUsername(
  userId: string,
  username: string
): Promise<ServiceResponse<{ username: string }>> {
  try {
    // Validate username format
    const validationError = validateUsername(username);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    // Check availability
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      return {
        success: false,
        error: 'Username is already taken',
      };
    }

    // Update username
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase() })
      .eq('id', userId)
      .select('username')
      .single();

    if (error) {
      console.error('Error updating username:', error);
      return {
        success: false,
        error: 'Failed to update username',
      };
    }

    return {
      success: true,
      data: { username: data.username },
    };
  } catch (error) {
    console.error('Error in updateUsername:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}