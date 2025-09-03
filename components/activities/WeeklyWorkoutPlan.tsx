import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
// Date utility functions will be implemented inline
import { ChevronDown, ChevronRight, Users, Calendar, Play, Check, Clock, Target } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';

interface WorkoutSession {
  id: string;
  order: number;
  title: string;
  isCompleted: boolean;
  workoutId?: string;
  completionId?: string;
  programWeekId?: string;
  estimatedDuration?: number;
  exerciseCount?: number;
}

interface WorkoutProgram {
  id: string;
  title: string;
  description: string;
  weeks: number;
  currentWeek: number;
}

interface MemberCompletion {
  user_id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  completed_at: string;
}

interface WorkoutPlanProps {
  compact?: boolean;
}

export const WeeklyWorkoutPlan: React.FC<WorkoutPlanProps> = ({
  compact = true
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

  // Mock data - would be replaced with actual hooks
  const [userProgram] = useState<WorkoutProgram | null>({
    id: '1',
    title: 'Beginner Strength Training',
    description: '12-week strength building program',
    weeks: 12,
    currentWeek: 1
  });

  const [weekWorkouts] = useState<WorkoutSession[]>([
    {
      id: '1',
      order: 1,
      title: 'Upper Body Strength',
      isCompleted: true,
      workoutId: 'workout-1',
      estimatedDuration: 45,
      exerciseCount: 6
    },
    {
      id: '2', 
      order: 2,
      title: 'Lower Body Power',
      isCompleted: false,
      workoutId: 'workout-2',
      estimatedDuration: 50,
      exerciseCount: 8
    },
    {
      id: '3',
      order: 3,
      title: 'Full Body Circuit',
      isCompleted: false,
      workoutId: 'workout-3',
      estimatedDuration: 40,
      exerciseCount: 10
    }
  ]);

  const [memberCompletions] = useState<Record<string, MemberCompletion[]>>({
    '1': [
      {
        user_id: 'user1',
        first_name: 'John',
        last_name: 'Doe',
        avatar_url: undefined,
        completed_at: '2024-01-15T10:30:00Z'
      },
      {
        user_id: 'user2', 
        first_name: 'Jane',
        last_name: 'Smith',
        avatar_url: undefined,
        completed_at: '2024-01-15T14:20:00Z'
      }
    ],
    '2': [],
    '3': []
  });

  // Get current week info with inline date calculations
  const currentWeek = new Date();
  const weekStart = new Date(currentWeek);
  const dayOfWeek = weekStart.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const toggleWorkoutExpansion = (workoutId: string) => {
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  const handleStartWorkout = (workoutId: string, title: string) => {
    // Navigate to workout execution
    Alert.alert('Start Workout', `Starting "${title}" - Workout execution coming soon!`);
  };

  const handleMarkComplete = (workoutId: string, title: string) => {
    Alert.alert('Mark Complete', `Mark "${title}" as completed manually?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Complete', 
        onPress: () => {
          // TODO: Implement workout completion
          Alert.alert('Success', 'Workout marked as complete!');
        }
      }
    ]);
  };

  const renderMemberCompletionAvatars = (workoutId: string) => {
    const completions = memberCompletions[workoutId] || [];
    
    if (completions.length === 0) {
      return (
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
          <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
            No completions yet
          </Text>
        </View>
      );
    }

    return (
      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
        <View style={tw(layout.flexRow, spacing.gap(1))}>
          {completions.slice(0, 3).map((completion, index) => (
            <Avatar
              key={completion.user_id}
              source={completion.avatar_url ? { uri: completion.avatar_url } : undefined}
              fallback={completion.first_name?.charAt(0) || '?'}
              size="sm"
            />
          ))}
        </View>
        
        {completions.length > 3 && (
          <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
            +{completions.length - 3}
          </Text>
        )}
        
        <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
          completed
        </Text>
      </View>
    );
  };

  if (!userProgram) {
    return (
      <Card style={tw(spacing.mb(4))}>
        <CardContent style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(3))}>
            <Target size={18} color={colors.mutedForeground} />
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              Weekly Workout Plan
            </Text>
          </View>
          
          <Text style={[tw(text.sm, spacing.mb(4)), { color: colors.mutedForeground }]}>
            Join a workout program to get structured weekly workout plans and track your progress with others.
          </Text>
          
          <Button
            variant="outline" 
            size="sm"
            onPress={() => {
              // Navigate to program marketplace
              Alert.alert('Programs', 'Workout program marketplace coming soon!');
            }}
          >
            <Text style={tw(text.sm)}>Browse Programs</Text>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={tw(spacing.mb(4))}>
      <CardHeader>
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
          <View style={tw(layout.flex1)}>
            <CardTitle style={tw(text.base)}>{userProgram.title}</CardTitle>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Week {userProgram.currentWeek} of {userProgram.weeks} • {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              // Navigate to program details
              Alert.alert('Program Details', 'Program overview coming soon!');
            }}
          >
            <ChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </CardHeader>
      
      <CardContent>
        {/* Progress Overview */}
        <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(4))}>
          <View style={tw(layout.itemsCenter)}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              {weekWorkouts.filter(w => w.isCompleted).length}
            </Text>
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              Completed
            </Text>
          </View>
          
          <View style={tw(layout.itemsCenter)}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.primary }]}>
              {weekWorkouts.length}
            </Text>
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              Total
            </Text>
          </View>
          
          <View style={tw(layout.itemsCenter)}>
            <Text style={[tw(text.lg, text.semibold), { color: '#F59E0B' }]}>
              {weekWorkouts.reduce((sum, w) => sum + (w.estimatedDuration || 0), 0)}m
            </Text>
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              Total Time
            </Text>
          </View>
        </View>

        {/* Workout List */}
        <View style={tw(spacing.gap(2))}>
          {weekWorkouts.map((workout, index) => {
            const isExpanded = expandedWorkouts.has(workout.id);
            
            return (
              <Card key={workout.id} elevation="sm">
                <TouchableOpacity
                  onPress={() => toggleWorkoutExpansion(workout.id)}
                  activeOpacity={0.7}
                >
                  <View style={tw(spacing.p(3))}>
                    <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(2))}>
                      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                        <View 
                          style={[
                            tw(spacing.w(8), spacing.h(8), border.rounded, layout.itemsCenter, layout.justifyCenter),
                            {
                              backgroundColor: workout.isCompleted 
                                ? colors.success || '#10B981'
                                : colors.muted
                            }
                          ]}
                        >
                          {workout.isCompleted ? (
                            <Check size={16} color="#FFFFFF" />
                          ) : (
                            <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                              {workout.order}
                            </Text>
                          )}
                        </View>
                        
                        <View style={tw(layout.flex1)}>
                          <Text style={[
                            tw(text.sm, text.semibold),
                            { 
                              color: workout.isCompleted 
                                ? colors.mutedForeground 
                                : colors.foreground,
                              textDecorationLine: workout.isCompleted ? 'line-through' : 'none'
                            }
                          ]}>
                            {workout.title}
                          </Text>
                          
                          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mt(1))}>
                            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                              <Clock size={12} color={colors.mutedForeground} />
                              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                                {workout.estimatedDuration}m
                              </Text>
                            </View>
                            
                            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                              <Target size={12} color={colors.mutedForeground} />
                              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                                {workout.exerciseCount} exercises
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      
                      <TouchableOpacity onPress={() => toggleWorkoutExpansion(workout.id)}>
                        <View style={tw(spacing.p(1))}>
                          {isExpanded ? (
                            <ChevronDown size={16} color={colors.mutedForeground} />
                          ) : (
                            <ChevronRight size={16} color={colors.mutedForeground} />
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Member Completions */}
                    <View style={tw(spacing.mb(2))}>
                      {renderMemberCompletionAvatars(workout.id)}
                    </View>

                    {/* Workout Actions */}
                    {!workout.isCompleted && (
                      <View style={tw(layout.flexRow, spacing.gap(2))}>
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={() => handleStartWorkout(workout.workoutId || '', workout.title)}
                          style={tw(layout.flex1)}
                        >
                          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                            <Play size={12} color={colors.primary} />
                            <Text style={[tw(text.xs), { color: colors.primary }]}>
                              Start
                            </Text>
                          </View>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => handleMarkComplete(workout.workoutId || '', workout.title)}
                        >
                          <Text style={tw(text.xs)}>Mark Complete</Text>
                        </Button>
                      </View>
                    )}

                    {/* Expanded Content */}
                    {isExpanded && (
                      <View style={[tw(spacing.mt(3), spacing.pt(3)), { borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <Text style={[tw(text.sm), { color: colors.foreground }]}>
                          Workout Details
                        </Text>
                        <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                          Full workout breakdown and exercise details coming soon!
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
};

export default WeeklyWorkoutPlan;