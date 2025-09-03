import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Zap, Target, Activity, Home, Users as UsersIcon, TrendingUp, Flame, Heart, Trophy, UserPlus } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/use-profile';
import { useMoais, useUserMoais } from '@/hooks/use-moai';
import { useActivityStats } from '@/hooks/use-activities';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, bg, layout, border } from '@/utils/styles';
import { InstagramFonts } from '@/constants/FontConfig';
import { InstagramColors } from '@/constants/InstagramTheme';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { AppHeader } from '@/components/ui/AppHeader';
import { ActivityForm } from '@/components/activities/ActivityForm';

export default function HomeScreen() {
  const { user } = useAuth();
  const { userProfile } = useProfile();
  const { userMoais } = useUserMoais();
  const { data: activityStats, refetch: refetchStats } = useActivityStats();
  const { theme, colors } = useTheme();
  
  const [refreshing, setRefreshing] = React.useState(false);
  const [showActivityForm, setShowActivityForm] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchStats();
    } finally {
      setRefreshing(false);
    }
  }, [refetchStats]);

  const stats = activityStats?.success ? activityStats.data : null;
  const primaryMoai = userMoais?.pages?.[0]?.data?.[0];

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'log-activity':
        setShowActivityForm(true);
        break;
      case 'join-moai':
        // TODO: Navigate to moai discovery
        break;
      case 'view-progress':
        // TODO: Navigate to progress/analytics
        break;
      case 'schedule':
        // TODO: Navigate to calendar/schedule
        break;
    }
  };

  const quickActions = [
    { 
      id: 'log-activity', 
      title: 'Log Workout', 
      icon: 'plus', 
      color: InstagramColors.light.primary,
      gradient: InstagramColors.gradients.accent as [string, string, ...string[]]
    },
    { 
      id: 'join-moai', 
      title: 'Find Friends', 
      icon: 'user-plus', 
      color: InstagramColors.moai.purple,
      gradient: InstagramColors.gradients.cool as [string, string, ...string[]]
    },
    { 
      id: 'view-progress', 
      title: 'Your Progress', 
      icon: 'trending-up', 
      color: InstagramColors.moai.orange,
      gradient: InstagramColors.gradients.warm as [string, string, ...string[]]
    },
    { 
      id: 'streak', 
      title: 'Keep Streak', 
      icon: 'flame', 
      color: InstagramColors.interactive.like,
      gradient: [InstagramColors.interactive.like, InstagramColors.moai.coral] as [string, string, ...string[]]
    },
  ];

  const dashboardStats = [
    { 
      label: 'Streak', 
      value: (stats?.current_streak_days || 0).toString(), 
      unit: 'days', 
      icon: 'flame', 
      color: InstagramColors.moai.orange 
    },
    { 
      label: 'Workouts', 
      value: (stats?.activities_this_week || 0).toString(), 
      unit: 'this week', 
      icon: 'activity', 
      color: InstagramColors.light.success 
    },
    { 
      label: 'Friends', 
      value: (userMoais?.pages?.[0]?.data?.length || 0).toString(), 
      unit: 'in groups', 
      icon: 'heart', 
      color: InstagramColors.light.primary 
    },
    { 
      label: 'Hours', 
      value: Math.round((stats?.total_duration_minutes || 0) / 60).toString(), 
      unit: 'total', 
      icon: 'trophy.fill', 
      color: InstagramColors.moai.purple 
    },
  ];

  return (
    <MobileLayout scrollable={false} safeArea={true} padding={false}>
      <AppHeader 
        title="Home" 
        showProfile={true}
        rightAction={{
          icon: () => <Plus size={20} color={colors.foreground} />,
          onPress: () => setShowActivityForm(true),
          label: 'Log activity'
        }}
      />
      <ScrollView 
        style={tw(layout.flex1)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={theme === 'dark' ? ['#1A1A1A', '#111827'] : ['#FAFAFA', '#F3F4F6']}
          style={tw(spacing.pt(16), spacing.pb(8), spacing.px(6))}
        >
          <Animated.View 
            style={[
              tw(layout.flexRow, layout.itemsCenter, spacing.mb(6)),
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Avatar
              size="lg"
              source={userProfile.data?.profile_image ? { uri: userProfile.data.profile_image } : undefined}
              fallback={userProfile.data?.first_name?.[0] || user?.email?.[0] || 'U'}
              style={tw(spacing.mr(4))}
            />
            <View style={tw(layout.flex1)}>
              <Text style={[
                tw(text['2xl'], text.bold), 
                { 
                  color: colors.foreground,
                  fontFamily: InstagramFonts.family.display,
                  letterSpacing: -0.02
                }
              ]}>
                Welcome back{userProfile.data?.first_name ? `, ${userProfile.data.first_name}` : ''}!
              </Text>
              <Text style={[
                tw(text.base), 
                { 
                  color: colors.mutedForeground,
                  fontFamily: InstagramFonts.family.primary,
                  lineHeight: 24
                }
              ]}>
                Ready to crush your goals today?
              </Text>
            </View>
            <Badge variant="outline" style={tw(spacing.px(3), spacing.py(1))}>
              <Zap size={12} color={colors.primary} />
              <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.primary }]}>
                {stats?.total_activities || 0} activities
              </Text>
            </Badge>
          </Animated.View>

          {/* Daily Goal Progress */}
          <Animated.View 
            style={[
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Card elevation="lg" style={tw(spacing.mb(6))}>
              <CardContent style={tw(spacing.p(6))}>
                <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
                  <Text style={[
                    tw(text.lg, text.semibold), 
                    { 
                      color: colors.foreground,
                      fontFamily: InstagramFonts.family.primary,
                      fontWeight: '600'
                    }
                  ]}>
                    Today's Goal
                  </Text>
                  <Target size={20} color={colors.primary} />
                </View>
                
                <View style={tw(spacing.mb(3))}>
                  <View style={[
                    tw(spacing.h(3), border.rounded),
                    { backgroundColor: colors.muted }
                  ]}>
                    <View style={[
                      tw(spacing.h(3), border.rounded),
                      { 
                        backgroundColor: colors.primary,
                        width: '75%' // 75% progress
                      }
                    ]} />
                  </View>
                </View>
                
                <View style={tw(layout.flexRow, layout.justifyBetween)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    30 minutes activity
                  </Text>
                  <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                    75% complete
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Animated.View>
        </LinearGradient>

        <View style={tw(spacing.px(6))}>
          {/* Quick Actions Grid */}
          <View style={tw(spacing.mb(8))}>
            <Text style={[
              tw(text.xl, text.semibold, spacing.mb(4)), 
              { 
                color: colors.foreground,
                fontFamily: InstagramFonts.family.display,
                fontWeight: '600'
              }
            ]}>
              Quick Actions
            </Text>
            
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3))}>
              {quickActions.map((action, index) => (
                <Animated.View
                  key={action.id}
                  style={[
                    { 
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      tw(spacing.p(4), border.rounded, layout.itemsCenter, layout.justifyCenter),
                      { width: '48%', minHeight: 100 }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleQuickAction(action.id)}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      style={[
                        tw(layout.absoluteFill, border.rounded),
                        { opacity: 0.1 }
                      ]}
                    />
                    {action.icon === 'plus' && <Plus size={32} color={action.color} style={tw(spacing.mb(2))} />}
                    {action.icon === 'user-plus' && <UserPlus size={32} color={action.color} style={tw(spacing.mb(2))} />}
                    {action.icon === 'trending-up' && <TrendingUp size={32} color={action.color} style={tw(spacing.mb(2))} />}
                    {action.icon === 'flame' && <Flame size={32} color={action.color} style={tw(spacing.mb(2))} />}
                    <Text style={[
                      tw(text.sm, text.semibold), 
                      { 
                        color: colors.foreground,
                        fontFamily: InstagramFonts.family.primary,
                        textAlign: 'center'
                      }
                    ]}>
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Stats Overview */}
          <View style={tw(spacing.mb(8))}>
            <Text style={[tw(text.xl, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
              Your Stats
            </Text>
            
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3))}>
              {dashboardStats.map((stat, index) => (
                <Animated.View
                  key={stat.label}
                  style={[
                    { 
                      width: '48%',
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: Animated.add(slideAnim, new Animated.Value(index * 15))
                      }]
                    }
                  ]}
                >
                  <Card elevation="md">
                    <CardContent style={tw(spacing.p(4), layout.itemsCenter)}>
                      {stat.icon === 'flame' && <Flame size={24} color={stat.color} style={tw(spacing.mb(2))} />}
                      {stat.icon === 'activity' && <Activity size={24} color={stat.color} style={tw(spacing.mb(2))} />}
                      {stat.icon === 'heart' && <Heart size={24} color={stat.color} style={tw(spacing.mb(2))} />}
                      {stat.icon === 'trophy.fill' && <Trophy size={24} color={stat.color} style={tw(spacing.mb(2))} />}
                      <Text style={[tw(text['2xl'], text.bold), { color: colors.foreground }]}>
                        {stat.value}
                      </Text>
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        {stat.label}
                      </Text>
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        {stat.unit}
                      </Text>
                    </CardContent>
                  </Card>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={tw(spacing.mb(8))}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
                Recent Activity
              </Text>
              <TouchableOpacity>
                <Text style={[tw(text.sm), { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            
            <Card elevation="md">
              <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                <Activity size={48} color={colors.mutedForeground} style={tw(spacing.mb(4))} />
                <Text style={[tw(text.base, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                  No recent activities
                </Text>
                <Text style={[tw(text.sm, text.center, spacing.mb(4)), { color: colors.mutedForeground }]}>
                  Start logging your workouts to see your progress here
                </Text>
                <Button 
                  variant="gradient"
                  onPress={() => setShowActivityForm(true)}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      Log Your First Activity
                    </Text>
                  </View>
                </Button>
              </CardContent>
            </Card>
          </View>

          {/* Bottom spacing for tab navigation */}
          <View style={tw(spacing.h(20))} />
        </View>
      </ScrollView>

      {/* Activity Form Modal */}
      <ActivityForm
        visible={showActivityForm}
        onClose={() => setShowActivityForm(false)}
        preselectedMoaiId={primaryMoai?.id}
      />
    </MobileLayout>
  );
}