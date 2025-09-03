import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { 
  useInfiniteAdminUsers, 
  useUpdateUserStatus, 
  useUpdateUserRole,
  useAdminUserDetails 
} from '@/hooks/use-admin-platform';
import { AdminUser } from '@/services/admin-service';

interface UserManagementProps {
  adminId: string;
  onUserPress?: (user: AdminUser) => void;
  onBackPress?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  adminId,
  onUserPress,
  onBackPress,
}) => {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteAdminUsers({
    search: searchTerm || undefined,
    role: selectedRole || undefined,
    status: selectedStatus || undefined,
    limit: 20,
  });

  const updateUserStatus = useUpdateUserStatus();
  const updateUserRole = useUpdateUserRole();

  const users = data?.pages.flatMap(page => 
    page.success ? page.data.users : []
  ) || [];

  const roles = [
    { id: '', name: 'All Roles' },
    { id: 'user', name: 'User' },
    { id: 'coach', name: 'Coach' },
    { id: 'admin', name: 'Admin' },
    { id: 'super_admin', name: 'Super Admin' },
  ];

  const statuses = [
    { id: '', name: 'All Statuses' },
    { id: 'active', name: 'Active' },
    { id: 'suspended', name: 'Suspended' },
    { id: 'banned', name: 'Banned' },
    { id: 'pending', name: 'Pending' },
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedStatus('');
  };

  const handleUserAction = (user: AdminUser, action: 'suspend' | 'ban' | 'activate', reason?: string) => {
    const actionText = action === 'activate' ? 'activate' : action;
    
    Alert.alert(
      `${actionText.charAt(0).toUpperCase()}${actionText.slice(1)} User`,
      `Are you sure you want to ${actionText} ${user.first_name} ${user.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'ban' ? 'destructive' : 'default',
          onPress: () => {
            const status = action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned';
            updateUserStatus.mutate({
              userId: user.id,
              status,
              reason: reason || `User ${actionText}d by admin`,
              adminId,
            });
          }
        }
      ]
    );
  };

  const handleRoleChange = (user: AdminUser, newRole: AdminUser['role']) => {
    Alert.alert(
      'Change User Role',
      `Change ${user.first_name} ${user.last_name}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Role',
          onPress: () => {
            updateUserRole.mutate({
              userId: user.id,
              role: newRole,
              reason: `Role changed to ${newRole} by admin`,
              adminId,
            });
          }
        }
      ]
    );
  };

  const getStatusColor = (status: AdminUser['status']) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'suspended': return '#f59e0b';
      case 'banned': return '#ef4444';
      case 'pending': return '#6b7280';
      default: return colors.mutedForeground;
    }
  };

  const getRoleColor = (role: AdminUser['role']) => {
    switch (role) {
      case 'super_admin': return colors.destructive;
      case 'admin': return colors.primary;
      case 'coach': return '#8b5cf6';
      case 'user': return colors.mutedForeground;
      default: return colors.mutedForeground;
    }
  };

  const UserCard: React.FC<{ user: AdminUser }> = ({ user }) => (
    <TouchableOpacity
      onPress={() => onUserPress?.(user)}
      style={tw(spacing.mb(3))}
    >
      <Card style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          <Avatar
            size="md"
            source={(user as any).avatar_url ? { uri: (user as any).avatar_url } : undefined}
            fallback={`${user.first_name[0]}${user.last_name[0]}`}
          />
          
          <View style={tw(layout.flex1)}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(1))}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {user.first_name} {user.last_name}
              </Text>
              
              {/* Status Badge */}
              <View style={[
                tw(spacing.px(2), spacing.py(1), border.rounded),
                { backgroundColor: getStatusColor(user.status) + '20' }
              ]}>
                <Text style={[tw(text.xs, text.semibold), { color: getStatusColor(user.status) }]}>
                  {user.status.toUpperCase()}
                </Text>
              </View>
              
              {/* Role Badge */}
              <View style={[
                tw(spacing.px(2), spacing.py(1), border.rounded),
                { backgroundColor: getRoleColor(user.role) + '20' }
              ]}>
                <Text style={[tw(text.xs, text.semibold), { color: getRoleColor(user.role) }]}>
                  {user.role.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {user.email}
            </Text>
            
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4), spacing.mt(2))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons name="fitness" size={12} color={colors.mutedForeground} />
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {user.activity_count} activities
                </Text>
              </View>
              
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons name="people" size={12} color={colors.mutedForeground} />
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {user.moai_count} MOAIs
                </Text>
              </View>
              
              {user.flags_count > 0 && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                  <Ionicons name="flag" size={12} color={colors.destructive} />
                  <Text style={[tw(text.xs), { color: colors.destructive }]}>
                    {user.flags_count} reports
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
              Joined {new Date(user.created_at).toLocaleDateString()}
              {user.last_seen && ` • Last seen ${new Date(user.last_seen).toLocaleDateString()}`}
            </Text>
          </View>
          
          {/* Quick Actions */}
          <View style={tw(layout.itemsCenter, spacing.gap(2))}>
            {user.status === 'active' ? (
              <>
                <TouchableOpacity
                  onPress={() => handleUserAction(user, 'suspend')}
                  style={[
                    tw(spacing.p(2), border.rounded),
                    { backgroundColor: '#f59e0b20' }
                  ]}
                >
                  <Ionicons name="pause" size={16} color="#f59e0b" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleUserAction(user, 'ban')}
                  style={[
                    tw(spacing.p(2), border.rounded),
                    { backgroundColor: colors.destructive + '20' }
                  ]}
                >
                  <Ionicons name="ban" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => handleUserAction(user, 'activate')}
                style={[
                  tw(spacing.p(2), border.rounded),
                  { backgroundColor: '#22c55e20' }
                ]}
              >
                <Ionicons name="checkmark" size={16} color="#22c55e" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={() => onUserPress?.(user)}
              style={[
                tw(spacing.p(2), border.rounded),
                { backgroundColor: colors.secondary }
              ]}
            >
              <Ionicons name="chevron-forward" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        {onBackPress && (
          <TouchableOpacity 
            onPress={onBackPress}
            style={tw(spacing.mr(3))}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
        
        <Text style={[tw(text.lg, text.semibold, layout.flex1), { color: colors.foreground }]}>
          User Management
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

      {/* Search Bar */}
      <View style={tw(spacing.p(4))}>
        <View style={[
          tw(layout.flexRow, layout.itemsCenter, spacing.px(3), spacing.py(2), border.rounded),
          { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }
        ]}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search users by name or email..."
            style={[
              tw(layout.flex1, spacing.ml(2)),
              { color: colors.foreground }
            ]}
            placeholderTextColor={colors.mutedForeground}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={tw(spacing.px(4), spacing.pb(4))}>
          <Card style={tw(spacing.p(4))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                Filters
              </Text>
              <Button variant="ghost" size="sm" onPress={clearFilters}>
                Clear All
              </Button>
            </View>

            {/* Role Filter */}
            <View style={tw(spacing.mb(3))}>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Role
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      onPress={() => setSelectedRole(role.id)}
                      style={[
                        tw(spacing.px(3), spacing.py(2), border.rounded),
                        {
                          backgroundColor: selectedRole === role.id 
                            ? colors.primary 
                            : colors.secondary,
                        }
                      ]}
                    >
                      <Text style={[
                        tw(text.sm),
                        { 
                          color: selectedRole === role.id 
                            ? colors.primaryForeground 
                            : colors.foreground 
                        }
                      ]}>
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Status Filter */}
            <View>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Status
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  {statuses.map((status) => (
                    <TouchableOpacity
                      key={status.id}
                      onPress={() => setSelectedStatus(status.id)}
                      style={[
                        tw(spacing.px(3), spacing.py(2), border.rounded),
                        {
                          backgroundColor: selectedStatus === status.id 
                            ? colors.primary 
                            : colors.secondary,
                        }
                      ]}
                    >
                      <Text style={[
                        tw(text.sm),
                        { 
                          color: selectedStatus === status.id 
                            ? colors.primaryForeground 
                            : colors.foreground 
                        }
                      ]}>
                        {status.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Card>
        </View>
      )}

      {/* Users List */}
      <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.px(4))}>
        {isLoading ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Loading users...
            </Text>
          </View>
        ) : users.length === 0 ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={[tw(text.lg, text.semibold, spacing.mt(3)), { color: colors.foreground }]}>
              No Users Found
            </Text>
            <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <>
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Showing {users.length} users
              </Text>
            </View>
            
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
            
            {hasNextPage && (
              <Button
                variant="outline"
                onPress={() => fetchNextPage()}
                loading={isFetchingNextPage}
                style={tw(spacing.my(4))}
              >
                Load More Users
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </MobileLayout>
  );
};