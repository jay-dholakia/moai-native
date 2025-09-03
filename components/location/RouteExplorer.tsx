import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { 
  useRouteSearch, 
  useCurrentLocation, 
  useLocationPermissions,
  useSocialCheckIn 
} from '@/hooks/use-location-services';
import { WorkoutRoute, RouteSearchFilters } from '@/services/location-service';
import LocationService from '@/services/location-service';

interface RouteExplorerProps {
  onRoutePress?: (route: WorkoutRoute) => void;
  onCreateRoute?: () => void;
}

export const RouteExplorer: React.FC<RouteExplorerProps> = ({
  onRoutePress,
  onCreateRoute,
}) => {
  const { colors } = useTheme();
  const [searchRadius, setSearchRadius] = useState(10);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [distanceRange, setDistanceRange] = useState({ min: 0, max: 50 });
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: locationResponse, isLoading: locationLoading } = useCurrentLocation();
  const requestPermissions = useLocationPermissions();
  const { checkInOnRoute, isCheckingIn } = useSocialCheckIn();

  const currentLocation = locationResponse?.success ? locationResponse.data : null;

  const searchFilters: RouteSearchFilters | undefined = currentLocation ? {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    radius_km: searchRadius,
    activity_type: selectedActivity || undefined,
    difficulty_level: selectedDifficulty.length > 0 ? selectedDifficulty : undefined,
    distance_min: distanceRange.min > 0 ? distanceRange.min : undefined,
    distance_max: distanceRange.max < 50 ? distanceRange.max : undefined,
    featured_only: featuredOnly || undefined,
  } : undefined;

  const { 
    data: routesResponse, 
    isLoading: routesLoading, 
    error: routesError, 
    refetch 
  } = useRouteSearch(searchFilters);

  const routes = routesResponse?.success ? routesResponse.data : [];

  const activityTypes = [
    { id: '', name: 'All Activities', icon: 'fitness' },
    { id: 'running', name: 'Running', icon: 'walk' },
    { id: 'walking', name: 'Walking', icon: 'walk' },
    { id: 'cycling', name: 'Cycling', icon: 'bicycle' },
    { id: 'hiking', name: 'Hiking', icon: 'trail-sign' },
    { id: 'other', name: 'Other', icon: 'ellipse' },
  ];

  const difficultyLevels = [
    { id: 'easy', name: 'Easy', color: '#22c55e', icon: 'chevron-up' },
    { id: 'moderate', name: 'Moderate', color: '#f59e0b', icon: 'chevron-up' },
    { id: 'hard', name: 'Hard', color: '#ef4444', icon: 'chevron-up' },
    { id: 'expert', name: 'Expert', color: '#7c3aed', icon: 'chevron-up' },
  ];

  const handleRequestPermissions = async () => {
    try {
      await requestPermissions.mutateAsync();
    } catch (error) {
      console.error('Failed to request location permissions:', error);
    }
  };

  const handleDifficultyToggle = (difficultyId: string) => {
    setSelectedDifficulty(prev => 
      prev.includes(difficultyId) 
        ? prev.filter(id => id !== difficultyId)
        : [...prev, difficultyId]
    );
  };

  const handleStartRoute = async (route: WorkoutRoute) => {
    try {
      await checkInOnRoute(route.id, route.activity_type, `Started ${route.name}`);
    } catch (error) {
      console.error('Failed to start route:', error);
    }
  };

  const clearFilters = () => {
    setSelectedActivity('');
    setSelectedDifficulty([]);
    setDistanceRange({ min: 0, max: 50 });
    setFeaturedOnly(false);
    setSearchRadius(10);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return km < 1 ? `${meters}m` : `${km.toFixed(1)}km`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    const level = difficultyLevels.find(d => d.id === difficulty);
    return level?.color || colors.mutedForeground;
  };

  const RouteCard: React.FC<{ route: WorkoutRoute }> = ({ route }) => {
    const difficultyColor = getDifficultyColor(route.difficulty_level);

    return (
      <TouchableOpacity
        onPress={() => onRoutePress?.(route)}
        style={tw(spacing.mb(4))}
      >
        <Card style={tw(spacing.p(4))}>
          {/* Route Header */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View style={tw(layout.flex1)}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(1))}>
                <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                  {route.name}
                </Text>
                {route.is_featured && (
                  <View style={[
                    tw(spacing.px(2), spacing.py(1), border.rounded),
                    { backgroundColor: colors.primary + '20' }
                  ]}>
                    <Text style={[tw(text.xs, text.semibold), { color: colors.primary }]}>
                      FEATURED
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                by {route.creator_profile?.first_name} {route.creator_profile?.last_name}
              </Text>
            </View>
          </View>

          {/* Route Stats */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
              {/* Activity Type */}
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons 
                  name={activityTypes.find(a => a.id === route.activity_type)?.icon as any || 'fitness'} 
                  size={16} 
                  color={colors.primary} 
                />
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  {route.activity_type}
                </Text>
              </View>

              {/* Distance */}
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons name="map" size={16} color={colors.mutedForeground} />
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  {formatDistance(route.distance_meters)}
                </Text>
              </View>

              {/* Duration */}
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons name="time" size={16} color={colors.mutedForeground} />
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  {formatDuration(route.estimated_duration_minutes)}
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                {route.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Difficulty and Distance */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              {/* Difficulty */}
              <View style={[
                tw(layout.flexRow, layout.itemsCenter, spacing.gap(1), spacing.px(2), spacing.py(1), border.rounded),
                { backgroundColor: difficultyColor + '20' }
              ]}>
                <View style={[
                  tw(spacing.w(2), spacing.h(2), border.rounded),
                  { backgroundColor: difficultyColor }
                ]} />
                <Text style={[tw(text.xs, text.semibold), { color: difficultyColor }]}>
                  {route.difficulty_level.toUpperCase()}
                </Text>
              </View>

              {/* Elevation */}
              {route.elevation_gain && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                  <Ionicons name="trending-up" size={16} color={colors.mutedForeground} />
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    {route.elevation_gain}m elevation
                  </Text>
                </View>
              )}
            </View>

            {/* Usage Count */}
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {route.usage_count} completed
            </Text>
          </View>

          {/* Description */}
          {route.description && (
            <Text 
              style={[tw(text.sm, spacing.mb(3)), { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {route.description}
            </Text>
          )}

          {/* Tags */}
          {route.tags.length > 0 && (
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(1), spacing.mb(3))}>
              {route.tags.slice(0, 4).map((tag, index) => (
                <View
                  key={index}
                  style={[
                    tw(spacing.px(2), spacing.py(1), border.rounded),
                    { backgroundColor: colors.secondary }
                  ]}
                >
                  <Text style={[tw(text.xs), { color: colors.foreground }]}>
                    {tag}
                  </Text>
                </View>
              ))}
              {route.tags.length > 4 && (
                <View
                  style={[
                    tw(spacing.px(2), spacing.py(1), border.rounded),
                    { backgroundColor: colors.secondary }
                  ]}
                >
                  <Text style={[tw(text.xs), { color: colors.foreground }]}>
                    +{route.tags.length - 4} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={tw(layout.flexRow, spacing.gap(2))}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleStartRoute(route)}
              loading={isCheckingIn}
              style={tw(layout.flex1)}
            >
              Start Route
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onRoutePress?.(route)}
              style={tw(layout.flex1)}
            >
              View Details
            </Button>
          </View>

          {/* Distance from user */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyEnd, spacing.mt(2))}>
            <Ionicons name="location" size={12} color={colors.mutedForeground} />
            <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
              {LocationService.formatDistance((route as any).distance || 0)} away
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (!currentLocation && !locationLoading) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.gap(4))}>
          <Ionicons name="map-outline" size={48} color={colors.mutedForeground} />
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Location Access Required
          </Text>
          <Text style={[tw(text.base, text.center), { color: colors.mutedForeground }]}>
            To find routes near you, we need access to your location.
          </Text>
          <Button
            variant="default"
            onPress={handleRequestPermissions}
            loading={requestPermissions.isPending}
          >
            Enable Location
          </Button>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          Explore Routes
        </Text>
        
        <View style={tw(layout.flexRow, spacing.gap(2))}>
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            style={[
              tw(spacing.p(2), border.rounded),
              { backgroundColor: showFilters ? colors.primary : colors.secondary }
            ]}
          >
            <Ionicons 
              name="options" 
              size={20} 
              color={showFilters ? colors.primaryForeground : colors.foreground} 
            />
          </TouchableOpacity>
          
          {onCreateRoute && (
            <TouchableOpacity 
              onPress={onCreateRoute}
              style={[
                tw(spacing.p(2), border.rounded),
                { backgroundColor: colors.primary }
              ]}
            >
              <Ionicons name="add" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Location Status */}
      {currentLocation && (
        <View style={[
          tw(spacing.mx(4), spacing.mt(4), spacing.p(3), border.rounded),
          { backgroundColor: colors.muted }
        ]}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[tw(text.sm), { color: colors.foreground }]}>
              Searching within {searchRadius}km of your location
            </Text>
          </View>
        </View>
      )}

      {/* Filters */}
      {showFilters && (
        <View style={tw(spacing.p(4))}>
          <Card style={tw(spacing.p(4))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                Filters
              </Text>
              <Button variant="ghost" size="sm" onPress={clearFilters}>
                Clear All
              </Button>
            </View>

            {/* Activity Type */}
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Activity Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  {activityTypes.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      onPress={() => setSelectedActivity(activity.id)}
                      style={[
                        tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                        {
                          backgroundColor: selectedActivity === activity.id 
                            ? colors.primary 
                            : colors.secondary,
                        }
                      ]}
                    >
                      <Ionicons 
                        name={activity.icon as any} 
                        size={16} 
                        color={selectedActivity === activity.id ? colors.primaryForeground : colors.foreground} 
                      />
                      <Text style={[
                        tw(text.sm),
                        { 
                          color: selectedActivity === activity.id 
                            ? colors.primaryForeground 
                            : colors.foreground 
                        }
                      ]}>
                        {activity.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Difficulty Level */}
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Difficulty Level
              </Text>
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                {difficultyLevels.map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty.id}
                    onPress={() => handleDifficultyToggle(difficulty.id)}
                    style={[
                      tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                      {
                        backgroundColor: selectedDifficulty.includes(difficulty.id) 
                          ? difficulty.color + '20'
                          : colors.secondary,
                        borderWidth: 1,
                        borderColor: selectedDifficulty.includes(difficulty.id) 
                          ? difficulty.color 
                          : colors.border,
                      }
                    ]}
                  >
                    <View style={[
                      tw(spacing.w(3), spacing.h(3), border.rounded),
                      { backgroundColor: difficulty.color }
                    ]} />
                    <Text style={[
                      tw(text.sm),
                      { 
                        color: selectedDifficulty.includes(difficulty.id) 
                          ? difficulty.color 
                          : colors.foreground 
                      }
                    ]}>
                      {difficulty.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Search Radius */}
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Search Radius: {searchRadius}km
              </Text>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <TouchableOpacity
                  onPress={() => setSearchRadius(Math.max(1, searchRadius - 5))}
                  style={[
                    tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
                    { backgroundColor: colors.secondary }
                  ]}
                >
                  <Ionicons name="remove" size={20} color={colors.foreground} />
                </TouchableOpacity>
                
                <View style={[
                  tw(spacing.px(6), spacing.py(2), border.rounded),
                  { backgroundColor: colors.muted }
                ]}>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {searchRadius}km
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSearchRadius(Math.min(50, searchRadius + 5))}
                  style={[
                    tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
                    { backgroundColor: colors.secondary }
                  ]}
                >
                  <Ionicons name="add" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Featured Only */}
            <View>
              <TouchableOpacity
                onPress={() => setFeaturedOnly(!featuredOnly)}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(3), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
              >
                <View>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    Featured Routes Only
                  </Text>
                  <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                    Show only featured and popular routes
                  </Text>
                </View>
                <View style={[
                  tw(spacing.w(12), spacing.h(6), border.rounded, layout.justifyEnd),
                  { 
                    backgroundColor: featuredOnly ? colors.primary : colors.border,
                    padding: 2
                  }
                ]}>
                  <View style={[
                    tw(spacing.w(5), spacing.h(5), border.rounded),
                    { 
                      backgroundColor: colors.background,
                      transform: [{ translateX: featuredOnly ? 20 : 0 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      )}

      {/* Routes List */}
      <ScrollView 
        style={tw(layout.flex1)} 
        contentContainerStyle={tw(spacing.p(4))}
        refreshControl={
          <RefreshControl refreshing={routesLoading} onRefresh={refetch} />
        }
      >
        {locationLoading ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Getting your location...
            </Text>
          </View>
        ) : routesLoading ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Finding routes near you...
            </Text>
          </View>
        ) : routesError ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.destructive }]}>
              Failed to load routes
            </Text>
            <Button variant="outline" onPress={() => refetch()} style={tw(spacing.mt(3))}>
              Try Again
            </Button>
          </View>
        ) : routes.length === 0 ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Ionicons name="map-outline" size={48} color={colors.mutedForeground} />
            <Text style={[tw(text.lg, text.semibold, spacing.mt(3)), { color: colors.foreground }]}>
              No Routes Found
            </Text>
            <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              Try adjusting your search radius or filters
            </Text>
            {onCreateRoute && (
              <Button 
                variant="outline" 
                onPress={onCreateRoute} 
                style={tw(spacing.mt(3))}
              >
                Create Your First Route
              </Button>
            )}
          </View>
        ) : (
          <>
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Found {routes.length} routes near you
              </Text>
            </View>
            
            {routes.map((route: WorkoutRoute) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </>
        )}
      </ScrollView>
    </MobileLayout>
  );
};