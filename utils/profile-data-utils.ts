/**
 * Utility functions for safely handling profile data that might be stored as JSON strings
 */

/**
 * Safely parses JSON fields that might be strings or already parsed objects
 */
export function safeJsonParse<T>(value: any, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  // If it's already the expected type, return it
  if (typeof value === 'object' && !Array.isArray(value) && Array.isArray(fallback)) {
    // Handle case where we expect array but got object
    return fallback;
  }
  
  if (Array.isArray(value) && Array.isArray(fallback)) {
    return value as T;
  }
  
  if (typeof value === 'object' && typeof fallback === 'object' && !Array.isArray(value) && !Array.isArray(fallback)) {
    return value as T;
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed as T;
    } catch (error) {
      console.warn('Failed to parse JSON field:', value, error);
      return fallback;
    }
  }
  
  // For any other type, return fallback
  return fallback;
}

/**
 * Safely gets array from profile field (handles both arrays and JSON strings)
 */
export function safeGetArray(value: any): any[] {
  return safeJsonParse(value, []);
}

/**
 * Safely gets object from profile field (handles both objects and JSON strings)
 */
export function safeGetObject(value: any): Record<string, any> {
  return safeJsonParse(value, {});
}

/**
 * Safely checks if a profile array field has items
 */
export function hasArrayItems(value: any): boolean {
  const arr = safeGetArray(value);
  return arr.length > 0;
}

/**
 * Safely checks if a profile object field has keys
 */
export function hasObjectKeys(value: any): boolean {
  const obj = safeGetObject(value);
  return Object.keys(obj).length > 0;
}

/**
 * Safely gets string value from profile field
 */
export function safeGetString(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value;
  }
  return fallback;
}

/**
 * Safely gets boolean value from profile field
 */
export function safeGetBoolean(value: any, fallback: boolean = false): boolean {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  // Handle string representations
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return fallback;
}