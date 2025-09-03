import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, TextInput } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { ProgramTemplate, ProgramAssignment as ProgramAssignmentType } from '@/services/program-service';
import { useAssignProgram, useUpdateAssignmentStatus } from '@/hooks/use-program-management';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ProgramAssignmentProps {
  program: ProgramTemplate;
  clients: Array<{
    id: string;
    profile?: {
      id: string;
      first_name: string;
      last_name: string;
      username: string;
      avatar_url?: string;
    };
  }>;
  onAssign?: (assignment: ProgramAssignmentType) => void;
  onClose?: () => void;
}

export const ProgramAssignment: React.FC<ProgramAssignmentProps> = ({
  program,
  clients,
  onAssign,
  onClose,
}) => {
  const { colors } = useTheme();
  const assignProgram = useAssignProgram();
  
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');

  const handleAssign = async () => {
    if (!selectedClient) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    try {
      const result = await assignProgram.mutateAsync({
        programId: program.id,
        clientId: selectedClient,
        startDate: startDate.toISOString(),
        customizations: {
          ...customizations,
          notes,
        },
      });

      if (result.success) {
        Alert.alert('Success', 'Program assigned successfully!');
        onAssign?.(result.data);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to assign program');
    }
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <View style={tw(layout.flex1)}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <View style={tw(layout.flex1)}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Assign Program
          </Text>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            {program.name}
          </Text>
        </View>
        
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
        {/* Program Info */}
        <Card elevation="sm" style={tw(spacing.mb(4))}>
          <View style={tw(spacing.p(4))}>
            <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(3))}>
              <View>
                <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                  Duration
                </Text>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  {program.duration_weeks} Weeks
                </Text>
              </View>
              
              <View>
                <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                  Difficulty
                </Text>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  {program.difficulty_level.charAt(0).toUpperCase() + program.difficulty_level.slice(1)}
                </Text>
              </View>
              
              <View>
                <Text style={[tw(text.xs, text.uppercase), { color: colors.mutedForeground }]}>
                  Type
                </Text>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  {program.program_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
              </View>
            </View>

            <Text style={[tw(text.sm), { color: colors.foreground }]}>
              {program.description}
            </Text>
          </View>
        </Card>

        {/* Client Selection */}
        <View style={tw(spacing.mb(4))}>
          <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Select Client *
          </Text>
          
          {clients.length > 0 ? (
            <View style={tw(spacing.gap(2))}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  onPress={() => setSelectedClient(client.id)}
                  style={[
                    tw(layout.flexRow, layout.itemsCenter, spacing.p(3), border.rounded),
                    {
                      backgroundColor: selectedClient === client.id ? colors.primary + '20' : colors.muted,
                      borderWidth: 1,
                      borderColor: selectedClient === client.id ? colors.primary : colors.border,
                    }
                  ]}
                >
                  <Avatar
                    source={client.profile?.avatar_url ? { uri: client.profile.avatar_url } : undefined}
                    fallback={client.profile?.first_name?.[0] || client.profile?.username?.[0] || 'C'}
                    size="default"
                  />
                  
                  <View style={tw(layout.flex1, spacing.ml(3))}>
                    <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                      {client.profile?.first_name && client.profile?.last_name
                        ? `${client.profile.first_name} ${client.profile.last_name}`
                        : client.profile?.username || 'Unknown Client'
                      }
                    </Text>
                  </View>

                  {selectedClient === client.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Card elevation="sm">
              <View style={tw(spacing.p(6), layout.itemsCenter)}>
                <Ionicons name="people-outline" size={48} color={colors.border} />
                <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.foreground }]}>
                  No active clients found
                </Text>
                <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  You need active clients to assign programs
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Start Date */}
        <View style={tw(spacing.mb(4))}>
          <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Start Date *
          </Text>
          
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.rounded),
              { backgroundColor: colors.muted }
            ]}
          >
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[tw(text.base), { color: colors.foreground }]}>
                {startDate.toLocaleDateString()}
              </Text>
            </View>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Tap to change
            </Text>
          </TouchableOpacity>
          
          <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.mutedForeground }]}>
            Program will end on: {new Date(startDate.getTime() + (program.duration_weeks * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
          </Text>
        </View>

        {/* Notes */}
        <View style={tw(spacing.mb(4))}>
          <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Assignment Notes (Optional)
          </Text>
          
          <View style={[
            tw(border.border, border.rounded, spacing.p(3)),
            { borderColor: colors.border, backgroundColor: colors.background }
          ]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any custom notes or modifications for this client..."
              multiline
              numberOfLines={4}
              style={[
                { color: colors.foreground, textAlignVertical: 'top', minHeight: 80 }
              ]}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        {/* Selected Client Summary */}
        {selectedClientData && (
          <Card elevation="sm" style={tw(spacing.mb(4))}>
            <View style={tw(spacing.p(4))}>
              <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                Assignment Summary
              </Text>
              
              <View style={tw(spacing.gap(2))}>
                <View style={tw(layout.flexRow, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Client:
                  </Text>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    {selectedClientData.profile?.first_name} {selectedClientData.profile?.last_name}
                  </Text>
                </View>
                
                <View style={tw(layout.flexRow, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Program:
                  </Text>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    {program.name}
                  </Text>
                </View>
                
                <View style={tw(layout.flexRow, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Duration:
                  </Text>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    {program.duration_weeks} weeks
                  </Text>
                </View>
                
                <View style={tw(layout.flexRow, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Start Date:
                  </Text>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    {startDate.toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={tw(layout.flexRow, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Price:
                  </Text>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                    {program.price === 0 ? 'Free' : `$${program.price}/month`}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[
        tw(layout.flexRow, spacing.gap(3), spacing.p(4), border.borderT),
        { borderTopColor: colors.border }
      ]}>
        <Button
          variant="outline"
          onPress={onClose}
          style={tw(layout.flex1)}
        >
          Cancel
        </Button>
        
        <Button
          variant="gradient"
          onPress={handleAssign}
          loading={assignProgram.isPending}
          disabled={!selectedClient}
          style={tw(layout.flex1)}
        >
          Assign Program
        </Button>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
};

interface AssignmentCardProps {
  assignment: ProgramAssignmentType;
  onStatusUpdate?: (assignmentId: string, status: ProgramAssignmentType['status']) => void;
  onViewDetails?: (assignmentId: string) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onStatusUpdate,
  onViewDetails,
}) => {
  const { colors } = useTheme();
  const updateStatus = useUpdateAssignmentStatus();

  const getStatusColor = (status: ProgramAssignmentType['status']) => {
    switch (status) {
      case 'active': return colors.primary;
      case 'pending': return colors.destructive;
      case 'paused': return colors.mutedForeground;
      case 'completed': return colors.primary;
      case 'cancelled': return colors.border;
      default: return colors.mutedForeground;
    }
  };

  const getStatusIcon = (status: ProgramAssignmentType['status']) => {
    switch (status) {
      case 'active': return 'play-circle';
      case 'pending': return 'time';
      case 'paused': return 'pause-circle';
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const handleStatusChange = async (newStatus: ProgramAssignmentType['status']) => {
    const result = await updateStatus.mutateAsync({
      assignmentId: assignment.id,
      status: newStatus,
    });

    if (result.success) {
      onStatusUpdate?.(assignment.id, newStatus);
    }
  };

  const progressPercentage = assignment.completion_percentage || 0;
  const daysRemaining = Math.ceil(
    (new Date(assignment.target_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card elevation="sm">
      <TouchableOpacity
        onPress={() => onViewDetails?.(assignment.id)}
        style={tw(spacing.p(4))}
      >
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
          <View style={tw(layout.flex1)}>
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              {assignment.program_template?.name || 'Unknown Program'}
            </Text>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {assignment.client_profile?.first_name} {assignment.client_profile?.last_name}
            </Text>
          </View>
          
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
            <Ionicons 
              name={getStatusIcon(assignment.status) as any} 
              size={16} 
              color={getStatusColor(assignment.status)} 
            />
            <Text style={[
              tw(text.xs, text.semibold),
              { color: getStatusColor(assignment.status) }
            ]}>
              {assignment.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw(spacing.mb(3))}>
          <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(1))}>
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              Week {assignment.current_week} of {assignment.program_template?.duration_weeks || 0}
            </Text>
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              {progressPercentage}% Complete
            </Text>
          </View>
          
          <View style={[
            tw(spacing.h(2), border.rounded),
            { backgroundColor: colors.muted }
          ]}>
            <View style={[
              tw(layout.hFull, border.rounded),
              {
                backgroundColor: colors.primary,
                width: `${progressPercentage}%`,
              }
            ]} />
          </View>
        </View>

        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
          <View style={tw(layout.flexRow, spacing.gap(4))}>
            <View>
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                Started
              </Text>
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                {new Date(assignment.start_date).toLocaleDateString()}
              </Text>
            </View>
            
            {assignment.status === 'active' && daysRemaining > 0 && (
              <View>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  Days Left
                </Text>
                <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                  {daysRemaining}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          {assignment.status === 'pending' && (
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <TouchableOpacity
                onPress={() => handleStatusChange('active')}
                style={[
                  tw(spacing.px(3), spacing.py(1), border.rounded),
                  { backgroundColor: colors.primary + '20' }
                ]}
              >
                <Text style={[tw(text.xs, text.semibold), { color: colors.primary }]}>
                  START
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {assignment.status === 'active' && (
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <TouchableOpacity
                onPress={() => handleStatusChange('paused')}
                style={[
                  tw(spacing.px(3), spacing.py(1), border.rounded),
                  { backgroundColor: colors.mutedForeground + '20' }
                ]}
              >
                <Text style={[tw(text.xs, text.semibold), { color: colors.mutedForeground }]}>
                  PAUSE
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
};