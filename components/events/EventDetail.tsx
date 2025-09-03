import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { 
  useRegisterForEvent, 
  useCancelEventRegistration, 
  useEventParticipants,
  useParticipationStatus 
} from '@/hooks/use-events-challenges';
import { Event } from '@/services/event-service';

interface EventDetailProps {
  event: Event;
  onBack?: () => void;
  onEdit?: (event: Event) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({
  event,
  onBack,
  onEdit,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'details' | 'participants'>('details');

  const registerForEvent = useRegisterForEvent();
  const cancelRegistration = useCancelEventRegistration();
  const { data: participantsResponse } = useEventParticipants(event.id);
  const { isRegisteredForEvent, canRegister } = useParticipationStatus(event.id);

  const participants = participantsResponse?.success ? participantsResponse.data : [];
  const canEdit = false; // TODO: Check if user is organizer

  const handleRegister = async () => {
    try {
      await registerForEvent.mutateAsync(event.id);
      Alert.alert('Success', 'You have successfully registered for this event!');
    } catch (error) {
      Alert.alert('Error', 'Failed to register for event. Please try again.');
    }
  };

  const handleCancelRegistration = async () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration for this event?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRegistration.mutateAsync(event.id);
              Alert.alert('Success', 'Your registration has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel registration. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleOpenMeetingLink = async () => {
    if (event.meeting_link) {
      try {
        await Linking.openURL(event.meeting_link);
      } catch (error) {
        Alert.alert('Error', 'Unable to open meeting link');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  };

  const eventDate = formatDate(event.start_date);
  const endDate = event.end_date ? formatDate(event.end_date) : null;

  const DetailTab: React.FC = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={tw(spacing.gap(4))}>
        {/* Organizer Info */}
        <Card style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Avatar
              size="md"
              source={(event.organizer_profile as any)?.avatar_url ? { uri: (event.organizer_profile as any).avatar_url } : undefined}
              fallback={`${event.organizer_profile?.first_name?.[0]}${event.organizer_profile?.last_name?.[0]}`}
            />
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {event.organizer_profile?.first_name} {event.organizer_profile?.last_name}
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Event Organizer
              </Text>
            </View>
          </View>
        </Card>

        {/* Event Details */}
        <Card style={tw(spacing.p(4))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Event Details
          </Text>

          {/* Date & Time */}
          <View style={tw(layout.flexRow, layout.itemsStart, spacing.mb(3))}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <View style={tw(spacing.ml(3), layout.flex1)}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {eventDate.date}
              </Text>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                {eventDate.time}
                {endDate && ` - ${endDate.time}`}
                {event.duration_minutes && ` (${event.duration_minutes} min)`}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={tw(layout.flexRow, layout.itemsStart, spacing.mb(3))}>
            <Ionicons 
              name={event.location_type === 'virtual' ? 'videocam' : 'location'} 
              size={20} 
              color={colors.primary} 
            />
            <View style={tw(spacing.ml(3), layout.flex1)}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {event.location_type === 'virtual' ? 'Virtual Event' : 
                 event.location_type === 'in_person' ? 'In Person' : 'Hybrid Event'}
              </Text>
              {event.location_details && (
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {event.location_details}
                </Text>
              )}
              {event.location_type === 'virtual' && event.meeting_link && isRegisteredForEvent && (
                <TouchableOpacity 
                  onPress={handleOpenMeetingLink}
                  style={tw(spacing.mt(2))}
                >
                  <Text style={[tw(text.sm), { color: colors.primary }]}>
                    Join Meeting →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Participants */}
          <View style={tw(layout.flexRow, layout.itemsStart, spacing.mb(3))}>
            <Ionicons name="people" size={20} color={colors.primary} />
            <View style={tw(spacing.ml(3), layout.flex1)}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {event.current_participants} Participants
              </Text>
              {event.max_participants && (
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {event.max_participants - event.current_participants} spots remaining
                </Text>
              )}
            </View>
          </View>

          {/* Difficulty */}
          {event.difficulty_level && (
            <View style={tw(layout.flexRow, layout.itemsStart, spacing.mb(3))}>
              <Ionicons name="fitness" size={20} color={colors.primary} />
              <View style={tw(spacing.ml(3), layout.flex1)}>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  {event.difficulty_level.charAt(0).toUpperCase() + event.difficulty_level.slice(1)} Level
                </Text>
              </View>
            </View>
          )}

          {/* Price */}
          {event.price && event.price > 0 && (
            <View style={tw(layout.flexRow, layout.itemsStart)}>
              <Ionicons name="pricetag" size={20} color={colors.primary} />
              <View style={tw(spacing.ml(3), layout.flex1)}>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  ${event.price}
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  Entry fee
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Description */}
        <Card style={tw(spacing.p(4))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            About This Event
          </Text>
          <Text style={[tw(text.base, layout.leading6), { color: colors.foreground }]}>
            {event.description}
          </Text>
        </Card>

        {/* Requirements */}
        {event.requirements && event.requirements.length > 0 && (
          <Card style={tw(spacing.p(4))}>
            <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
              Requirements
            </Text>
            <View style={tw(spacing.gap(2))}>
              {event.requirements.map((requirement, index) => (
                <View key={index} style={tw(layout.flexRow, layout.itemsStart, spacing.gap(2))}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[tw(text.sm, layout.flex1), { color: colors.foreground }]}>
                    {requirement}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Tags */}
        {event.tags.length > 0 && (
          <Card style={tw(spacing.p(4))}>
            <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
              Tags
            </Text>
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
              {event.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    tw(spacing.px(3), spacing.py(1), border.rounded),
                    { backgroundColor: colors.primary + '20' }
                  ]}
                >
                  <Text style={[tw(text.sm), { color: colors.primary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );

  const ParticipantsTab: React.FC = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={tw(spacing.p(4))}>
        <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
          Participants ({participants.length})
        </Text>

        {participants.length === 0 ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={[tw(text.base, spacing.mt(3)), { color: colors.mutedForeground }]}>
              No participants yet
            </Text>
            <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              Be the first to register for this event!
            </Text>
          </View>
        ) : (
          <View style={tw(spacing.gap(3))}>
            {participants.map((participant) => (
              <View key={participant.id} style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Avatar
                  size="sm"
                  source={(participant.user_profile as any)?.avatar_url ? { uri: (participant.user_profile as any).avatar_url } : undefined}
                  fallback={`${participant.user_profile?.first_name?.[0]}${participant.user_profile?.last_name?.[0]}`}
                />
                <View style={tw(layout.flex1)}>
                  <Text style={[tw(text.base), { color: colors.foreground }]}>
                    {participant.user_profile?.first_name} {participant.user_profile?.last_name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    @{participant.user_profile?.username}
                  </Text>
                </View>
                <View
                  style={[
                    tw(spacing.px(2), spacing.py(1), border.rounded),
                    { backgroundColor: colors.primary + '20' }
                  ]}
                >
                  <Text style={[tw(text.xs), { color: colors.primary }]}>
                    {participant.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          {onBack && (
            <TouchableOpacity onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              {event.title}
            </Text>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {event.category} • {event.event_type.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {canEdit && onEdit && (
          <TouchableOpacity onPress={() => onEdit(event)}>
            <Ionicons name="create" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Featured Badge */}
      {event.is_featured && (
        <View style={[
          tw(spacing.mx(4), spacing.mt(4), spacing.p(3), border.rounded),
          { backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 1 }
        ]}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2))}>
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
              Featured Event
            </Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={tw(layout.flexRow, spacing.mx(4), spacing.mt(4))}>
        <TouchableOpacity
          onPress={() => setActiveTab('details')}
          style={[
            tw(layout.flex1, spacing.py(3), border.borderB, border.border2),
            { borderBottomColor: activeTab === 'details' ? colors.primary : colors.border }
          ]}
        >
          <Text style={[
            tw(text.base, text.center, text.semibold),
            { color: activeTab === 'details' ? colors.primary : colors.mutedForeground }
          ]}>
            Details
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('participants')}
          style={[
            tw(layout.flex1, spacing.py(3), border.borderB, border.border2),
            { borderBottomColor: activeTab === 'participants' ? colors.primary : colors.border }
          ]}
        >
          <Text style={[
            tw(text.base, text.center, text.semibold),
            { color: activeTab === 'participants' ? colors.primary : colors.mutedForeground }
          ]}>
            Participants
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={tw(layout.flex1, spacing.p(4))}>
        {activeTab === 'details' ? <DetailTab /> : <ParticipantsTab />}
      </View>

      {/* Action Buttons */}
      <View style={[
        tw(layout.flexRow, spacing.gap(3), spacing.p(4), border.borderT),
        { borderTopColor: colors.border }
      ]}>
        {isRegisteredForEvent ? (
          <Button
            variant="destructive" 
            onPress={handleCancelRegistration}
            loading={cancelRegistration.isPending}
            style={tw(layout.flex1)}
          >
            Cancel Registration
          </Button>
        ) : canRegister ? (
          <Button
            variant="gradient"
            onPress={handleRegister}
            loading={registerForEvent.isPending}
            style={tw(layout.flex1)}
          >
            Register for Event
          </Button>
        ) : (
          <Button variant="outline" disabled style={tw(layout.flex1)}>
            {event.max_participants && event.current_participants >= event.max_participants 
              ? 'Event Full' : 'Registration Closed'}
          </Button>
        )}
      </View>
    </MobileLayout>
  );
};