import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { useClientManagement } from '@/hooks/use-coach-platform';
import { ClientRelationshipStatus, CoachClientRelationship } from '@/services/coach-service';
import { Ionicons } from '@expo/vector-icons';

export interface ClientManagementProps {
  coachId: string;
  onBack?: () => void;
  onClientSelect?: (clientId: string) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  coachId,
  onBack,
  onClientSelect,
}) => {
  const { colors } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<'all' | ClientRelationshipStatus>('all');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CoachClientRelationship | null>(null);
  const [noteText, setNoteText] = useState('');

  const {
    clients,
    clientProgress,
    isLoading,
    error,
    updateClientStatus,
    addClientNote,
    isUpdating,
    refetch,
  } = useClientManagement(coachId, selectedClient?.client_id);

  const filteredClients = selectedFilter === 'all' 
    ? clients 
    : clients.filter((client: CoachClientRelationship) => client.status === selectedFilter);

  const handleStatusChange = (client: CoachClientRelationship, newStatus: ClientRelationshipStatus) => {
    Alert.alert(
      'Update Client Status',
      `Are you sure you want to change ${client.client_profile?.first_name || 'this client'}'s status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => updateClientStatus(client.id, newStatus),
        },
      ]
    );
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedClient) return;
    
    addClientNote(noteText.trim());
    setNoteText('');
    setShowNoteModal(false);
  };

  const getStatusColor = (status: ClientRelationshipStatus) => {
    switch (status) {
      case 'active': return colors.primary;
      case 'pending': return colors.destructive;
      case 'paused': return colors.mutedForeground;
      case 'cancelled': return colors.border;
      case 'completed': return colors.primary;
      default: return colors.mutedForeground;
    }
  };

  const getStatusIcon = (status: ClientRelationshipStatus) => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'paused': return 'pause-circle';
      case 'cancelled': return 'close-circle';
      case 'completed': return 'trophy';
      default: return 'help-circle';
    }
  };

  if (isLoading) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Loading clients...
          </Text>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View 
        style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
          { backgroundColor: colors.card, borderBottomColor: colors.border }
        ]}
      >
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
        
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          Client Management
        </Text>
        
        <TouchableOpacity onPress={refetch}>
          <Ionicons name="refresh" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
        {/* Filter Tabs */}
        <View style={tw(spacing.mb(6))}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw(spacing.gap(2))}
          >
            {(['all', 'pending', 'active', 'paused', 'cancelled'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  tw(spacing.px(4), spacing.py(2), border.rounded),
                  {
                    backgroundColor: selectedFilter === filter ? colors.primary : colors.secondary,
                  }
                ]}
              >
                <Text style={[
                  tw(text.sm, text.semibold),
                  { color: selectedFilter === filter ? colors.primaryForeground : colors.foreground }
                ]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter !== 'all' && ` (${clients.filter((c: CoachClientRelationship) => c.status === filter).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Client List */}
        {filteredClients.length > 0 ? (
          <View style={tw(spacing.gap(3))}>
            {filteredClients.map((client: CoachClientRelationship) => (
              <Card key={client.id} elevation="sm">
                <TouchableOpacity
                  onPress={() => onClientSelect?.(client.client_id)}
                  style={tw(spacing.p(4))}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
                    <Avatar
                      source={client.client_profile?.avatar_url ? { uri: client.client_profile.avatar_url } : undefined}
                      fallback={client.client_profile?.first_name?.[0] || client.client_profile?.username?.[0] || 'U'}
                      size="lg"
                    />
                    
                    <View style={tw(layout.flex1)}>
                      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(1))}>
                        <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                          {client.client_profile?.first_name && client.client_profile?.last_name
                            ? `${client.client_profile.first_name} ${client.client_profile.last_name}`
                            : client.client_profile?.username || 'Unknown Client'
                          }
                        </Text>
                        
                        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                          <Ionicons 
                            name={getStatusIcon(client.status) as any} 
                            size={16} 
                            color={getStatusColor(client.status)} 
                          />
                          <Text style={[
                            tw(text.xs, text.semibold),
                            { color: getStatusColor(client.status) }
                          ]}>
                            {client.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                        Since {new Date(client.start_date).toLocaleDateString()}
                      </Text>
                      
                      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mt(2))}>
                        <Text style={[tw(text.sm), { color: colors.foreground }]}>
                          ${client.monthly_price.toString()}/month
                        </Text>
                        
                        <View style={tw(layout.flexRow, spacing.gap(2))}>
                          {client.status === 'pending' && (
                            <>
                              <TouchableOpacity
                                onPress={() => handleStatusChange(client, 'active')}
                                style={[
                                  tw(spacing.px(3), spacing.py(1), border.rounded),
                                  { backgroundColor: colors.primary + '20' }
                                ]}
                              >
                                <Text style={[tw(text.xs, text.semibold), { color: colors.primary }]}>
                                  APPROVE
                                </Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                onPress={() => handleStatusChange(client, 'cancelled')}
                                style={[
                                  tw(spacing.px(3), spacing.py(1), border.rounded),
                                  { backgroundColor: colors.destructive + '20' }
                                ]}
                              >
                                <Text style={[tw(text.xs, text.semibold), { color: colors.destructive }]}>
                                  REJECT
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                          
                          {client.status === 'active' && (
                            <>
                              <TouchableOpacity
                                onPress={() => handleStatusChange(client, 'paused')}
                                style={[
                                  tw(spacing.px(3), spacing.py(1), border.rounded),
                                  { backgroundColor: colors.mutedForeground + '20' }
                                ]}
                              >
                                <Text style={[tw(text.xs, text.semibold), { color: colors.mutedForeground }]}>
                                  PAUSE
                                </Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedClient(client);
                                  setShowNoteModal(true);
                                }}
                                style={[
                                  tw(spacing.px(3), spacing.py(1), border.rounded),
                                  { backgroundColor: colors.primary + '20' }
                                ]}
                              >
                                <Text style={[tw(text.xs, text.semibold), { color: colors.primary }]}>
                                  NOTE
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                          
                          {client.status === 'paused' && (
                            <TouchableOpacity
                              onPress={() => handleStatusChange(client, 'active')}
                              style={[
                                tw(spacing.px(3), spacing.py(1), border.rounded),
                                { backgroundColor: colors.primary + '20' }
                              ]}
                            >
                              <Text style={[tw(text.xs, text.semibold), { color: colors.primary }]}>
                                RESUME
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        ) : (
          <Card elevation="sm">
            <View style={tw(spacing.p(6), layout.itemsCenter)}>
              <Ionicons name="people-outline" size={48} color={colors.border} />
              <Text style={[tw(text.base, text.center, spacing.mt(4)), { color: colors.foreground }]}>
                No clients found
              </Text>
              <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                {selectedFilter === 'all' 
                  ? 'You haven\'t received any client requests yet'
                  : `No clients with ${selectedFilter} status`
                }
              </Text>
            </View>
          </Card>
        )}

        {/* Bottom spacing */}
        <View style={tw(spacing.h(8))} />
      </ScrollView>

      {/* Add Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={[
          tw(layout.flex1, layout.justifyEnd),
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
        ]}>
          <View style={[
            tw(border.rounded, spacing.p(6)),
            { backgroundColor: colors.card }
          ]}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Add Client Note
              </Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {selectedClient && (
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(4))}>
                <Avatar
                  source={selectedClient.client_profile?.avatar_url ? { uri: selectedClient.client_profile.avatar_url } : undefined}
                  fallback={selectedClient.client_profile?.first_name?.[0] || selectedClient.client_profile?.username?.[0] || 'U'}
                  size="default"
                />
                <Text style={[tw(text.base), { color: colors.foreground }]}>
                  Note for {selectedClient.client_profile?.first_name || selectedClient.client_profile?.username}
                </Text>
              </View>
            )}

            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Enter your note here..."
              multiline
              numberOfLines={4}
              style={[
                tw(border.border, border.rounded, spacing.p(3), spacing.mb(4)),
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

            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <Button
                onPress={() => setShowNoteModal(false)}
                variant="outline"
                style={tw(layout.flex1)}
              >
                Cancel
              </Button>
              <Button
                onPress={handleAddNote}
                variant="default"
                style={tw(layout.flex1)}
                loading={isUpdating}
                disabled={!noteText.trim()}
              >
                Add Note
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </MobileLayout>
  );
};

export default ClientManagement;