import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import LocationService, { 
  GymLocation, 
  WorkoutRoute, 
  LocationCheckIn, 
  UserLocation,
  LocationSearchFilters,
  RouteSearchFilters
} from '@/services/location-service';
import { ServiceResponse } from '@/services/types';

// Query keys
export const locationKeys = {
  all: ['location'] as const,
  currentLocation: () => [...locationKeys.all, 'current'] as const,
  gyms: (filters?: LocationSearchFilters) => [...locationKeys.all, 'gyms', filters] as const,
  gymDetails: (gymId: string) => [...locationKeys.all, 'gym', gymId] as const,
  routes: (filters?: RouteSearchFilters) => [...locationKeys.all, 'routes', filters] as const,
  routeDetails: (routeId: string) => [...locationKeys.all, 'route', routeId] as const,
  nearbyCheckIns: (lat: number, lng: number, radius?: number) => [...locationKeys.all, 'checkins', lat, lng, radius] as const,
  nearbyMoais: (lat: number, lng: number, radius?: number) => [...locationKeys.all, 'moais', lat, lng, radius] as const,
};

// Location Hooks

/**
 * Hook to get current user location
 */
export function useCurrentLocation() {
  return useQuery({
    queryKey: locationKeys.currentLocation(),
    queryFn: LocationService.getCurrentLocation,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to request location permissions
 */
export function useLocationPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: LocationService.requestLocationPermissions,
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate current location to trigger refetch
        queryClient.invalidateQueries({ queryKey: locationKeys.currentLocation() });
      }
    },
  });
}

// Gym Hooks

/**
 * Hook to search for gyms near a location
 */
export function useGymSearch(filters?: LocationSearchFilters) {
  return useQuery({
    queryKey: locationKeys.gyms(filters),
    queryFn: () => filters ? LocationService.searchGyms(filters) : Promise.resolve({ success: false, error: 'No location provided' } as ServiceResponse<GymLocation[]>),
    enabled: !!filters && !!filters.latitude && !!filters.longitude,
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
  });
}

/**
 * Hook to get gym details
 */
export function useGymDetails(gymId: string) {
  return useQuery({
    queryKey: locationKeys.gymDetails(gymId),
    queryFn: () => LocationService.getGymDetails(gymId),
    enabled: !!gymId,
    staleTime: 3600000, // 1 hour
    gcTime: 7200000, // 2 hours
  });
}

// Route Hooks

/**
 * Hook to search for workout routes near a location
 */
export function useRouteSearch(filters?: RouteSearchFilters) {
  return useQuery({
    queryKey: locationKeys.routes(filters),
    queryFn: () => filters ? LocationService.searchRoutes(filters) : Promise.resolve({ success: false, error: 'No location provided' } as ServiceResponse<WorkoutRoute[]>),
    enabled: !!filters && !!filters.latitude && !!filters.longitude,
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
  });
}

/**
 * Hook to get route details
 */
export function useRouteDetails(routeId: string) {
  return useQuery({
    queryKey: locationKeys.routeDetails(routeId),
    queryFn: () => LocationService.getRouteDetails(routeId),
    enabled: !!routeId,
    staleTime: 3600000, // 1 hour
    gcTime: 7200000, // 2 hours
  });
}

/**
 * Hook to create a new workout route
 */
export function useCreateRoute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (routeData: Parameters<typeof LocationService.createRoute>[1]) => {
      if (!user) throw new Error('No user authenticated');
      return LocationService.createRoute(user.id, routeData);
    },
    onSuccess: () => {
      // Invalidate route searches to show new route
      queryClient.invalidateQueries({ queryKey: locationKeys.routes() });
    },
  });
}

// Check-in Hooks

/**
 * Hook to check in at a location
 */
export function useLocationCheckIn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (checkInData: Parameters<typeof LocationService.checkIn>[1]) => {
      if (!user) throw new Error('No user authenticated');
      return LocationService.checkIn(user.id, checkInData);
    },
    onSuccess: (data, variables) => {
      // Invalidate nearby check-ins
      queryClient.invalidateQueries({ 
        queryKey: locationKeys.nearbyCheckIns(variables.latitude, variables.longitude) 
      });
    },
  });
}

