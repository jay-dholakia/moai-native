import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { 
  useInfiniteContentReports, 
  useResolveContentReport 
} from '@/hooks/use-admin-platform';
import { ContentReport } from '@/services/admin-service';

interface ContentModerationProps {
  adminId: string;
  onBackPress?: () => void;
}

export const ContentModeration: React.FC<ContentModerationProps> = ({
  adminId,
  onBackPress,
}) => {
  const { colors } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteContentReports({
    status: selectedStatus || undefined,
    priority: selectedPriority || undefined,
    content_type: selectedContentType || undefined,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const resolveReport = useResolveContentReport();

  const reports = data?.pages.flatMap(page => 
    page.success ? page.data.reports : []
  ) || [];

  const statuses = [
    { id: 'pending', name: 'Pending', color: '#f59e0b' },
    { id: 'investigating', name: 'Investigating', color: '#06b6d4' },
    { id: 'resolved', name: 'Resolved', color: '#22c55e' },
    { id: 'dismissed', name: 'Dismissed', color: '#6b7280' },
    { id: '', name: 'All Statuses', color: colors.mutedForeground },
  ];

  const priorities = [
    { id: '', name: 'All Priorities' },
    { id: 'urgent', name: 'Urgent', color: '#dc2626' },
    { id: 'high', name: 'High', color: '#ef4444' },
    { id: 'medium', name: 'Medium', color: '#f59e0b' },
    { id: 'low', name: 'Low', color: '#22c55e' },
  ];

  const contentTypes = [
    { id: '', name: 'All Content' },
    { id: 'profile', name: 'Profile' },
    { id: 'message', name: 'Message' },
    { id: 'post', name: 'Post' },
    { id: 'workout', name: 'Workout' },
    { id: 'comment', name: 'Comment' },
    { id: 'image', name: 'Image' },
  ];

  const reportTypes = [
    { id: 'spam', name: 'Spam', icon: 'ban', color: '#ef4444' },
    { id: 'harassment', name: 'Harassment', icon: 'shield', color: '#dc2626' },
    { id: 'inappropriate', name: 'Inappropriate', icon: 'warning', color: '#f59e0b' },
    { id: 'fake', name: 'Fake Content', icon: 'eye-off', color: '#8b5cf6' },
    { id: 'violence', name: 'Violence', icon: 'alert-circle', color: '#dc2626' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6b7280' },
  ];

  const clearFilters = () => {
    setSelectedStatus('pending');
    setSelectedPriority('');
    setSelectedContentType('');
  };

  const handleResolveReport = (report: ContentReport, action: 'dismiss' | 'remove_content' | 'warn_user' | 'suspend_user') => {
    const actionText = {
      dismiss: 'dismiss this report',
      remove_content: 'remove the reported content',
      warn_user: 'warn the reported user',
      suspend_user: 'suspend the reported user'
    }[action];

    Alert.alert(
      'Resolve Report',
      `Are you sure you want to ${actionText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'suspend_user' ? 'destructive' : 'default',
          onPress: () => {
            resolveReport.mutate({
              reportId: report.id,
              adminId,
              action,
              notes: `Report ${action.replace('_', ' ')} by admin`
            });
            setShowReportDetail(false);
          }
        }
      ]
    );
  };

  const getStatusColor = (status: ContentReport['status']) => {
    const statusItem = statuses.find(s => s.id === status);
    return statusItem?.color || colors.mutedForeground;
  };

  const getPriorityColor = (priority: ContentReport['priority']) => {
    const priorityItem = priorities.find(p => p.id === priority);
    return priorityItem?.color || colors.mutedForeground;
  };

  const getReportTypeInfo = (reportType: ContentReport['report_type']) => {
    return reportTypes.find(t => t.id === reportType) || reportTypes[reportTypes.length - 1];
  };

  const ReportCard: React.FC<{ report: ContentReport }> = ({ report }) => {
    const statusColor = getStatusColor(report.status);
    const priorityColor = getPriorityColor(report.priority);
    const reportTypeInfo = getReportTypeInfo(report.report_type);

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedReport(report);
          setShowReportDetail(true);
        }}
        style={tw(spacing.mb(3))}
      >
        <Card style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
            <Avatar
              size="sm"
              source={(report.reporter_profile as any)?.avatar_url ? { uri: (report.reporter_profile as any).avatar_url } : undefined}
              fallback={`${report.reporter_profile?.first_name?.[0]}${report.reporter_profile?.last_name?.[0]}`}
            />
            
            <View style={tw(layout.flex1)}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(1))}>
                {/* Report Type */}
                <View style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.gap(1), spacing.px(2), spacing.py(1), border.rounded),
                  { backgroundColor: reportTypeInfo.color + '20' }
                ]}>
                  <Ionicons name={reportTypeInfo.icon as any} size={12} color={reportTypeInfo.color} />
                  <Text style={[tw(text.xs, text.semibold), { color: reportTypeInfo.color }]}>
                    {reportTypeInfo.name.toUpperCase()}
                  </Text>
                </View>
                
                {/* Priority */}
                <View style={[
                  tw(spacing.px(2), spacing.py(1), border.rounded),
                  { backgroundColor: priorityColor + '20' }
                ]}>
                  <Text style={[tw(text.xs, text.semibold), { color: priorityColor }]}>
                    {report.priority.toUpperCase()}
                  </Text>
                </View>
                
                {/* Status */}
                <View style={[
                  tw(spacing.px(2), spacing.py(1), border.rounded),
                  { backgroundColor: statusColor + '20' }
                ]}>
                  <Text style={[tw(text.xs, text.semibold), { color: statusColor }]}>
                    {report.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={[tw(text.sm, spacing.mb(1)), { color: colors.foreground }]} numberOfLines={2}>
                {report.description}
              </Text>
              
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  by {report.reporter_profile?.first_name} {report.reporter_profile?.last_name}
                </Text>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  against {report.reported_user_profile?.first_name} {report.reported_user_profile?.last_name}
                </Text>
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {report.content_type}
                </Text>
              </View>
              
              <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                {new Date(report.created_at).toLocaleString()}
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const ReportDetailModal: React.FC = () => {
    if (!selectedReport) return null;

    const statusColor = getStatusColor(selectedReport.status);
    const priorityColor = getPriorityColor(selectedReport.priority);
    const reportTypeInfo = getReportTypeInfo(selectedReport.report_type);

    return (
      <Modal
        visible={showReportDetail}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowReportDetail(false)}
      >
        <MobileLayout safeArea padding={false}>
          {/* Header */}
          <View style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
            { borderBottomColor: colors.border }
          ]}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Report Details
            </Text>
            <TouchableOpacity onPress={() => setShowReportDetail(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
            {/* Report Info */}
            <Card style={tw(spacing.p(4), spacing.mb(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(3))}>
                <View style={[
                  tw(layout.flexRow, layout.itemsCenter, spacing.gap(1), spacing.px(2), spacing.py(1), border.rounded),
                  { backgroundColor: reportTypeInfo.color + '20' }
                ]}>
                  <Ionicons name={reportTypeInfo.icon as any} size={16} color={reportTypeInfo.color} />
                  <Text style={[tw(text.sm, text.semibold), { color: reportTypeInfo.color }]}>
                    {reportTypeInfo.name}
                  </Text>
                </View>
                
                <View style={[
                  tw(spacing.px(2), spacing.py(1), border.rounded),
                  { backgroundColor: priorityColor + '20' }
                ]}>
                  <Text style={[tw(text.sm, text.semibold), { color: priorityColor }]}>
                    {selectedReport.priority.toUpperCase()}
                  </Text>
                </View>
                
                <View style={[
                  tw(spacing.px(2), spacing.py(1), border.rounded),
                  { backgroundColor: statusColor + '20' }
                ]}>
                  <Text style={[tw(text.sm, text.semibold), { color: statusColor }]}>
                    {selectedReport.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[tw(text.base, spacing.mb(3)), { color: colors.foreground }]}>
                {selectedReport.description}
              </Text>

              <View style={tw(spacing.gap(2))}>
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>Content Type</Text>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    {selectedReport.content_type}
                  </Text>
                </View>
                
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>Reported</Text>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Reporter Info */}
            <Card style={tw(spacing.p(4), spacing.mb(4))}>
              <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                Reporter
              </Text>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Avatar
                  size="md"
                  source={(selectedReport.reporter_profile as any)?.avatar_url ? { uri: (selectedReport.reporter_profile as any).avatar_url } : undefined}
                  fallback={`${selectedReport.reporter_profile?.first_name?.[0]}${selectedReport.reporter_profile?.last_name?.[0]}`}
                />
                <View>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {selectedReport.reporter_profile?.first_name} {selectedReport.reporter_profile?.last_name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Reporter ID: {selectedReport.reporter_id}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Reported User Info */}
            <Card style={tw(spacing.p(4), spacing.mb(4))}>
              <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                Reported User
              </Text>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Avatar
                  size="md"
                  source={(selectedReport.reported_user_profile as any)?.avatar_url ? { uri: (selectedReport.reported_user_profile as any).avatar_url } : undefined}
                  fallback={`${selectedReport.reported_user_profile?.first_name?.[0]}${selectedReport.reported_user_profile?.last_name?.[0]}`}
                />
                <View>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {selectedReport.reported_user_profile?.first_name} {selectedReport.reported_user_profile?.last_name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    User ID: {selectedReport.reported_user_id}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Resolution Notes */}
            {selectedReport.resolution_notes && (
              <Card style={tw(spacing.p(4), spacing.mb(4))}>
                <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                  Resolution Notes
                </Text>
                <Text style={[tw(text.sm), { color: colors.foreground }]}>
                  {selectedReport.resolution_notes}
                </Text>
                {selectedReport.resolved_at && (
                  <Text style={[tw(text.xs, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    Resolved on {new Date(selectedReport.resolved_at).toLocaleString()}
                  </Text>
                )}
              </Card>
            )}

            {/* Actions */}
            {selectedReport.status === 'pending' && (
              <View style={tw(spacing.gap(3))}>
                <Button
                  variant="destructive"
                  onPress={() => handleResolveReport(selectedReport, 'suspend_user')}
                  loading={resolveReport.isPending}
                >
                  Suspend User
                </Button>
                
                <Button
                  variant="outline"
                  onPress={() => handleResolveReport(selectedReport, 'warn_user')}
                  loading={resolveReport.isPending}
                >
                  Warn User
                </Button>
                
                <Button
                  variant="outline"
                  onPress={() => handleResolveReport(selectedReport, 'remove_content')}
                  loading={resolveReport.isPending}
                >
                  Remove Content
                </Button>
                
                <Button
                  variant="ghost"
                  onPress={() => handleResolveReport(selectedReport, 'dismiss')}
                  loading={resolveReport.isPending}
                >
                  Dismiss Report
                </Button>
              </View>
            )}
          </ScrollView>
        </MobileLayout>
      </Modal>
    );
  };

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
          Content Moderation
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

      {/* Status Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw(border.borderB)} contentContainerStyle={tw(spacing.px(4))}>
        <View style={tw(layout.flexRow, spacing.gap(2), spacing.py(3))}>
          {statuses.slice(0, -1).map((status) => (
            <TouchableOpacity
              key={status.id}
              onPress={() => setSelectedStatus(status.id)}
              style={[
                tw(spacing.px(4), spacing.py(2), border.rounded),
                {
                  backgroundColor: selectedStatus === status.id 
                    ? status.color + '20'
                    : colors.secondary,
                  borderWidth: 1,
                  borderColor: selectedStatus === status.id 
                    ? status.color
                    : colors.border,
                }
              ]}
            >
              <Text style={[
                tw(text.sm, text.semibold),
                { 
                  color: selectedStatus === status.id 
                    ? status.color
                    : colors.foreground 
                }
              ]}>
                {status.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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

            {/* Priority Filter */}
            <View style={tw(spacing.mb(3))}>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Priority
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  {priorities.map((priority) => (
                    <TouchableOpacity
                      key={priority.id}
                      onPress={() => setSelectedPriority(priority.id)}
                      style={[
                        tw(spacing.px(3), spacing.py(2), border.rounded),
                        {
                          backgroundColor: selectedPriority === priority.id 
                            ? colors.primary 
                            : colors.secondary,
                        }
                      ]}
                    >
                      <Text style={[
                        tw(text.sm),
                        { 
                          color: selectedPriority === priority.id 
                            ? colors.primaryForeground 
                            : colors.foreground 
                        }
                      ]}>
                        {priority.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Content Type Filter */}
            <View>
              <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Content Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={tw(layout.flexRow, spacing.gap(2))}>
                  {contentTypes.map((contentType) => (
                    <TouchableOpacity
                      key={contentType.id}
                      onPress={() => setSelectedContentType(contentType.id)}
                      style={[
                        tw(spacing.px(3), spacing.py(2), border.rounded),
                        {
                          backgroundColor: selectedContentType === contentType.id 
                            ? colors.primary 
                            : colors.secondary,
                        }
                      ]}
                    >
                      <Text style={[
                        tw(text.sm),
                        { 
                          color: selectedContentType === contentType.id 
                            ? colors.primaryForeground 
                            : colors.foreground 
                        }
                      ]}>
                        {contentType.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Card>
        </View>
      )}

      {/* Reports List */}
      <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.px(4))}>
        {isLoading ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Loading reports...
            </Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.mutedForeground} />
            <Text style={[tw(text.lg, text.semibold, spacing.mt(3)), { color: colors.foreground }]}>
              No Reports Found
            </Text>
            <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              {selectedStatus === 'pending' 
                ? 'All reports have been resolved'
                : 'Try adjusting your filters'
              }
            </Text>
          </View>
        ) : (
          <>
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                Showing {reports.length} reports
              </Text>
            </View>
            
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
            
            {hasNextPage && (
              <Button
                variant="outline"
                onPress={() => fetchNextPage()}
                loading={isFetchingNextPage}
                style={tw(spacing.my(4))}
              >
                Load More Reports
              </Button>
            )}
          </>
        )}
      </ScrollView>

      <ReportDetailModal />
    </MobileLayout>
  );
};