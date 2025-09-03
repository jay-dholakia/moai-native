import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { usePublicEvents, useRegisterForEvent, useParticipationStatus } from '@/hooks/use-events-challenges';
import { Event } from '@/services/event-service';

interface EventDiscoveryProps {
  onEventPress?: (event: Event) => void;
}

export const EventDiscovery: React.FC<EventDiscoveryProps> = ({
  onEventPress,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    eventType: '',
    locationType: '',
    featured: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { 
    data: eventsResponse, 
    isLoading, 
    error, 
    refetch 
  } = usePublicEvents({
    searchQuery: searchQuery || undefined,
    ...selectedFilters,
  });

  const registerForEvent = useRegisterForEvent();
  const events = eventsResponse?.success ? eventsResponse.data : [];

  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'fitness', name: 'Fitness' },
    { id: 'nutrition', name: 'Nutrition' },
    { id: 'wellness', name: 'Wellness' },
    { id: 'community', name: 'Community' },
    { id: 'competition', name: 'Competition' },
  ];

  const eventTypes = [
    { id: '', name: 'All Types' },
    { id: 'workout_session', name: 'Workout Session' },
    { id: 'challenge', name: 'Challenge' },
    { id: 'competition', name: 'Competition' },
    { id: 'social', name: 'Social Event' },
    { id: 'educational', name: 'Educational' },
  ];

  const locationTypes = [
    { id: '', name: 'All Locations' },
    { id: 'virtual', name: 'Virtual' },
    { id: 'in_person', name: 'In Person' },
    { id: 'hybrid', name: 'Hybrid' },
  ];

  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      category: '',
      eventType: '',
      locationType: '',
      featured: false,
    });
    setSearchQuery('');
  };

  const handleRegister = async (eventId: string) => {
    try {
      await registerForEvent.mutateAsync(eventId);
    } catch (error) {
      console.error('Failed to register for event:', error);
    }
  };

  const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const { isRegisteredForEvent, canRegister } = useParticipationStatus(event.id);

    return (
      <TouchableOpacity
        onPress={() => onEventPress?.(event)}
        style={tw(spacing.mb(4))}
      >
        <Card style={tw(spacing.p(4))}>
          {/* Event Header */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                {event.title}
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                by {event.organizer_profile?.first_name} {event.organizer_profile?.last_name}
              </Text>
            </View>
            {event.is_featured && (
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

          {/* Event Details */}
          <View style={tw(spacing.mb(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(2))}>
              <Ionicons name="calendar" size={16} color={colors.mutedForeground} />
              <Text style={[tw(text.sm, spacing.ml(2)), { color: colors.foreground }]}>
                {new Date(event.start_date).toLocaleDateString()} at{' '}
                {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(2))}>
              <Ionicons 
                name={event.location_type === 'virtual' ? 'videocam' : 'location'} 
                size={16} 
                color={colors.mutedForeground} 
              />
              <Text style={[tw(text.sm, spacing.ml(2)), { color: colors.foreground }]}>
                {event.location_type === 'virtual' ? 'Virtual Event' : 
                 event.location_type === 'in_person' ? 'In Person' : 'Hybrid'}
              </Text>
            </View>

            {event.duration_minutes && (
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(2))}>
                <Ionicons name="time" size={16} color={colors.mutedForeground} />
                <Text style={[tw(text.sm, spacing.ml(2)), { color: colors.foreground }]}>
                  {event.duration_minutes} minutes
                </Text>
              </View>
            )}

            <View style={tw(layout.flexRow, layout.itemsCenter)}>
              <Ionicons name="people" size={16} color={colors.mutedForeground} />
              <Text style={[tw(text.sm, spacing.ml(2)), { color: colors.foreground }]}>
                {event.current_participants} participants
                {event.max_participants && ` / ${event.max_participants} max`}
              </Text>
            </View>
          </View>

          {/* Event Description */}
          <Text 
            style={[tw(text.sm, spacing.mb(3)), { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {event.description}
          </Text>

          {/* Event Tags */}
          {event.tags.length > 0 && (
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2), spacing.mb(3))}>
              {event.tags.slice(0, 3).map((tag, index) => (
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
              {event.tags.length > 3 && (
                <View
                  style={[
                    tw(spacing.px(2), spacing.py(1), border.rounded),
                    { backgroundColor: colors.secondary }
                  ]}
                >
                  <Text style={[tw(text.xs), { color: colors.foreground }]}>
                    +{event.tags.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={tw(layout.flexRow, spacing.gap(2))}>
            {isRegisteredForEvent ? (
              <Button variant="outline" disabled style={tw(layout.flex1)}>
                Registered
              </Button>
            ) : canRegister ? (
              <Button
                variant="default"
                onPress={() => handleRegister(event.id)}
                loading={registerForEvent.isPending}
                style={tw(layout.flex1)}
              >
                Register
              </Button>
            ) : (
              <Button variant="outline" disabled style={tw(layout.flex1)}>
                {event.max_participants && event.current_participants >= event.max_participants 
                  ? 'Full' : 'Register'}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onPress={() => onEventPress?.(event)}
            >
              <Ionicons name="information-circle" size={20} color={colors.foreground} />
            </Button>
          </View>

          {/* Price */}
          {event.price && event.price > 0 && (
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyEnd, spacing.mt(2))}>
              <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                ${event.price}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const FilterSection: React.FC = () => (
    <View style={tw(spacing.mb(4))}>
      <Card style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
          <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
            Filters
          </Text>
          <Button variant="ghost" size="sm" onPress={clearFilters}>
            Clear All
          </Button>
        </View>

        {/* Category Filter */}
        <View style={tw(spacing.mb(3))}>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => handleFilterChange('category', category.id)}
                  style={[
                    tw(spacing.px(3), spacing.py(2), border.rounded),
                    {
                      backgroundColor: selectedFilters.category === category.id 
                        ? colors.primary 
                        : colors.secondary,
                    }
                  ]}
                >
                  <Text style={[
                    tw(text.sm),
                    { 
                      color: selectedFilters.category === category.id 
                        ? colors.primaryForeground 
                        : colors.foreground 
                    }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Event Type Filter */}
        <View style={tw(spacing.mb(3))}>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Event Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleFilterChange('eventType', type.id)}
                  style={[
                    tw(spacing.px(3), spacing.py(2), border.rounded),
                    {
                      backgroundColor: selectedFilters.eventType === type.id 
                        ? colors.primary 
                        : colors.secondary,
                    }
                  ]}
                >
                  <Text style={[
                    tw(text.sm),
                    { 
                      color: selectedFilters.eventType === type.id 
                        ? colors.primaryForeground 
                        : colors.foreground 
                    }
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Location Type Filter */}
        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Location
          </Text>
          <View style={tw(layout.flexRow, spacing.gap(2))}>
            {locationTypes.map((location) => (
              <TouchableOpacity
                key={location.id}
                onPress={() => handleFilterChange('locationType', location.id)}
                style={[
                  tw(spacing.px(3), spacing.py(2), border.rounded, layout.flex1),
                  {
                    backgroundColor: selectedFilters.locationType === location.id 
                      ? colors.primary 
                      : colors.secondary,
                  }
                ]}
              >
                <Text style={[
                  tw(text.sm, text.center),
                  { 
                    color: selectedFilters.locationType === location.id 
                      ? colors.primaryForeground 
                      : colors.foreground 
                  }
                ]}>
                  {location.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>
    </View>
  );

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          Discover Events
        </Text>
        
        <TouchableOpacity 
          onPress={() => setShowFilters(!showFilters)}
          style={[
            tw(spacing.p(2), border.rounded),
            { backgroundColor: showFilters ? colors.primary : colors.secondary }
          ]}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={showFilters ? colors.primaryForeground : colors.foreground} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={tw(spacing.p(4))}>
        <View style={tw(layout.relative)}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events..."
            style={[tw(spacing.mb(0), spacing.pl(10))]}
          />
          <View 
            style={[
              tw(layout.absolute, layout.justifyCenter, layout.itemsCenter),
              { left: 12, top: 0, bottom: 0, width: 20 }
            ]}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color={colors.mutedForeground} 
            />
          </View>
        </View>
      </View>

      <ScrollView 
        style={tw(layout.flex1)} 
        contentContainerStyle={tw(spacing.px(4))}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Filters */}
        {showFilters && <FilterSection />}

        {/* Events List */}
        {isLoading && events.length === 0 ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Loading events...
            </Text>
          </View>
        ) : error ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.destructive }]}>
              Failed to load events
            </Text>
            <Button variant="outline" onPress={() => refetch()} style={tw(spacing.mt(3))}>
              Try Again
            </Button>
          </View>
        ) : events.length === 0 ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
            <Text style={[tw(text.lg, text.semibold, spacing.mt(3)), { color: colors.foreground }]}>
              No Events Found
            </Text>
            <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              {searchQuery || Object.values(selectedFilters).some(f => f) 
                ? 'Try adjusting your search or filters'
                : 'Be the first to create an event!'}
            </Text>
          </View>
        ) : (
          <>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </>
        )}
      </ScrollView>
    </MobileLayout>
  );
};