/**
 * Hook to get nearby check-ins
 */
export function useNearbyCheckIns(latitude: number, longitude: number, radiusKm?: number) {
  return useQuery({
    queryKey: locationKeys.nearbyCheckIns(latitude, longitude, radiusKm),
    queryFn: () => LocationService.getNearbyCheckIns(latitude, longitude, radiusKm),
    enabled: !!latitude && !!longitude,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

// MOAI Discovery Hooks

/**
 * Hook to find nearby MOAIs
 */
export function useNearbyMoais(latitude: number, longitude: number, radiusKm?: number) {
  return useQuery({
    queryKey: locationKeys.nearbyMoais(latitude, longitude, radiusKm),
    queryFn: () => LocationService.findNearbyMoais(latitude, longitude, radiusKm),
    enabled: !!latitude && !!longitude,
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
  });
}

/**
 * Hook to update user location for discovery
 */
export function useUpdateUserLocation() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { location: UserLocation; shareLocation: boolean }) => {
      if (!user) throw new Error('No user authenticated');
      return LocationService.updateUserLocation(user.id, params.location, params.shareLocation);
    },
  });
}

// Combined Hooks

/**
 * Hook for location-based discovery (gyms, routes, MOAIs)
 */
export function useLocationDiscovery(location?: UserLocation, radiusKm?: number) {
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  const gymFilters: LocationSearchFilters | undefined = latitude && longitude ? {
    latitude,
    longitude,
    radius_km: radiusKm || 10,
  } : undefined;

  const routeFilters: RouteSearchFilters | undefined = latitude && longitude ? {
    latitude,
    longitude,
    radius_km: radiusKm || 10,
  } : undefined;

  const { data: gymsResponse, isLoading: gymsLoading } = useGymSearch(gymFilters);
  const { data: routesResponse, isLoading: routesLoading } = useRouteSearch(routeFilters);
  const { data: moaisResponse, isLoading: moaisLoading } = useNearbyMoais(
    latitude || 0, 
    longitude || 0, 
    radiusKm || 25
  );
  const { data: checkInsResponse, isLoading: checkInsLoading } = useNearbyCheckIns(
    latitude || 0, 
    longitude || 0, 
    radiusKm || 5
  );

  const gyms = gymsResponse?.success ? gymsResponse.data : [];
  const routes = routesResponse?.success ? routesResponse.data : [];
  const moais = moaisResponse?.success ? moaisResponse.data : [];
  const checkIns = checkInsResponse?.success ? checkInsResponse.data : [];

  return {
    gyms,
    routes,
    moais,
    checkIns,
    isLoading: gymsLoading || routesLoading || moaisLoading || checkInsLoading,
    hasLocation: !!latitude && !!longitude,
  };
}

/**
 * Hook for gym finder with enhanced features
 */
export function useGymFinder() {
  const { data: currentLocationResponse } = useCurrentLocation();
  const currentLocation = currentLocationResponse?.success ? currentLocationResponse.data : null;

  const searchGyms = (filters: Partial<LocationSearchFilters>) => {
    if (!currentLocation) return { success: false, error: 'Location not available' };
    
    const searchFilters: LocationSearchFilters = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      radius_km: 10,
      ...filters,
    };

    return LocationService.searchGyms(searchFilters);
  };

  const getGymsByAmenity = (amenities: string[]) => {
    return searchGyms({ amenities });
  };

  const getGymsByPriceRange = (priceRange: string[]) => {
    return searchGyms({ price_range: priceRange });
  };

  const getNearbyGyms = (radiusKm?: number) => {
    return searchGyms({ radius_km: radiusKm });
  };

  return {
    currentLocation,
    searchGyms,
    getGymsByAmenity,
    getGymsByPriceRange,
    getNearbyGyms,
    hasLocation: !!currentLocation,
  };
}

