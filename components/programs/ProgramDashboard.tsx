import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { useProgramDashboard } from '@/hooks/use-program-management';
import { ProgramBuilder } from './ProgramBuilder';
import { ProgramAssignment, AssignmentCard } from './ProgramAssignment';
import { ProgramTemplate, ProgramAssignment as ProgramAssignmentType } from '@/services/program-service';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgramDashboardProps {
  coachId: string;
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
  onBack?: () => void;
}

export const ProgramDashboard: React.FC<ProgramDashboardProps> = ({
  coachId,
  clients,
  onBack,
}) => {
  const { colors } = useTheme();
  const [showProgramBuilder, setShowProgramBuilder] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramTemplate | null>(null);
  const [showAssignment, setShowAssignment] = useState(false);
  const [activeTab, setActiveTab] = useState<'programs' | 'assignments'>('programs');

  const {
    programs,
    assignments,
    recentAssignments,
    activeAssignments,
    pendingAssignments,
    stats,
    isLoading,
  } = useProgramDashboard(coachId);

  const tabs = [
    { id: 'programs', name: 'My Programs', icon: 'folder' },
    { id: 'assignments', name: 'Assignments', icon: 'people' },
  ];

  if (showProgramBuilder) {
    return (
      <ProgramBuilder
        existingProgram={selectedProgram || undefined}
        onSave={() => {
          setShowProgramBuilder(false);
          setSelectedProgram(null);
        }}
        onCancel={() => {
          setShowProgramBuilder(false);
          setSelectedProgram(null);
        }}
      />
    );
  }

  if (showAssignment && selectedProgram) {
    return (
      <ProgramAssignment
        program={selectedProgram}
        clients={clients}
        onAssign={() => {
          setShowAssignment(false);
          setSelectedProgram(null);
        }}
        onClose={() => {
          setShowAssignment(false);
          setSelectedProgram(null);
        }}
      />
    );
  }

  const ProgramCard: React.FC<{ program: ProgramTemplate }> = ({ program }) => (
    <Card elevation="sm" style={tw(spacing.mb(3))}>
      <View style={tw(spacing.p(4))}>
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(3))}>
          <View style={tw(layout.flex1)}>
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              {program.name}
            </Text>
            <Text 
              style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {program.description}
            </Text>
          </View>
          
          {program.is_featured && (
            <Ionicons name="star" size={16} color={colors.primary} />
          )}
        </View>

        {/* Program Meta */}
        <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3), spacing.mb(3))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
            <Ionicons name="time" size={14} color={colors.mutedForeground} />
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              {program.duration_weeks} weeks
            </Text>
          </View>

          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
            <Ionicons name="speedometer" size={14} color={colors.mutedForeground} />
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              {program.difficulty_level.charAt(0).toUpperCase() + program.difficulty_level.slice(1)}
            </Text>
          </View>

          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
            <Ionicons name="people" size={14} color={colors.mutedForeground} />
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              {program.enrollment_count} enrolled
            </Text>
          </View>

          {program.rating_average && (
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                {program.rating_average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={tw(layout.flexRow, spacing.gap(2))}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => {
              setSelectedProgram(program);
              setShowProgramBuilder(true);
            }}
            style={tw(layout.flex1)}
          >
            Edit
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onPress={() => {
              setSelectedProgram(program);
              setShowAssignment(true);
            }}
            style={tw(layout.flex1)}
          >
            Assign
          </Button>
        </View>

        {/* Price Badge */}
        <View style={[
          tw(layout.absolute, spacing.px(3), spacing.py(1), border.rounded),
          { 
            backgroundColor: program.price === 0 ? colors.primary : colors.destructive,
            top: 16,
            right: 16,
          }
        ]}>
          <Text style={[tw(text.xs, text.semibold), { color: colors.primaryForeground }]}>
            {program.price === 0 ? 'FREE' : `$${program.price}/mo`}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
        
        <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
          Program Management
        </Text>
        
        <TouchableOpacity onPress={() => setShowProgramBuilder(true)}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      {stats && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw(spacing.p(4), spacing.gap(3))}
        >
          <Card elevation="sm" style={tw(spacing.w(32))}>
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10'] as [string, string, ...string[]]}
              style={tw(spacing.p(4), border.rounded)}
            >
              <Ionicons name="folder" size={24} color={colors.primary} />
              <Text style={[tw(text['2xl'], text.bold, spacing.mt(2)), { color: colors.primary }]}>
                {stats.totalPrograms}
              </Text>
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                Total Programs
              </Text>
            </LinearGradient>
          </Card>

          <Card elevation="sm" style={tw(spacing.w(32))}>
            <LinearGradient
              colors={['#10B981' + '20', '#10B981' + '10'] as [string, string, ...string[]]}
              style={tw(spacing.p(4), border.rounded)}
            >
              <Ionicons name="people" size={24} color="#10B981" />
              <Text style={[tw(text['2xl'], text.bold, spacing.mt(2)), { color: '#10B981' }]}>
                {stats.activeAssignments}
              </Text>
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                Active Clients
              </Text>
            </LinearGradient>
          </Card>

          <Card elevation="sm" style={tw(spacing.w(32))}>
            <LinearGradient
              colors={['#F59E0B' + '20', '#F59E0B' + '10'] as [string, string, ...string[]]}
              style={tw(spacing.p(4), border.rounded)}
            >
              <Ionicons name="star" size={24} color="#F59E0B" />
              <Text style={[tw(text['2xl'], text.bold, spacing.mt(2)), { color: '#F59E0B' }]}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                Avg Rating
              </Text>
            </LinearGradient>
          </Card>

          <Card elevation="sm" style={tw(spacing.w(32))}>
            <LinearGradient
              colors={['#8B5CF6' + '20', '#8B5CF6' + '10'] as [string, string, ...string[]]}
              style={tw(spacing.p(4), border.rounded)}
            >
              <Ionicons name="trending-up" size={24} color="#8B5CF6" />
              <Text style={[tw(text['2xl'], text.bold, spacing.mt(2)), { color: '#8B5CF6' }]}>
                {stats.completionRate}%
              </Text>
              <Text style={[tw(text.sm), { color: colors.foreground }]}>
                Completion Rate
              </Text>
            </LinearGradient>
          </Card>
        </ScrollView>
      )}

      {/* Tabs */}
      <View style={tw(layout.flexRow, spacing.px(4), spacing.pb(3))}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[
              tw(layout.flex1, layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2), spacing.py(3), border.rounded),
              {
                backgroundColor: activeTab === tab.id ? colors.primary : colors.secondary,
              }
            ]}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={activeTab === tab.id ? colors.primaryForeground : colors.foreground} 
            />
            <Text style={[
              tw(text.sm, text.semibold),
              { color: activeTab === tab.id ? colors.primaryForeground : colors.foreground }
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
        {isLoading ? (
          <View style={tw(layout.itemsCenter, spacing.mt(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Loading programs...
            </Text>
          </View>
        ) : activeTab === 'programs' ? (
          programs.length > 0 ? (
            <>
              {programs.map((program: ProgramTemplate) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </>
          ) : (
            <Card elevation="sm">
              <View style={tw(spacing.p(6), layout.itemsCenter)}>
                <Ionicons name="folder-outline" size={48} color={colors.border} />
                <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.foreground }]}>
                  No programs yet
                </Text>
                <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  Create your first program to start helping clients
                </Text>
                <Button
                  variant="default"
                  size="sm"
                  onPress={() => setShowProgramBuilder(true)}
                  style={tw(spacing.mt(4))}
                >
                  Create Program
                </Button>
              </View>
            </Card>
          )
        ) : (
          // Assignments Tab
          <>
            {pendingAssignments.length > 0 && (
              <View style={tw(spacing.mb(4))}>
                <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                  Pending Assignments ({pendingAssignments.length})
                </Text>
                {pendingAssignments.map((assignment: ProgramAssignmentType) => (
                  <View key={assignment.id} style={tw(spacing.mb(3))}>
                    <AssignmentCard 
                      assignment={assignment}
                      onStatusUpdate={() => {}}
                      onViewDetails={() => {}}
                    />
                  </View>
                ))}
              </View>
            )}

            {activeAssignments.length > 0 && (
              <View style={tw(spacing.mb(4))}>
                <Text style={[tw(text.base, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                  Active Assignments ({activeAssignments.length})
                </Text>
                {activeAssignments.map((assignment: ProgramAssignmentType) => (
                  <View key={assignment.id} style={tw(spacing.mb(3))}>
                    <AssignmentCard 
                      assignment={assignment}
                      onStatusUpdate={() => {}}
                      onViewDetails={() => {}}
                    />
                  </View>
                ))}
              </View>
            )}

            {assignments.length === 0 && (
              <Card elevation="sm">
                <View style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Ionicons name="people-outline" size={48} color={colors.border} />
                  <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.foreground }]}>
                    No assignments yet
                  </Text>
                  <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
                    Assign programs to clients to start tracking their progress
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setShowProgramBuilder(true)}
        style={[
          tw(layout.absolute, spacing.w(16), spacing.h(16), layout.itemsCenter, layout.justifyCenter, border.rounded),
          {
            backgroundColor: colors.primary,
            bottom: 24,
            right: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }
        ]}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>
    </MobileLayout>
  );
};