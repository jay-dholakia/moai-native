import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { useCreateEvent } from '@/hooks/use-events-challenges';
import { Event } from '@/services/event-service';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EventBuilderProps {
  existingEvent?: Event;
  onSave?: (event: Event) => void;
  onCancel?: () => void;
}

export const EventBuilder: React.FC<EventBuilderProps> = ({
  existingEvent,
  onSave,
  onCancel,
}) => {
  const { colors } = useTheme();
  const createEvent = useCreateEvent();
  
  const [activeStep, setActiveStep] = useState(0);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [eventData, setEventData] = useState({
    title: existingEvent?.title || '',
    description: existingEvent?.description || '',
    event_type: existingEvent?.event_type || 'workout_session' as Event['event_type'],
    category: existingEvent?.category || 'fitness' as Event['category'],
    start_date: existingEvent?.start_date ? new Date(existingEvent.start_date) : new Date(),
    end_date: existingEvent?.end_date ? new Date(existingEvent.end_date) : undefined,
    duration_minutes: existingEvent?.duration_minutes || 60,
    location_type: existingEvent?.location_type || 'virtual' as Event['location_type'],
    location_details: existingEvent?.location_details || '',
    max_participants: existingEvent?.max_participants || undefined,
    is_public: existingEvent?.is_public ?? true,
    is_featured: existingEvent?.is_featured ?? false,
    difficulty_level: existingEvent?.difficulty_level || 'intermediate' as Event['difficulty_level'],
    tags: existingEvent?.tags || [],
    meeting_link: existingEvent?.meeting_link || '',
    price: existingEvent?.price || 0,
    requirements: existingEvent?.requirements || [],
  });

  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const steps = [
    { id: 'basics', title: 'Event Info', icon: 'information-circle' },
    { id: 'schedule', title: 'Schedule', icon: 'calendar' },
    { id: 'location', title: 'Location', icon: 'location' },
    { id: 'settings', title: 'Settings', icon: 'settings' },
  ];

  const eventTypes = [
    { id: 'workout_session', name: 'Workout Session', icon: 'fitness' },
    { id: 'challenge', name: 'Challenge', icon: 'trophy' },
    { id: 'competition', name: 'Competition', icon: 'medal' },
    { id: 'social', name: 'Social Event', icon: 'people' },
    { id: 'educational', name: 'Educational', icon: 'school' },
  ];

  const categories = [
    { id: 'fitness', name: 'Fitness', icon: 'fitness' },
    { id: 'nutrition', name: 'Nutrition', icon: 'nutrition' },
    { id: 'wellness', name: 'Wellness', icon: 'heart' },
    { id: 'community', name: 'Community', icon: 'people' },
    { id: 'competition', name: 'Competition', icon: 'trophy' },
  ];

  const locationTypes = [
    { id: 'virtual', name: 'Virtual', icon: 'videocam', description: 'Online event via video call' },
    { id: 'in_person', name: 'In Person', icon: 'location', description: 'Physical location' },
    { id: 'hybrid', name: 'Hybrid', icon: 'globe', description: 'Both virtual and in-person' },
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

  const handleAddTag = () => {
    if (newTag.trim() && !eventData.tags.includes(newTag.trim())) {
      setEventData({
        ...eventData,
        tags: [...eventData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setEventData({
      ...eventData,
      tags: eventData.tags.filter((_, i) => i !== index),
    });
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setEventData({
        ...eventData,
        requirements: [...eventData.requirements, newRequirement.trim()],
      });
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setEventData({
      ...eventData,
      requirements: eventData.requirements.filter((_, i) => i !== index),
    });
  };

  const validateEvent = () => {
    if (!eventData.title.trim()) {
      Alert.alert('Validation Error', 'Event title is required');
      return false;
    }
    if (!eventData.description.trim()) {
      Alert.alert('Validation Error', 'Event description is required');
      return false;
    }
    if (eventData.start_date <= new Date()) {
      Alert.alert('Validation Error', 'Start date must be in the future');
      return false;
    }
    if (eventData.end_date && eventData.end_date <= eventData.start_date) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return false;
    }
    if (eventData.location_type === 'virtual' && !eventData.meeting_link?.trim()) {
      Alert.alert('Validation Error', 'Meeting link is required for virtual events');
      return false;
    }
    if (eventData.location_type === 'in_person' && !eventData.location_details?.trim()) {
      Alert.alert('Validation Error', 'Location details are required for in-person events');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateEvent()) return;

    try {
      const result = await createEvent.mutateAsync({
        ...eventData,
        start_date: eventData.start_date.toISOString(),
        end_date: eventData.end_date?.toISOString(),
      });

      if (result.success) {
        Alert.alert('Success', 'Event created successfully!');
        onSave?.(result.data);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const renderBasicsStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Event Title *
          </Text>
          <Input
            value={eventData.title}
            onChangeText={(text) => setEventData({ ...eventData, title: text })}
            placeholder="e.g., Morning Yoga Session"
            style={tw(spacing.mb(0))}
          />
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Description *
          </Text>
          <TextInput
            value={eventData.description}
            onChangeText={(text) => setEventData({ ...eventData, description: text })}
            placeholder="Describe your event and what participants can expect..."
            multiline
            numberOfLines={4}
            style={[
              tw(border.border, border.rounded, spacing.p(3)),
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.foreground,
                textAlignVertical: 'top',
                minHeight: 100,
              }
            ]}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Event Type *
          </Text>
          <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}> 
            {eventTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setEventData({ ...eventData, event_type: type.id as Event['event_type'] })}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                  {
                    backgroundColor: eventData.event_type === type.id ? colors.primary : colors.secondary,
                    minWidth: '48%',
                  }
                ]}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={16} 
                  color={eventData.event_type === type.id ? colors.primaryForeground : colors.foreground} 
                />
                <Text style={[
                  tw(text.sm),
                  { color: eventData.event_type === type.id ? colors.primaryForeground : colors.foreground }
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Category *
          </Text>
          <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setEventData({ ...eventData, category: category.id as Event['category'] })}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                  {
                    backgroundColor: eventData.category === category.id ? colors.primary : colors.secondary,
                    minWidth: '30%',
                  }
                ]}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={eventData.category === category.id ? colors.primaryForeground : colors.foreground} 
                />
                <Text style={[
                  tw(text.sm),
                  { color: eventData.category === category.id ? colors.primaryForeground : colors.foreground }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Difficulty Level
          </Text>
          <View style={tw(layout.flexRow, spacing.gap(2))}>
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setEventData({ ...eventData, difficulty_level: level })}
                style={[
                  tw(layout.flex1, spacing.py(3), border.rounded, layout.itemsCenter),
                  {
                    backgroundColor: eventData.difficulty_level === level ? colors.primary : colors.secondary,
                  }
                ]}
              >
                <Text style={[
                  tw(text.sm, text.semibold),
                  { color: eventData.difficulty_level === level ? colors.primaryForeground : colors.foreground }
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderScheduleStep = () => (
    <View style={tw(spacing.gap(4))}>
      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          Start Date & Time *
        </Text>
        <TouchableOpacity
          onPress={() => setShowStartDatePicker(true)}
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
            { backgroundColor: colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={[tw(text.base), { color: colors.foreground }]}>
              {eventData.start_date.toLocaleDateString()} at {eventData.start_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Tap to change
          </Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          Duration (Minutes) *
        </Text>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          <TouchableOpacity
            onPress={() => setEventData({ ...eventData, duration_minutes: Math.max(15, (eventData.duration_minutes || 60) - 15) })}
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
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              {eventData.duration_minutes} min
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setEventData({ ...eventData, duration_minutes: (eventData.duration_minutes || 60) + 15 })}
            style={[
              tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
              { backgroundColor: colors.secondary }
            ]}
          >
            <Ionicons name="add" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
          End Date (Optional)
        </Text>
        <TouchableOpacity
          onPress={() => setShowEndDatePicker(true)}
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
            { backgroundColor: colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
            <Text style={[tw(text.base), { color: colors.foreground }]}>
              {eventData.end_date ? 
                `${eventData.end_date.toLocaleDateString()} at ${eventData.end_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                'No end date'
              }
            </Text>
          </View>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            {eventData.end_date ? 'Tap to change' : 'Tap to set'}
          </Text>
        </TouchableOpacity>
        {eventData.end_date && (
          <TouchableOpacity
            onPress={() => setEventData({ ...eventData, end_date: undefined })}
            style={tw(spacing.mt(2))}
          
          >
            <Text style={[tw(text.sm), { color: colors.destructive }]}>
              Remove end date
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderLocationStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Location Type *
          </Text>
          <View style={tw(spacing.gap(3))}>
            {locationTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setEventData({ ...eventData, location_type: type.id as Event['location_type'] })}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.p(4), border.rounded),
                  {
                    backgroundColor: eventData.location_type === type.id ? colors.primary + '20' : colors.muted,
                    borderWidth: 1,
                    borderColor: eventData.location_type === type.id ? colors.primary : colors.border,
                  }
                ]}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={24} 
                  color={eventData.location_type === type.id ? colors.primary : colors.foreground} 
                />
                <View style={tw(layout.flex1, spacing.ml(3))}>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {type.name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {type.description}
                  </Text>
                </View>
                {eventData.location_type === type.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {eventData.location_type === 'virtual' && (
          <View>
            <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
              Meeting Link *
            </Text>
            <Input
              value={eventData.meeting_link}
              onChangeText={(text) => setEventData({ ...eventData, meeting_link: text })}
              placeholder="https://zoom.us/j/123456789"
              style={tw(spacing.mb(0))}
            />
          </View>
        )}

        {(eventData.location_type === 'in_person' || eventData.location_type === 'hybrid') && (
          <View>
            <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
              Location Details *
            </Text>
            <TextInput
              value={eventData.location_details}
              onChangeText={(text) => setEventData({ ...eventData, location_details: text })}
              placeholder="Address, gym name, or meeting point..."
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
        )}

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Max Participants (Optional)
          </Text>
          <Input
            value={eventData.max_participants?.toString() || ''}
            onChangeText={(text) => setEventData({ ...eventData, max_participants: parseInt(text) || undefined })}
            placeholder="Leave empty for unlimited"
            keyboardType="numeric"
            style={tw(spacing.mb(0))}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderSettingsStep = () => (
    <ScrollView style={tw(layout.flex1)} showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Entry Fee ($)
          </Text>
          <Input
            value={eventData.price?.toString() || '0'}
            onChangeText={(text) => setEventData({ ...eventData, price: parseInt(text) || 0 })}
            placeholder="0"
            keyboardType="numeric"
            style={tw(spacing.mb(0))}
          />
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Tags
          </Text>
          <View style={tw(spacing.gap(2))}>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <Input
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add a tag..."
                style={tw(layout.flex1, spacing.mb(0))}
              />
              <Button
                variant="outline"
                size="sm"
                onPress={handleAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </View>
            
            {eventData.tags.length > 0 && (
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                {eventData.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[
                      tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(1), border.rounded),
                      { backgroundColor: colors.primary + '20' }
                    ]}
                  >
                    <Text style={[tw(text.sm), { color: colors.primary }]}>
                      {tag}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(index)}>
                      <Ionicons name="close" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
            Requirements
          </Text>
          <View style={tw(spacing.gap(2))}>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <Input
                value={newRequirement}
                onChangeText={setNewRequirement}
                placeholder="Add a requirement..."
                style={tw(layout.flex1, spacing.mb(0))}
              />
              <Button
                variant="outline"
                size="sm"
                onPress={handleAddRequirement}
                disabled={!newRequirement.trim()}
              >
                Add
              </Button>
            </View>
            
            {eventData.requirements.map((req, index) => (
              <View
                key={index}
                style={[
                  tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(3), border.rounded),
                  { backgroundColor: colors.muted }
                ]}
              >
                <Text style={[tw(text.sm, layout.flex1), { color: colors.foreground }]}>
                  {req}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveRequirement(index)}>
                  <Ionicons name="close-circle" size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Visibility Settings
          </Text>
          
          <TouchableOpacity
            onPress={() => setEventData({ ...eventData, is_public: !eventData.is_public })}
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded, spacing.mb(3)),
              { backgroundColor: colors.muted }
            ]}
          >
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                Public Event
              </Text>
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Allow anyone to discover and join this event
              </Text>
            </View>
            <View style={[
              tw(spacing.w(12), spacing.h(6), border.rounded, layout.justifyEnd),
              { 
                backgroundColor: eventData.is_public ? colors.primary : colors.border,
                padding: 2
              }
            ]}>
              <View style={[
                tw(spacing.w(5), spacing.h(5), border.rounded),
                { 
                  backgroundColor: colors.background,
                  transform: [{ translateX: eventData.is_public ? 20 : 0 }]
                }
              ]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setEventData({ ...eventData, is_featured: !eventData.is_featured })}
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
              { backgroundColor: colors.muted }
            ]}
          >
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                Featured Event
              </Text>
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Highlight this event in discovery
              </Text>
            </View>
            <View style={[
              tw(spacing.w(12), spacing.h(6), border.rounded, layout.justifyEnd),
              { 
                backgroundColor: eventData.is_featured ? colors.primary : colors.border,
                padding: 2
              }
            ]}>
              <View style={[
                tw(spacing.w(5), spacing.h(5), border.rounded),
                { 
                  backgroundColor: colors.background,
                  transform: [{ translateX: eventData.is_featured ? 20 : 0 }]
                }
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicsStep();
      case 1:
        return renderScheduleStep();
      case 2:
        return renderLocationStep();
      case 3:
        return renderSettingsStep();
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return eventData.title.trim() && eventData.description.trim();
      case 1:
        return eventData.start_date > new Date() && eventData.duration_minutes > 0;
      case 2:
        if (eventData.location_type === 'virtual') {
          return eventData.meeting_link?.trim();
        }
        if (eventData.location_type === 'in_person') {
          return eventData.location_details?.trim();
        }
        return true;
      case 3:
        return true;
      default:
        return false;
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
          {existingEvent ? 'Edit Event' : 'Create Event'}
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
            onPress={handleSave}
            loading={createEvent.isPending}
            disabled={!validateEvent()}
            style={tw(layout.flex1)}
          >
            {existingEvent ? 'Update Event' : 'Create Event'}
          </Button>
        )}
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={eventData.start_date}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setEventData({ ...eventData, start_date: selectedDate });
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={eventData.end_date || new Date()}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEventData({ ...eventData, end_date: selectedDate });
            }
          }}
          minimumDate={eventData.start_date}
        />
      )}
    </MobileLayout>
  );
};