import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

interface ActivityCategory {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  color?: string;
}

interface ProfileStatsTabProps {
  view?: 'weekly' | 'monthly';
  totalActivities: number;
  workoutsCompleted: number;
  milesMoved: number;
  minutesMoved: number;
  currentStreak: number;
  activityCategories: ActivityCategory[];
  onViewChange?: (view: 'weekly' | 'monthly') => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, color }) => {
  const { theme, colors } = useTheme();
  
  return (
    <View
      style={[
        tw(spacing.p(4), border.rounded, layout.flex1),
        { 
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }
      ]}
    >
      <Text style={tw(text.sm, text.muted(theme), spacing.mb(1))}>
        {title}
      </Text>
      <Text 
        style={[
          tw(text['2xl'], text.bold, spacing.mb(1)), 
          { color: color || colors.foreground }
        ]}
      >
        {value}
      </Text>
      <Text style={tw(text.xs, text.muted(theme))}>
        {description}
      </Text>
    </View>
  );
};

const CategoryBar: React.FC<{ category: ActivityCategory }> = ({ category }) => {
  const { colors } = useTheme();
  
  return (
    <View style={tw(spacing.mb(3))}>
      <View style={tw(layout.flexRow, layout.justifyBetween, spacing.mb(1))}>
        <Text style={[tw(text.sm, text.bold), { color: colors.foreground }]}>
          {category.name}
        </Text>
        <Text style={tw(text.sm, text.muted)}>
          {category.value} activities
        </Text>
      </View>
      <View
        style={[
          tw(spacing.h(2), border.rounded),
          { backgroundColor: colors.muted, opacity: 0.2 }
        ]}
      >
        <View
          style={[
            tw(spacing.h(2), border.rounded),
            {
              width: `${category.percentage}%`,
              backgroundColor: category.color,
            }
          ]}
        />
      </View>
    </View>
  );
};

export const ProfileStatsTab: React.FC<ProfileStatsTabProps> = ({
  view = 'weekly',
  totalActivities,
  workoutsCompleted,
  milesMoved,
  minutesMoved,
  currentStreak,
  activityCategories,
  onViewChange,
}) => {
  const { theme, colors } = useTheme();

  const handleViewToggle = (newView: 'weekly' | 'monthly') => {
    onViewChange?.(newView);
  };

  return (
    <ScrollView
      style={tw(layout.flex1)}
      contentContainerStyle={tw(spacing.p(4))}
      showsVerticalScrollIndicator={false}
    >
      {/* View Toggle */}
      <View style={tw(layout.flexRow, spacing.mb(6))}>
        <TouchableOpacity
          style={[
            tw(
              spacing.px(4),
              spacing.py(2),
              border.rounded,
              layout.flex1,
              layout.itemsCenter,
              spacing.mr(2)
            ),
            {
              backgroundColor: view === 'weekly' ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: view === 'weekly' ? colors.primary : colors.border,
            }
          ]}
          onPress={() => handleViewToggle('weekly')}
        >
          <Text
            style={[
              tw(text.sm, text.medium),
              { 
                color: view === 'weekly' 
                  ? colors.primaryForeground 
                  : colors.foreground 
              }
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            tw(
              spacing.px(4),
              spacing.py(2),
              border.rounded,
              layout.flex1,
              layout.itemsCenter,
              spacing.ml(2)
            ),
            {
              backgroundColor: view === 'monthly' ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: view === 'monthly' ? colors.primary : colors.border,
            }
          ]}
          onPress={() => handleViewToggle('monthly')}
        >
          <Text
            style={[
              tw(text.sm, text.medium),
              { 
                color: view === 'monthly' 
                  ? colors.primaryForeground 
                  : colors.foreground 
              }
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={tw(spacing.mb(6))}>
        <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(3))}>
          <StatCard
            title="Activities"
            value={totalActivities}
            description={`${view === 'weekly' ? 'This week' : 'This month'}`}
            color={colors.primary}
          />
          <StatCard
            title="Workouts"
            value={workoutsCompleted}
            description={`${view === 'weekly' ? 'This week' : 'This month'}`}
            color={colors.primary}
          />
        </View>
        <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(3))}>
          <StatCard
            title="Miles"
            value={milesMoved.toFixed(1)}
            description="Distance moved"
            color={colors.secondary}
          />
          <StatCard
            title="Minutes"
            value={minutesMoved}
            description="Time active"
            color={colors.secondary}
          />
        </View>
        <View style={tw(layout.flexRow, spacing.gap(3))}>
          <StatCard
            title="Streak"
            value={currentStreak}
            description="Week streak"
            color={colors.accent}
          />
          <View style={tw(layout.flex1)} />
        </View>
      </View>

      {/* Activity Category Distribution */}
      {activityCategories.length > 0 && (
        <View
          style={[
            tw(spacing.p(4), border.rounded, spacing.mb(4)),
            { 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }
          ]}
        >
          <Text style={tw(text.lg, text.semibold, text.foreground(theme), spacing.mb(1))}>
            Activity Categories
          </Text>
          <Text style={tw(text.sm, text.muted(theme), spacing.mb(4))}>
            Breakdown of activity types {view === 'weekly' ? 'this week' : 'this month'}
          </Text>
          
          {activityCategories.map((category, index) => (
            <CategoryBar key={index} category={category} />
          ))}
        </View>
      )}

      {/* Weekly Goals Info */}
      <View
        style={[
          tw(spacing.p(4), border.rounded),
          { 
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: 0.1,
          }
        ]}
      >
        <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
          💡 Track Your Progress
        </Text>
        <Text style={tw(text.xs, text.muted(theme))}>
          Set weekly activity goals and maintain your streak to earn badges and tokens. 
          Stay consistent to unlock achievements and climb the leaderboards!
        </Text>
      </View>
    </ScrollView>
  );
};