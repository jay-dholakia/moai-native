import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { useAdminDashboard } from '@/hooks/use-admin-platform';
import { PlatformStats, SystemHealth } from '@/services/admin-service';

interface AdminDashboardProps {
  onUserManagementPress?: () => void;
  onContentModerationPress?: () => void;
  onAnalyticsPress?: () => void;
  onSystemHealthPress?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onUserManagementPress,
  onContentModerationPress,
  onAnalyticsPress,
  onSystemHealthPress,
}) => {
  const { colors } = useTheme();
  const { 
    platformStats, 
    systemHealth, 
    pendingReports, 
    activeAlerts,
    isLoading,
    refetch 
  } = useAdminDashboard();

  const stats = platformStats.data?.success ? platformStats.data.data : null;
  const health = systemHealth.data?.success ? systemHealth.data.data : null;
  const reports = pendingReports.data?.success ? pendingReports.data.data.reports : [];
  const alerts = activeAlerts.data?.success ? activeAlerts.data.data : [];

  const getHealthStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return colors.mutedForeground;
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    icon: string;
    color?: string;
    onPress?: () => void;
  }> = ({ title, value, subtitle, icon, color = colors.primary, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={tw(layout.flex1)}
    >
      <Card style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
          <View style={tw(layout.flex1)}>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {title}
            </Text>
            <Text style={[tw(text.xl, text.bold, spacing.mt(1)), { color: colors.foreground }]}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
            {subtitle && (
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                {subtitle}
              </Text>
            )}
          </View>
          <View style={[
            tw(spacing.w(12), spacing.h(12), layout.itemsCenter, layout.justifyCenter, border.rounded),
            { backgroundColor: color + '20' }
          ]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const QuickActionButton: React.FC<{
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
    badge?: number;
  }> = ({ title, icon, color, onPress, badge }) => (
    <TouchableOpacity onPress={onPress} style={tw(layout.flex1)}>
      <Card style={tw(spacing.p(4))}>
        <View style={tw(layout.itemsCenter, spacing.gap(3))}>
          <View style={tw(layout.relative)}>
            <View style={[
              tw(spacing.w(16), spacing.h(16), layout.itemsCenter, layout.justifyCenter, border.rounded),
              { backgroundColor: color + '20' }
            ]}>
              <Ionicons name={icon as any} size={32} color={color} />
            </View>
            {badge !== undefined && badge > 0 && (
              <View style={[
                tw(layout.absolute, spacing.w(6), spacing.h(6), layout.itemsCenter, layout.justifyCenter, border.rounded),
                {
                  backgroundColor: colors.destructive,
                  top: -2,
                  right: -2,
                }
              ]}>
                <Text style={[tw(text.xs, text.bold), { color: colors.destructiveForeground }]}>
                  {badge > 99 ? '99+' : badge}
                </Text>
              </View>
            )}
          </View>
          <Text style={[tw(text.sm, text.center, text.semibold), { color: colors.foreground }]}>
            {title}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          Admin Dashboard
        </Text>
        <TouchableOpacity
          onPress={refetch}
          style={[
            tw(spacing.p(2), border.rounded),
            { backgroundColor: colors.secondary }
          ]}
        >
          <Ionicons name="refresh" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={tw(layout.flex1)}
        contentContainerStyle={tw(spacing.p(4))}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* System Health Alert */}
        {health && health.status !== 'healthy' && (
          <Card style={[
            tw(spacing.p(4), spacing.mb(4)),
            { backgroundColor: getHealthStatusColor(health.status) + '10' }
          ]}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <Ionicons 
                name="warning" 
                size={24} 
                color={getHealthStatusColor(health.status)} 
              />
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  System Health: {health.status.toUpperCase()}
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  Response time: {health.response_time_avg}ms • Error rate: {health.error_rate}%
                </Text>
              </View>
              <TouchableOpacity onPress={onSystemHealthPress}>
                <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Key Statistics */}
        <View style={tw(spacing.mb(6))}> 
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Platform Overview
          </Text>
          
          <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(3))}>
            <StatCard
              title="Total Users"
              value={stats?.total_users || 0}
              subtitle={`+${stats?.new_users_today || 0} today`}
              icon="people"
              onPress={onUserManagementPress}
            />
            <StatCard
              title="Active Users"
              value={stats?.active_users_daily || 0}
              subtitle="last 24h"
              icon="pulse"
              color="#22c55e"
            />
          </View>

          <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(3))}>
            <StatCard
              title="Total MOAIs"
              value={stats?.total_moais || 0}
              subtitle={`${stats?.active_moais || 0} active`}
              icon="fitness"
              color="#8b5cf6"
            />
            <StatCard
              title="Workouts"
              value={stats?.workouts_today || 0}
              subtitle="today"
              icon="barbell"
              color="#f59e0b"
            />
          </View>

          <View style={tw(layout.flexRow, spacing.gap(3))}>
            <StatCard
              title="Messages"
              value={stats?.messages_today || 0}
              subtitle="today"
              icon="chatbubbles"
              color="#06b6d4"
            />
            <StatCard
              title="Reports"
              value={stats?.pending_reports || 0}
              subtitle="pending"
              icon="flag"
              color="#ef4444"
              onPress={onContentModerationPress}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={tw(spacing.mb(6))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Quick Actions
          </Text>
          
          <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(3))}>
            <QuickActionButton
              title="User Management"
              icon="people"
              color="#6366f1"
              onPress={onUserManagementPress || (() => {})}
            />
            <QuickActionButton
              title="Moderation"
              icon="shield-checkmark"
              color="#ef4444"
              onPress={onContentModerationPress || (() => {})}
              badge={stats?.pending_reports}
            />
          </View>

          <View style={tw(layout.flexRow, spacing.gap(3))}>
            <QuickActionButton
              title="Analytics"
              icon="analytics"
              color="#8b5cf6"
              onPress={onAnalyticsPress || (() => {})}
            />
            <QuickActionButton
              title="System Health"
              icon="pulse"
              color={getHealthStatusColor(health?.status || 'healthy')}
              onPress={onSystemHealthPress || (() => {})}
              badge={alerts.length}
            />
          </View>
        </View>

        {/* Recent Reports */}
        {reports.length > 0 && (
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Recent Reports
              </Text>
              <TouchableOpacity onPress={onContentModerationPress}>
                <Text style={[tw(text.sm), { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {reports.slice(0, 3).map((report) => (
              <Card key={report.id} style={tw(spacing.p(4), spacing.mb(2))}>
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                  <View style={tw(layout.flex1)}>
                    <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(1))}>
                      <View style={[
                        tw(spacing.px(2), spacing.py(1), border.rounded),
                        { backgroundColor: colors.destructive + '20' }
                      ]}>
                        <Text style={[tw(text.xs, text.semibold), { color: colors.destructive }]}>
                          {report.report_type.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[
                        tw(spacing.px(2), spacing.py(1), border.rounded),
                        { backgroundColor: colors.secondary }
                      ]}>
                        <Text style={[tw(text.xs), { color: colors.foreground }]}>
                          {report.content_type}
                        </Text>
                      </View>
                    </View>
                    <Text style={[tw(text.sm), { color: colors.foreground }]}>
                      {report.description}
                    </Text>
                    <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                      by {report.reporter_profile?.first_name} {report.reporter_profile?.last_name} • {new Date(report.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                System Alerts
              </Text>
              <TouchableOpacity onPress={onSystemHealthPress}>
                <Text style={[tw(text.sm), { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {alerts.slice(0, 3).map((alert) => {
              const severityColor = {
                info: '#06b6d4',
                warning: '#f59e0b',
                error: '#ef4444',
                critical: '#dc2626'
              }[alert.severity] || colors.mutedForeground;

              return (
                <Card key={alert.id} style={tw(spacing.p(4), spacing.mb(2))}>
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                    <Ionicons 
                      name="alert-circle" 
                      size={20} 
                      color={severityColor} 
                    />
                    <View style={tw(layout.flex1)}>
                      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(1))}>
                        <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                          {alert.title}
                        </Text>
                        <View style={[
                          tw(spacing.px(2), spacing.py(1), border.rounded),
                          { backgroundColor: severityColor + '20' }
                        ]}>
                          <Text style={[tw(text.xs, text.semibold), { color: severityColor }]}>
                            {alert.severity.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        {alert.description}
                      </Text>
                      <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                        {new Date(alert.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* System Status Summary */}
        {health && (
          <Card style={tw(spacing.p(4))}>
            <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
              System Status
            </Text>
            
            <View style={tw(spacing.gap(3))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  Uptime
                </Text>
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  {health.uptime_percentage}%
                </Text>
              </View>

              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  Response Time
                </Text>
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  {health.response_time_avg}ms
                </Text>
              </View>

              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  Storage Usage
                </Text>
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  {health.storage_usage.percentage.toFixed(1)}%
                </Text>
              </View>

              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  Active Connections
                </Text>
                <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                  {health.active_connections}
                </Text>
              </View>
            </View>

            <Button
              variant="outline"
              size="sm"
              onPress={onSystemHealthPress}
              style={tw(spacing.mt(4))}
            >
              View Full System Status
            </Button>
          </Card>
        )}
      </ScrollView>
    </MobileLayout>
  );
};