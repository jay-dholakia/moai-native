import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { useCoachDashboard } from '@/hooks/use-coach-platform';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CoachClientRelationship } from '@/services/coach-service';

export interface CoachDashboardProps {
  coachId?: string;
  onClientPress?: (clientId: string) => void;
  onViewAllClients?: () => void;
  onManageProfile?: () => void;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({
  coachId,
  onClientPress,
  onViewAllClients,
  onManageProfile,
}) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    coachProfile,
    stats,
    activeClients,
    pendingClients,
    isLoading,
    error,
    refetch,
  } = useCoachDashboard(coachId);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (isLoading && !coachProfile) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Loading coach dashboard...
          </Text>
        </View>
      </MobileLayout>
    );
  }

  if (error || !coachProfile) {
    return (
      <MobileLayout safeArea padding>
        <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
          <Ionicons name="warning-outline" size={48} color={colors.border} />
          <Text style={[tw(text.base, text.center, spacing.mt(4)), { color: colors.foreground }]}>
            Unable to load coach dashboard
          </Text>
          <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
            {error?.message || 'Please try again later'}
          </Text>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout scrollable={false} safeArea padding={false}>
      <ScrollView 
        style={tw(layout.flex1)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Coach Profile */}
        <LinearGradient
          colors={[colors.primary + '10', colors.primary + '05'] as [string, string, ...string[]]}
          style={tw(spacing.p(6), spacing.pb(8))}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
              <Avatar
                source={coachProfile.profile?.avatar_url ? { uri: coachProfile.profile.avatar_url } : undefined}
                fallback={coachProfile.profile?.first_name?.[0] || coachProfile.profile?.username?.[0] || 'C'}
                size="lg"
              />
              <View>
                <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
                  Welcome, {coachProfile.profile?.first_name || coachProfile.profile?.username}
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  Coach Dashboard
                </Text>
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mt(1))}>
                  <Ionicons name="star" size={16} color={colors.primary} />
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    {coachProfile.rating.toFixed(1)} rating
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    • {coachProfile.total_sessions} sessions
                  </Text>
                </View>
              </View>
            </View>
            
            {onManageProfile && (
              <TouchableOpacity onPress={onManageProfile}>
                <Ionicons name="settings-outline" size={24} color={colors.foreground} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={tw(spacing.p(4))}>
          {/* Stats Overview */}
          <View style={tw(spacing.mb(6))}>
            <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
              Overview
            </Text>
            
            <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(4))}>
              <Card elevation="sm" style={tw(layout.flex1)}>
                <View style={tw(spacing.p(4), layout.itemsCenter)}>
                  <Text style={[tw(text['2xl'], text.semibold), { color: colors.primary }]}>
                    {stats?.active_clients || 0}
                  </Text>
                  <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                    Active Clients
                  </Text>
                </View>
              </Card>
              
              <Card elevation="sm" style={tw(layout.flex1)}>
                <View style={tw(spacing.p(4), layout.itemsCenter)}>
                  <Text style={[tw(text['2xl'], text.semibold), { color: colors.primary }]}>
                    ${stats?.monthly_revenue?.toFixed(0) || '0'}
                  </Text>
                  <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                    Monthly Revenue
                  </Text>
                </View>
              </Card>
            </View>

            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <Card elevation="sm" style={tw(layout.flex1)}>
                <View style={tw(spacing.p(4), layout.itemsCenter)}>
                  <Text style={[tw(text['2xl'], text.semibold), { color: colors.primary }]}>
                    {stats?.recent_activity.sessions_this_week || 0}
                  </Text>
                  <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                    Sessions This Week
                  </Text>
                </View>
              </Card>
              
              <Card elevation="sm" style={tw(layout.flex1)}>
                <View style={tw(spacing.p(4), layout.itemsCenter)}>
                  <Text style={[tw(text['2xl'], text.semibold), { color: colors.primary }]}>
                    {stats?.client_retention_rate?.toFixed(0) || '0'}%
                  </Text>
                  <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                    Retention Rate
                  </Text>
                </View>
              </Card>
            </View>
          </View>

          {/* Pending Clients */}
          {pendingClients && pendingClients.length > 0 && (
            <View style={tw(spacing.mb(6))}>
              <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
                <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                  Pending Approvals
                </Text>
                <View 
                  style={[
                    tw(spacing.px(2), spacing.py(1), border.rounded),
                    { backgroundColor: colors.destructive + '20' }
                  ]}
                >
                  <Text style={[tw(text.xs, text.semibold), { color: colors.destructive }]}>
                    {pendingClients.length} PENDING
                  </Text>
                </View>
              </View>
              
              <Card elevation="sm">
                <View style={tw(spacing.p(4))}>
                  {pendingClients.slice(0, 3).map((client: CoachClientRelationship, index: number) => (
                    <TouchableOpacity
                      key={client.id}
                      onPress={() => onClientPress?.(client.client_id)}
                      style={[
                        tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.py(3)),
                        index < pendingClients.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }
                      ]}
                    >
                      <Avatar
                        source={client.client_profile?.avatar_url ? { uri: client.client_profile.avatar_url } : undefined}
                        fallback={client.client_profile?.first_name?.[0] || client.client_profile?.username?.[0] || 'U'}
                        size="default"
                      />
                      
                      <View style={tw(layout.flex1)}>
                        <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                          {client.client_profile?.first_name && client.client_profile?.last_name
                            ? `${client.client_profile.first_name} ${client.client_profile.last_name}`
                            : client.client_profile?.username || 'Unknown Client'
                          }
                        </Text>
                        <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                          Applied {new Date(client.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                        <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                          ${client.monthly_price.toString()}
                        </Text>
                        <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                          /month
                        </Text>
                      </View>
                      
                      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                  
                  {pendingClients.length > 3 && onViewAllClients && (
                    <TouchableOpacity
                      onPress={onViewAllClients}
                      style={tw(layout.itemsCenter, spacing.py(3), spacing.mt(2))}
                    >
                      <Text style={[tw(text.sm), { color: colors.primary }]}>
                        View All {pendingClients.length} Pending Clients
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            </View>
          )}

          {/* Active Clients */}
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Active Clients
              </Text>
              {onViewAllClients && (
                <TouchableOpacity onPress={onViewAllClients}>
                  <Text style={[tw(text.sm), { color: colors.primary }]}>
                    View All
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {activeClients && activeClients.length > 0 ? (
              <Card elevation="sm">
                <View style={tw(spacing.p(4))}>
                  {activeClients.slice(0, 5).map((client: CoachClientRelationship, index: number) => (
                    <TouchableOpacity
                      key={client.id}
                      onPress={() => onClientPress?.(client.client_id)}
                      style={[
                        tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.py(3)),
                        index < Math.min(activeClients.length, 5) - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }
                      ]}
                    >
                      <Avatar
                        source={client.client_profile?.avatar_url ? { uri: client.client_profile.avatar_url } : undefined}
                        fallback={client.client_profile?.first_name?.[0] || client.client_profile?.username?.[0] || 'U'}
                        size="default"
                      />
                      
                      <View style={tw(layout.flex1)}>
                        <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                          {client.client_profile?.first_name && client.client_profile?.last_name
                            ? `${client.client_profile.first_name} ${client.client_profile.last_name}`
                            : client.client_profile?.username || 'Unknown Client'
                          }
                        </Text>
                        <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                          Active since {new Date(client.start_date).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <View style={tw(layout.itemsCenter)}>
                        <View 
                          style={[
                            tw(spacing.w(2), spacing.h(2), border.rounded),
                            { backgroundColor: colors.primary }
                          ]}
                        />
                        <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.primary }]}>
                          Active
                        </Text>
                      </View>
                      
                      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            ) : (
              <Card elevation="sm">
                <View style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Ionicons name="people-outline" size={48} color={colors.border} />
                  <Text style={[tw(text.base, text.center, spacing.mt(4)), { color: colors.foreground }]}>
                    No active clients yet
                  </Text>
                  <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    Start by approving pending client requests
                  </Text>
                </View>
              </Card>
            )}
          </View>

          {/* Quick Actions */}
          <View style={tw(spacing.mb(6))}>
            <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
              Quick Actions
            </Text>
            
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <TouchableOpacity
                onPress={onViewAllClients}
                style={[
                  tw(layout.flex1, spacing.p(4), border.rounded, layout.itemsCenter, border.border),
                  { backgroundColor: colors.card, borderColor: colors.border }
                ]}
              >
                <Ionicons name="people" size={24} color={colors.primary} />
                <Text style={[tw(text.sm, text.semibold, spacing.mt(2), text.center), { color: colors.foreground }]}>
                  Manage Clients
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={onManageProfile}
                style={[
                  tw(layout.flex1, spacing.p(4), border.rounded, layout.itemsCenter, border.border),
                  { backgroundColor: colors.card, borderColor: colors.border }
                ]}
              >
                <Ionicons name="person-circle" size={24} color={colors.primary} />
                <Text style={[tw(text.sm, text.semibold, spacing.mt(2), text.center), { color: colors.foreground }]}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={tw(spacing.h(8))} />
        </View>
      </ScrollView>
    </MobileLayout>
  );
};

export default CoachDashboard;