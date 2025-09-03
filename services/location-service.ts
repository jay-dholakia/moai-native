import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface GymLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  amenities: string[];
  rating: number;
  price_range: '$' | '$$' | '$$$' | '$$$$';
  hours: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  images: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutRoute {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  activity_type: 'running' | 'walking' | 'cycling' | 'hiking' | 'other';
  distance_meters: number;
  elevation_gain?: number;
  estimated_duration_minutes: number;
  difficulty_level: 'easy' | 'moderate' | 'hard' | 'expert';
  route_data: {
    coordinates: Array<{
      latitude: number;
      longitude: number;
      altitude?: number;
      timestamp?: string;
    }>;
    waypoints?: Array<{
      latitude: number;
      longitude: number;
      name: string;
      description?: string;
    }>;
  };
  start_location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  end_location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  is_public: boolean;
  is_featured: boolean;
  tags: string[];
  rating: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface LocationCheckIn {
  id: string;
  user_id: string;
  location_type: 'gym' | 'outdoor' | 'home' | 'route' | 'other';
  location_id?: string; // Reference to gym or route
  latitude: number;
  longitude: number;
  address?: string;
  activity_type?: string;
  notes?: string;
  duration_minutes?: number;
  workout_completed: boolean;
  photos?: string[];
  privacy_level: 'public' | 'friends' | 'private';
  created_at: string;
  user_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp: number;
}

export interface LocationSearchFilters {
  latitude: number;
  longitude: number;
  radius_km?: number;
  amenities?: string[];
  price_range?: string[];
  rating_min?: number;
  open_now?: boolean;
  verified_only?: boolean;
}

export interface RouteSearchFilters {
  latitude: number;
  longitude: number;
  radius_km?: number;
  activity_type?: string;
  difficulty_level?: string[];
  distance_min?: number;
  distance_max?: number;
  duration_min?: number;
  duration_max?: number;
  featured_only?: boolean;
}


export class LocationService {
  /**
   * Request location permissions from the user
   */
  static async requestLocationPermissions(): Promise<ServiceResponse<boolean>> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return { success: false, error: 'Location permission denied' };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return { success: false, error: 'Failed to request location permissions' };
    }
  }

  /**
   * Get current user location
   */
  static async getCurrentLocation(): Promise<ServiceResponse<UserLocation>> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return { success: false, error: 'Location permission not granted' };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        timestamp: location.timestamp,
      };

      return { success: true, data: userLocation };
    } catch (error) {
      console.error('Error getting current location:', error);
      return { success: false, error: 'Failed to get current location' };
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<ServiceResponse<string>> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (results.length === 0) {
        return { success: false, error: 'No address found for coordinates' };
      }

      const result = results[0];
      const address = [
        result.streetNumber,
        result.street,
        result.city,
        result.region,
        result.postalCode,
      ].filter(Boolean).join(', ');

      return { success: true, data: address };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return { success: false, error: 'Failed to get address from coordinates' };
    }
  }

  /**
   * Search for gyms near a location
   */
  static async searchGyms(filters: LocationSearchFilters): Promise<ServiceResponse<GymLocation[]>> {
    try {
      const radiusKm = filters.radius_km || 10;
      
      let query = supabase
        .from('gym_locations')
        .select('*')
        .gte('latitude', filters.latitude - (radiusKm / 111))
        .lte('latitude', filters.latitude + (radiusKm / 111))
        .gte('longitude', filters.longitude - (radiusKm / (111 * Math.cos(filters.latitude * Math.PI / 180))))
        .lte('longitude', filters.longitude + (radiusKm / (111 * Math.cos(filters.latitude * Math.PI / 180))));

      // Apply filters
      if (filters.rating_min) {
        query = query.gte('rating', filters.rating_min);
      }
      
      if (filters.verified_only) {
        query = query.eq('verified', true);
      }

      if (filters.price_range && filters.price_range.length > 0) {
        query = query.in('price_range', filters.price_range);
      }

      const { data, error } = await query
        .order('rating', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter by amenities if specified
      let filteredData = data || [];
      if (filters.amenities && filters.amenities.length > 0) {
        filteredData = filteredData.filter(gym => 
          filters.amenities!.every(amenity => gym.amenities.includes(amenity))
        );
      }

      // Calculate distances and sort by proximity
      const gymsWithDistance = filteredData.map(gym => ({
        ...gym,
        distance: this.calculateDistance(
          filters.latitude,
          filters.longitude,
          gym.latitude,
          gym.longitude
        ),
      })).sort((a, b) => a.distance - b.distance);

      return { success: true, data: gymsWithDistance };
    } catch (error) {
      console.error('Error searching gyms:', error);
      return { success: false, error: 'Failed to search gyms' };
    }
  }

  /**
   * Get gym details by ID
   */
  static async getGymDetails(gymId: string): Promise<ServiceResponse<GymLocation>> {
    try {
      const { data, error } = await supabase
        .from('gym_locations')
        .select('*')
        .eq('id', gymId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting gym details:', error);
      return { success: false, error: 'Failed to get gym details' };
    }
  }

  /**
   * Search for workout routes near a location
   */
  static async searchRoutes(filters: RouteSearchFilters): Promise<ServiceResponse<WorkoutRoute[]>> {
    try {
      const radiusKm = filters.radius_km || 10;
      
      let query = supabase
        .from('workout_routes')
        .select(`
          *,
          creator_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .gte('start_location->latitude', filters.latitude - (radiusKm / 111))
        .lte('start_location->latitude', filters.latitude + (radiusKm / 111))
        .gte('start_location->longitude', filters.longitude - (radiusKm / (111 * Math.cos(filters.latitude * Math.PI / 180))))
        .lte('start_location->longitude', filters.longitude + (radiusKm / (111 * Math.cos(filters.latitude * Math.PI / 180))));

      // Apply filters
      if (filters.activity_type) {
        query = query.eq('activity_type', filters.activity_type);
      }

      if (filters.difficulty_level && filters.difficulty_level.length > 0) {
        query = query.in('difficulty_level', filters.difficulty_level);
      }

      if (filters.distance_min) {
        query = query.gte('distance_meters', filters.distance_min * 1000);
      }

      if (filters.distance_max) {
        query = query.lte('distance_meters', filters.distance_max * 1000);
      }

      if (filters.duration_min) {
        query = query.gte('estimated_duration_minutes', filters.duration_min);
      }

      if (filters.duration_max) {
        query = query.lte('estimated_duration_minutes', filters.duration_max);
      }

      if (filters.featured_only) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate distances and sort by proximity
      const routesWithDistance = (data || []).map(route => ({
        ...route,
        distance: this.calculateDistance(
          filters.latitude,
          filters.longitude,
          route.start_location.latitude,
          route.start_location.longitude
        ),
      })).sort((a, b) => a.distance - b.distance);

      return { success: true, data: routesWithDistance };
    } catch (error) {
      console.error('Error searching routes:', error);
      return { success: false, error: 'Failed to search routes' };
    }
  }

  /**
   * Create a new workout route
   */
  static async createRoute(
    userId: string,
    routeData: Omit<WorkoutRoute, 'id' | 'user_id' | 'rating' | 'usage_count' | 'created_at' | 'updated_at' | 'creator_profile'>
  ): Promise<ServiceResponse<WorkoutRoute>> {
    try {
      const { data, error } = await supabase
        .from('workout_routes')
        .insert({
          ...routeData,
          user_id: userId,
          rating: 0,
          usage_count: 0,
        })
        .select(`
          *,
          creator_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating route:', error);
      return { success: false, error: 'Failed to create route' };
    }
  }

  /**
   * Get route details by ID
   */
  static async getRouteDetails(routeId: string): Promise<ServiceResponse<WorkoutRoute>> {
    try {
      const { data, error } = await supabase
        .from('workout_routes')
        .select(`
          *,
          creator_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('id', routeId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting route details:', error);
      return { success: false, error: 'Failed to get route details' };
    }
  }

  /**
   * Check in at a location
   */
  static async checkIn(
    userId: string,
    checkInData: Omit<LocationCheckIn, 'id' | 'user_id' | 'created_at' | 'user_profile'>
  ): Promise<ServiceResponse<LocationCheckIn>> {
    try {
      const { data, error } = await supabase
        .from('location_checkins')
        .insert({
          ...checkInData,
          user_id: userId,
        })
        .select(`
          *,
          user_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error checking in:', error);
      return { success: false, error: 'Failed to check in' };
    }
  }

  /**
   * Get recent check-ins near a location
   */
  static async getNearbyCheckIns(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<ServiceResponse<LocationCheckIn[]>> {
    try {
      const { data, error } = await supabase
        .from('location_checkins')
        .select(`
          *,
          user_profile:profiles(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('privacy_level', 'public')
        .gte('latitude', latitude - (radiusKm / 111))
        .lte('latitude', latitude + (radiusKm / 111))
        .gte('longitude', longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))
        .lte('longitude', longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting nearby check-ins:', error);
      return { success: false, error: 'Failed to get nearby check-ins' };
    }
  }

  /**
   * Find MOAIs near a location
   */
  static async findNearbyMoais(
    latitude: number,
    longitude: number,
    radiusKm: number = 25
  ): Promise<ServiceResponse<any[]>> {
    try {
      // First, find users near the location
      const { data: nearbyUsers, error: usersError } = await supabase
        .from('user_locations')
        .select('user_id')
        .gte('latitude', latitude - (radiusKm / 111))
        .lte('latitude', latitude + (radiusKm / 111))
        .gte('longitude', longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))
        .lte('longitude', longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last week

      if (usersError) throw usersError;

      if (!nearbyUsers || nearbyUsers.length === 0) {
        return { success: true, data: [] };
      }

      const userIds = nearbyUsers.map(u => u.user_id);

      // Find MOAIs with these users
      const { data, error } = await supabase
        .from('moais')
        .select(`
          *,
          moai_members!inner(
            user_id,
            role,
            profiles(
              id,
              first_name,
              last_name,
              username,
              avatar_url
            )
          )
        `)
        .in('moai_members.user_id', userIds)
        .eq('is_active', true)
        .eq('privacy_level', 'public')
        .limit(20);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error finding nearby MOAIs:', error);
      return { success: false, error: 'Failed to find nearby MOAIs' };
    }
  }

  /**
   * Update user location (for location-based discovery)
   */
  static async updateUserLocation(
    userId: string,
    location: UserLocation,
    shareLocation: boolean = false
  ): Promise<ServiceResponse<void>> {
    try {
      if (!shareLocation) {
        return { success: true, data: undefined };
      }

      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: userId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error updating user location:', error);
      return { success: false, error: 'Failed to update user location' };
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }

  /**
   * Check if location is within business hours
   */
  static isLocationOpen(hours: GymLocation['hours']): boolean {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase() as keyof typeof hours;
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todayHours = hours[dayOfWeek];
    if (!todayHours || todayHours.toLowerCase() === 'closed') {
      return false;
    }

    // Parse hours like "6:00 AM - 10:00 PM"
    const hoursMatch = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!hoursMatch) {
      return true; // Assume open if we can't parse
    }

    const [, openHour, openMin, openAmPm, closeHour, closeMin, closeAmPm] = hoursMatch;
    
    let openTime = parseInt(openHour) * 100 + parseInt(openMin);
    let closeTime = parseInt(closeHour) * 100 + parseInt(closeMin);
    
    if (openAmPm.toLowerCase() === 'pm' && parseInt(openHour) !== 12) {
      openTime += 1200;
    }
    if (closeAmPm.toLowerCase() === 'pm' && parseInt(closeHour) !== 12) {
      closeTime += 1200;
    }
    if (openAmPm.toLowerCase() === 'am' && parseInt(openHour) === 12) {
      openTime -= 1200;
    }
    if (closeAmPm.toLowerCase() === 'am' && parseInt(closeHour) === 12) {
      closeTime -= 1200;
    }

    return currentTime >= openTime && currentTime <= closeTime;
  }
}

export default LocationService;