/**
 * Hook for route planning and discovery
 */
export function useRoutePlanner() {
  const { data: currentLocationResponse } = useCurrentLocation();
  const currentLocation = currentLocationResponse?.success ? currentLocationResponse.data : null;

  const searchRoutes = (filters: Partial<RouteSearchFilters>) => {
    if (!currentLocation) return { success: false, error: 'Location not available' };
    
    const searchFilters: RouteSearchFilters = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      radius_km: 10,
      ...filters,
    };

    return LocationService.searchRoutes(searchFilters);
  };

  const getRoutesByActivity = (activityType: string) => {
    return searchRoutes({ activity_type: activityType });
  };

  const getRoutesByDifficulty = (difficultyLevels: string[]) => {
    return searchRoutes({ difficulty_level: difficultyLevels });
  };

  const getRoutesByDistance = (minKm?: number, maxKm?: number) => {
    return searchRoutes({ 
      distance_min: minKm, 
      distance_max: maxKm 
    });
  };

  const getFeaturedRoutes = () => {
    return searchRoutes({ featured_only: true });
  };

  return {
    currentLocation,
    searchRoutes,
    getRoutesByActivity,
    getRoutesByDifficulty,
    getRoutesByDistance,
    getFeaturedRoutes,
    hasLocation: !!currentLocation,
  };
}

/**
 * Hook for social check-ins and activity sharing
 */
export function useSocialCheckIn() {
  const checkIn = useLocationCheckIn();
  const { data: currentLocationResponse } = useCurrentLocation();
  const currentLocation = currentLocationResponse?.success ? currentLocationResponse.data : null;

  const quickCheckIn = async (params: {
    locationType: LocationCheckIn['location_type'];
    locationId?: string;
    activityType?: string;
    notes?: string;
    privacyLevel?: LocationCheckIn['privacy_level'];
  }) => {
    if (!currentLocation) {
      throw new Error('Location not available for check-in');
    }

    const checkInData = {
      location_type: params.locationType,
      location_id: params.locationId,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      activity_type: params.activityType,
      notes: params.notes,
      workout_completed: false,
      privacy_level: params.privacyLevel || 'public' as const,
    };

    return checkIn.mutateAsync(checkInData);
  };

  const checkInAtGym = async (gymId: string, notes?: string) => {
    return quickCheckIn({
      locationType: 'gym',
      locationId: gymId,
      activityType: 'gym_workout',
      notes,
    });
  };

  const checkInOnRoute = async (routeId: string, activityType: string, notes?: string) => {
    return quickCheckIn({
      locationType: 'route',
      locationId: routeId,
      activityType,
      notes,
    });
  };

  const checkInAtHome = async (activityType: string, notes?: string) => {
    return quickCheckIn({
      locationType: 'home',
      activityType,
      notes,
      privacyLevel: 'private',
    });
  };

  return {
    checkIn: checkIn.mutateAsync,
    quickCheckIn,
    checkInAtGym,
    checkInOnRoute,
    checkInAtHome,
    isCheckingIn: checkIn.isPending,
    hasLocation: !!currentLocation,
  };
}

/**
 * Hook to manage user location sharing preferences
 */
export function useLocationSharing() {
  const updateLocation = useUpdateUserLocation();
  const { data: currentLocationResponse } = useCurrentLocation();

  const enableLocationSharing = async () => {
    const locationResult = await LocationService.getCurrentLocation();
    if (locationResult.success) {
      return updateLocation.mutateAsync({
        location: locationResult.data,
        shareLocation: true,
      });
    }
    throw new Error('Could not get current location');
  };

  const disableLocationSharing = async () => {
    const locationResult = await LocationService.getCurrentLocation();
    if (locationResult.success) {
      return updateLocation.mutateAsync({
        location: locationResult.data,
        shareLocation: false,
      });
    }
    throw new Error('Could not get current location');
  };

  return {
    enableLocationSharing,
    disableLocationSharing,
    isUpdating: updateLocation.isPending,
    hasLocation: !!currentLocationResponse?.success,
  };
}