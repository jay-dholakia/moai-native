import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGymSearch, 
  useCurrentLocation, 
  useLocationPermissions,
  useSocialCheckIn 
} from '@/hooks/use-location-services';
import { GymLocation, LocationSearchFilters } from '@/services/location-service';
import LocationService from '@/services/location-service';

interface GymFinderProps {
  onGymPress?: (gym: GymLocation) => void;
}

export const GymFinder: React.FC<GymFinderProps> = ({
  onGymPress,
}) => {
  const { colors } = useTheme();
  const [searchRadius, setSearchRadius] = useState(10);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const { data: locationResponse, isLoading: locationLoading } = useCurrentLocation();
  const requestPermissions = useLocationPermissions();
  const { checkInAtGym, isCheckingIn } = useSocialCheckIn();

  const currentLocation = locationResponse?.success ? locationResponse.data : null;

  const searchFilters: LocationSearchFilters | undefined = currentLocation ? {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    radius_km: searchRadius,
    amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    price_range: selectedPriceRange.length > 0 ? selectedPriceRange : undefined,
    rating_min: minRating > 0 ? minRating : undefined,
    verified_only: true,
  } : undefined;

  const { 
    data: gymsResponse, 
    isLoading: gymsLoading, 
    error: gymsError, 
    refetch 
  } = useGymSearch(searchFilters);

  const gyms = gymsResponse?.success ? gymsResponse.data : [];

  const amenityOptions = [
    { id: 'parking', name: 'Parking', icon: 'car' },
    { id: 'showers', name: 'Showers', icon: 'water' },
    { id: 'lockers', name: 'Lockers', icon: 'lock-closed' },
    { id: 'pool', name: 'Pool', icon: 'water' },
    { id: 'sauna', name: 'Sauna', icon: 'thermometer' },
    { id: 'childcare', name: 'Childcare', icon: 'people' },
    { id: 'personal_training', name: 'Personal Training', icon: 'person' },
    { id: 'group_classes', name: 'Group Classes', icon: 'people' },
    { id: 'wifi', name: 'WiFi', icon: 'wifi' },
    { id: '24_hours', name: '24 Hours', icon: 'time' },
  ];

  const priceRangeOptions = [
    { id: '$', name: 'Budget ($)', description: 'Under $30/month' },
    { id: '$$', name: 'Moderate ($$)', description: '$30-60/month' },
    { id: '$$$', name: 'Premium ($$$)', description: '$60-100/month' },
    { id: '$$$$', name: 'Luxury ($$$$)', description: 'Over $100/month' },
  ];

  const handleRequestPermissions = async () => {
    try {
      await requestPermissions.mutateAsync();
    } catch (error) {
      console.error('Failed to request location permissions:', error);
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handlePriceRangeToggle = (priceId: string) => {
    setSelectedPriceRange(prev => 
      prev.includes(priceId) 
        ? prev.filter(id => id !== priceId)
        : [...prev, priceId]
    );
  };

  const handleCheckIn = async (gym: GymLocation) => {
    try {
      await checkInAtGym(gym.id, `Checked in at ${gym.name}`);
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  const clearFilters = () => {
    setSelectedAmenities([]);
    setSelectedPriceRange([]);
    setMinRating(0);
    setSearchRadius(10);
  };

  const GymCard: React.FC<{ gym: GymLocation }> = ({ gym }) => {
    const isOpen = LocationService.isLocationOpen(gym.hours);

    return (
      <TouchableOpacity
        onPress={() => onGymPress?.(gym)}
        style={tw(spacing.mb(4))}
      >
        <Card style={tw(spacing.p(4))}>
          {/* Gym Header */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                {gym.name}
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {gym.address}
              </Text>
            </View>
            <View style={tw(layout.itemsEnd)}>
              <View style={[
                tw(spacing.px(2), spacing.py(1), border.rounded),
                { backgroundColor: isOpen ? '#22c55e20' : '#ef444420' }
              ]}>
                <Text style={[
                  tw(text.xs, text.semibold),
                  { color: isOpen ? '#22c55e' : '#ef4444' }
                ]}>
                  {isOpen ? 'OPEN' : 'CLOSED'}
                </Text>
              </View>
            </View>
          </View>

          {/* Gym Details */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
              {/* Rating */}
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  {gym.rating.toFixed(1)}
                </Text>
              </View>

              {/* Price Range */}
              <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                {gym.price_range}
              </Text>

              {/* Distance */}
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {LocationService.formatDistance((gym as any).distance || 0)}
              </Text>
            </View>

            {gym.verified && (
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[tw(text.xs), { color: colors.primary }]}>
                  Verified
                </Text>
              </View>
            )}
          </View>

          {/* Amenities */}
          {gym.amenities.length > 0 && (
            <View style={tw(spacing.mb(3))}>
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(1))}>
                {gym.amenities.slice(0, 6).map((amenity, index) => (
                  <View
                    key={index}
                    style={[
                      tw(spacing.px(2), spacing.py(1), border.rounded),
                      { backgroundColor: colors.secondary }
                    ]}
                  >
                    <Text style={[tw(text.xs), { color: colors.foreground }]}>
                      {amenity}
                    </Text>
                  </View>
                ))}
                {gym.amenities.length > 6 && (
                  <View
                    style={[
                      tw(spacing.px(2), spacing.py(1), border.rounded),
                      { backgroundColor: colors.secondary }
                    ]}
                  >
                    <Text style={[tw(text.xs), { color: colors.foreground }]}>
                      +{gym.amenities.length - 6} more
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={tw(layout.flexRow, spacing.gap(2))}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleCheckIn(gym)}
              loading={isCheckingIn}
              style={tw(layout.flex1)}
            >
              Check In
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onGymPress?.(gym)}
              style={tw(layout.flex1)}
            >
              View Details
            </Button>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (!currentLocation && !locationLoading) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.gap(4))}>
          <Ionicons name="location-outline" size={48} color={colors.mutedForeground} />
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Location Access Required
          </Text>
          <Text style={[tw(text.base, text.center), { color: colors.mutedForeground }]}>
            To find gyms near you, we need access to your location.
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
          Find Gyms
        </Text>
        
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

            {/* Price Range */}
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Price Range
              </Text>
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                {priceRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handlePriceRangeToggle(option.id)}
                    style={[
                      tw(spacing.px(3), spacing.py(2), border.rounded),
                      {
                        backgroundColor: selectedPriceRange.includes(option.id) 
                          ? colors.primary 
                          : colors.secondary,
                      }
                    ]}
                  >
                    <Text style={[
                      tw(text.sm),
                      { 
                        color: selectedPriceRange.includes(option.id) 
                          ? colors.primaryForeground 
                          : colors.foreground 
                      }
                    ]}>
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amenities */}
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Amenities
              </Text>
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                {amenityOptions.map((amenity) => (
                  <TouchableOpacity
                    key={amenity.id}
                    onPress={() => handleAmenityToggle(amenity.id)}
                    style={[
                      tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                      {
                        backgroundColor: selectedAmenities.includes(amenity.id) 
                          ? colors.primary 
                          : colors.secondary,
                      }
                    ]}
                  >
                    <Ionicons 
                      name={amenity.icon as any} 
                      size={16} 
                      color={selectedAmenities.includes(amenity.id) ? colors.primaryForeground : colors.foreground} 
                    />
                    <Text style={[
                      tw(text.sm),
                      { 
                        color: selectedAmenities.includes(amenity.id) 
                          ? colors.primaryForeground 
                          : colors.foreground 
                      }
                    ]}>
                      {amenity.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minimum Rating */}
            <View>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Minimum Rating
              </Text>
              <View style={tw(layout.flexRow, spacing.gap(2))}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setMinRating(rating)}
                    style={[
                      tw(layout.flexRow, layout.itemsCenter, spacing.gap(1), spacing.px(3), spacing.py(2), border.rounded),
                      {
                        backgroundColor: minRating === rating ? colors.primary : colors.secondary,
                      }
                    ]}
                  >
                    <Ionicons 
                      name="star" 
                      size={16} 
                      color={minRating === rating ? colors.primaryForeground : "#fbbf24"} 
                    />
                    <Text style={[
                      tw(text.sm),
                      { 
                        color: minRating === rating ? colors.primaryForeground : colors.foreground 
                      }
                    ]}>
                      {rating === 0 ? 'All' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Gyms List */}
      <ScrollView 
        style={tw(layout.flex1)} 
        contentContainerStyle={tw(spacing.p(4))}
        refreshControl={
          <RefreshControl refreshing={gymsLoading} onRefresh={refetch} />
        }
      >
        {locationLoading ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Getting your location...
            </Text>
          </View>
        ) : gymsLoading ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Finding gyms near you...
            </Text>
          </View>
        ) : gymsError ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.destructive }]}>
              Failed to load gyms
            </Text>
            <Button variant="outline" onPress={() => refetch()} style={tw(spacing.mt(3))}>
              Try Again
            </Button>
          </View>
        ) : gyms.length === 0 ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Ionicons name="fitness-outline" size={48} color={colors.mutedForeground} />
            <Text style={[tw(text.lg, text.semibold, spacing.mt(3)), { color: colors.foreground }]}>
              No Gyms Found
            </Text>
            <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              Try adjusting your search radius or filters
            </Text>
          </View>
        ) : (
          <>
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Found {gyms.length} gyms near you
              </Text>
            </View>
            
            {gyms.map((gym: GymLocation) => (
              <GymCard key={gym.id} gym={gym} />
            ))}
          </>
        )}
      </ScrollView>
    </MobileLayout>
  );
};