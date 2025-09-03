import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { 
  useLocationCheckIn, 
  useCurrentLocation, 
  useNearbyCheckIns,
  useGymSearch,
  useRouteSearch 
} from '@/hooks/use-location-services';
import { LocationCheckIn as LocationCheckInType, GymLocation, WorkoutRoute } from '@/services/location-service';
import LocationService from '@/services/location-service';

interface LocationCheckInProps {
  onCheckInComplete?: (checkIn: LocationCheckInType) => void;
  onCancel?: () => void;
}

export const LocationCheckIn: React.FC<LocationCheckInProps> = ({
  onCheckInComplete,
  onCancel,
}) => {
  const { colors } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedLocationType, setSelectedLocationType] = useState<LocationCheckInType['location_type']>('gym');
  const [selectedLocation, setSelectedLocation] = useState<GymLocation | WorkoutRoute | null>(null);
  const [activityType, setActivityType] = useState('');
  const [notes, setNotes] = useState('');
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<LocationCheckInType['privacy_level']>('public');
  const [address, setAddress] = useState('');

  const { data: locationResponse } = useCurrentLocation();
  const checkIn = useLocationCheckIn();
  
  const currentLocation = locationResponse?.success ? locationResponse.data : null;

  // Get nearby locations based on type
  const { data: gymsResponse } = useGymSearch(
    currentLocation && selectedLocationType === 'gym' ? {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      radius_km: 5,
    } : undefined
  );

  const { data: routesResponse } = useRouteSearch(
    currentLocation && selectedLocationType === 'route' ? {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      radius_km: 10,
    } : undefined
  );

  const { data: nearbyCheckInsResponse } = useNearbyCheckIns(
    currentLocation?.latitude || 0,
    currentLocation?.longitude || 0,
    5
  );

  const nearbyGyms = gymsResponse?.success ? gymsResponse.data : [];
  const nearbyRoutes = routesResponse?.success ? routesResponse.data : [];
  const nearbyCheckIns = nearbyCheckInsResponse?.success ? nearbyCheckInsResponse.data : [];

  const locationTypes = [
    { 
      id: 'gym' as const, 
      name: 'Gym', 
      icon: 'fitness', 
      description: 'Check in at a gym or fitness center',
      locations: nearbyGyms
    },
    { 
      id: 'route' as const, 
      name: 'Route', 
      icon: 'map', 
      description: 'Check in on a workout route',
      locations: nearbyRoutes
    },
    { 
      id: 'outdoor' as const, 
      name: 'Outdoor', 
      icon: 'leaf', 
      description: 'Outdoor workout location',
      locations: []
    },
    { 
      id: 'home' as const, 
      name: 'Home', 
      icon: 'home', 
      description: 'Home workout',
      locations: []
    },
    { 
      id: 'other' as const, 
      name: 'Other', 
      icon: 'location', 
      description: 'Custom location',
      locations: []
    },
  ];

  const activityTypes = [
    { id: 'gym_workout', name: 'Gym Workout', icon: 'fitness' },
    { id: 'cardio', name: 'Cardio', icon: 'heart' },
    { id: 'strength_training', name: 'Strength Training', icon: 'barbell' },
    { id: 'running', name: 'Running', icon: 'walk' },
    { id: 'cycling', name: 'Cycling', icon: 'bicycle' },
    { id: 'swimming', name: 'Swimming', icon: 'water' },
    { id: 'yoga', name: 'Yoga', icon: 'body' },
    { id: 'pilates', name: 'Pilates', icon: 'body' },
    { id: 'crossfit', name: 'CrossFit', icon: 'fitness' },
    { id: 'martial_arts', name: 'Martial Arts', icon: 'hand-left' },
    { id: 'dance', name: 'Dance', icon: 'musical-notes' },
    { id: 'sports', name: 'Sports', icon: 'football' },
    { id: 'hiking', name: 'Hiking', icon: 'trail-sign' },
    { id: 'other', name: 'Other', icon: 'ellipse' },
  ];

  const privacyOptions = [
    { 
      id: 'public' as const, 
      name: 'Public', 
      icon: 'globe', 
      description: 'Visible to everyone in the community' 
    },
    { 
      id: 'friends' as const, 
      name: 'Friends', 
      icon: 'people', 
      description: 'Visible to your friends only' 
    },
    { 
      id: 'private' as const, 
      name: 'Private', 
      icon: 'lock-closed', 
      description: 'Only visible to you' 
    },
  ];

  // Get current address when location changes
  useEffect(() => {
    if (currentLocation && (selectedLocationType === 'outdoor' || selectedLocationType === 'other')) {
      LocationService.reverseGeocode(currentLocation.latitude, currentLocation.longitude)
        .then(result => {
          if (result.success) {
            setAddress(result.data);
          }
        });
    }
  }, [currentLocation, selectedLocationType]);

  const steps = [
    { id: 'location', title: 'Location Type', icon: 'location' },
    { id: 'details', title: 'Activity Details', icon: 'information-circle' },
    { id: 'privacy', title: 'Privacy Settings', icon: 'settings' },
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return selectedLocationType && (
          selectedLocationType === 'home' ||
          selectedLocationType === 'outdoor' ||
          selectedLocationType === 'other' ||
          selectedLocation
        );
      case 1:
        return activityType.trim().length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleCheckIn = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your current location');
      return;
    }

    try {
      const checkInData = {
        location_type: selectedLocationType,
        location_id: selectedLocation?.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: address || undefined,
        activity_type: activityType,
        notes: notes || undefined,
        workout_completed: workoutCompleted,
        privacy_level: privacyLevel,
      };

      const result = await checkIn.mutateAsync(checkInData);
      
      if (result.success) {
        Alert.alert('Success', 'Checked in successfully!');
        onCheckInComplete?.(result.data);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    }
  };

  const renderLocationStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        {/* Location Types */}
        <View>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Where are you working out?
          </Text>
          <View style={tw(spacing.gap(3))}>
            {locationTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => {
                  setSelectedLocationType(type.id);
                  setSelectedLocation(null);
                }}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.p(4), border.rounded),
                  {
                    backgroundColor: selectedLocationType === type.id ? colors.primary + '20' : colors.muted,
                    borderWidth: 1,
                    borderColor: selectedLocationType === type.id ? colors.primary : colors.border,
                  }
                ]}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={24} 
                  color={selectedLocationType === type.id ? colors.primary : colors.foreground} 
                />
                <View style={tw(layout.flex1, spacing.ml(3))}>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {type.name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {type.description}
                  </Text>
                </View>
                {selectedLocationType === type.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Specific Location Selection */}
        {(selectedLocationType === 'gym' || selectedLocationType === 'route') && (
          <View>
            <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
              Select {selectedLocationType === 'gym' ? 'Gym' : 'Route'}
            </Text>
            
            {selectedLocationType === 'gym' && nearbyGyms.length > 0 && (
              <View style={tw(spacing.gap(2))}>
                {nearbyGyms.slice(0, 5).map((gym: GymLocation) => (
                  <TouchableOpacity
                    key={gym.id}
                    onPress={() => setSelectedLocation(gym)}
                    style={[
                      tw(layout.flexRow, layout.itemsCenter, spacing.p(3), border.rounded),
                      {
                        backgroundColor: selectedLocation?.id === gym.id ? colors.primary + '20' : colors.secondary,
                        borderWidth: 1,
                        borderColor: selectedLocation?.id === gym.id ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <View style={tw(layout.flex1)}>
                      <Text style={[tw(text.base), { color: colors.foreground }]}>
                        {gym.name}
                      </Text>
                      <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                        {LocationService.formatDistance((gym as any).distance || 0)} away
                      </Text>
                    </View>
                    {selectedLocation?.id === gym.id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedLocationType === 'route' && nearbyRoutes.length > 0 && (
              <View style={tw(spacing.gap(2))}>
                {nearbyRoutes.slice(0, 5).map((route: WorkoutRoute) => (
                  <TouchableOpacity
                    key={route.id}
                    onPress={() => setSelectedLocation(route)}
                    style={[
                      tw(layout.flexRow, layout.itemsCenter, spacing.p(3), border.rounded),
                      {
                        backgroundColor: selectedLocation?.id === route.id ? colors.primary + '20' : colors.secondary,
                        borderWidth: 1,
                        borderColor: selectedLocation?.id === route.id ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <View style={tw(layout.flex1)}>
                      <Text style={[tw(text.base), { color: colors.foreground }]}>
                        {route.name}
                      </Text>
                      <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                        {route.activity_type} • {LocationService.formatDistance((route as any).distance || 0)} away
                      </Text>
                    </View>
                    {selectedLocation?.id === route.id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {((selectedLocationType === 'gym' && nearbyGyms.length === 0) ||
              (selectedLocationType === 'route' && nearbyRoutes.length === 0)) && (
              <View style={tw(layout.itemsCenter, spacing.py(6))}>
                <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                  No {selectedLocationType === 'gym' ? 'gyms' : 'routes'} found nearby
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Current Address for outdoor/other */}
        {(selectedLocationType === 'outdoor' || selectedLocationType === 'other') && address && (
          <View style={[
            tw(spacing.p(3), border.rounded),
            { backgroundColor: colors.muted }
          ]}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                Current Location:
              </Text>
            </View>
            <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
              {address}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderDetailsStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        {/* Activity Type */}
        <View>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            What's your activity?
          </Text>
          <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
            {activityTypes.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                onPress={() => setActivityType(activity.id)}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                  {
                    backgroundColor: activityType === activity.id ? colors.primary : colors.secondary,
                  }
                ]}
              >
                <Ionicons 
                  name={activity.icon as any} 
                  size={16} 
                  color={activityType === activity.id ? colors.primaryForeground : colors.foreground} 
                />
                <Text style={[
                  tw(text.sm),
                  { 
                    color: activityType === activity.id ? colors.primaryForeground : colors.foreground 
                  }
                ]}>
                  {activity.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View>
          <Text style={[tw(text.base, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Add a note (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="How was your workout? Share your experience..."
            multiline
            numberOfLines={3}
            style={[
              tw(border.border, border.rounded, spacing.p(3)),
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.foreground,
                textAlignVertical: 'top',
                minHeight: 80,
              }
            ]}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Workout Completed */}
        <View>
          <TouchableOpacity
            onPress={() => setWorkoutCompleted(!workoutCompleted)}
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
              { backgroundColor: colors.muted }
            ]}
          >
            <View>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                Workout Completed
              </Text>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Mark if you've finished your workout session
              </Text>
            </View>
            <View style={[
              tw(spacing.w(12), spacing.h(6), border.rounded, layout.justifyEnd),
              { 
                backgroundColor: workoutCompleted ? colors.primary : colors.border,
                padding: 2
              }
            ]}>
              <View style={[
                tw(spacing.w(5), spacing.h(5), border.rounded),
                { 
                  backgroundColor: colors.background,
                  transform: [{ translateX: workoutCompleted ? 20 : 0 }]
                }
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderPrivacyStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        {/* Privacy Settings */}
        <View>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Who can see your check-in?
          </Text>
          <View style={tw(spacing.gap(3))}>
            {privacyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setPrivacyLevel(option.id)}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.p(4), border.rounded),
                  {
                    backgroundColor: privacyLevel === option.id ? colors.primary + '20' : colors.muted,
                    borderWidth: 1,
                    borderColor: privacyLevel === option.id ? colors.primary : colors.border,
                  }
                ]}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={privacyLevel === option.id ? colors.primary : colors.foreground} 
                />
                <View style={tw(layout.flex1, spacing.ml(3))}>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {option.name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {option.description}
                  </Text>
                </View>
                {privacyLevel === option.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Check-ins */}
        {nearbyCheckIns.length > 0 && (
          <View>
            <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
              Recent Activity Nearby
            </Text>
            <View style={tw(spacing.gap(2))}>
              {nearbyCheckIns.slice(0, 3).map((checkInItem) => (
                <View
                  key={checkInItem.id}
                  style={[
                    tw(layout.flexRow, layout.itemsCenter, spacing.p(3), border.rounded),
                    { backgroundColor: colors.secondary }
                  ]}
                >
                  <Avatar
                    size="sm"
                    source={(checkInItem.user_profile as any)?.avatar_url ? { uri: (checkInItem.user_profile as any).avatar_url } : undefined}
                    fallback={`${checkInItem.user_profile?.first_name?.[0]}${checkInItem.user_profile?.last_name?.[0]}`}
                  />
                  <View style={tw(layout.flex1, spacing.ml(3))}>
                    <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                      {checkInItem.user_profile?.first_name} {checkInItem.user_profile?.last_name}
                    </Text>
                    <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                      {checkInItem.activity_type} • {new Date(checkInItem.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderLocationStep();
      case 1:
        return renderDetailsStep();
      case 2:
        return renderPrivacyStep();
      default:
        return null;
    }
  };

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          Check In
        </Text>
        
        {onCancel && (
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Steps */}
      <View style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.justifyBetween)}>
          {steps.map((step, index) => (
            <View key={step.id} style={tw(layout.itemsCenter, layout.flex1)}>
              <View style={[
                tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded, spacing.mb(2)),
                {
                  backgroundColor: index <= activeStep ? colors.primary : colors.muted,
                }
              ]}>
                <Ionicons 
                  name={step.icon as any} 
                  size={20} 
                  color={index <= activeStep ? colors.primaryForeground : colors.mutedForeground} 
                />
              </View>
              <Text style={[
                tw(text.xs, text.center),
                { color: index <= activeStep ? colors.foreground : colors.mutedForeground }
              ]}>
                {step.title}
              </Text>
              
              {index < steps.length - 1 && (
                <View style={[
                  tw(layout.absolute, spacing.h(1)),
                  {
                    backgroundColor: index < activeStep ? colors.primary : colors.border,
                    width: '100%',
                    top: 20,
                    left: '50%',
                  }
                ]} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Step Content */}
      <View style={tw(layout.flex1, spacing.px(4))}>
        {renderStepContent()}
      </View>

      {/* Navigation Buttons */}
      <View style={[
        tw(layout.flexRow, spacing.gap(3), spacing.p(4), border.borderT),
        { borderTopColor: colors.border }
      ]}>
        {activeStep > 0 && (
          <Button
            variant="outline"
            onPress={handleBack}
            style={tw(layout.flex1)}
          >
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant="default"
            onPress={handleNext}
            disabled={!isStepValid()}
            style={tw(layout.flex1)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="gradient"
            onPress={handleCheckIn}
            loading={checkIn.isPending}
            disabled={!isStepValid()}
            style={tw(layout.flex1)}
          >
            Check In
          </Button>
        )}
      </View>
    </MobileLayout>
  );
};