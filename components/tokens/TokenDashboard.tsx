import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { TokenBalance } from './TokenBalance';
import { TokenTransactionHistory } from './TokenTransactionHistory';
import { TokenMarketplace } from './TokenMarketplace';
import { Ionicons } from '@expo/vector-icons';
import { 
  useTokenStats, 
  useTokenLeaderboard, 
  useEarningRules 
} from '@/hooks/use-token-system';
import { LinearGradient } from 'expo-linear-gradient';
import { TokenBalance as TokenBalanceType, TokenEarningRule } from '@/services/token-service';

export interface TokenDashboardProps {
  onClose?: () => void;
}

export const TokenDashboard: React.FC<TokenDashboardProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'earning'>('overview');

  const { stats, isLoading: isStatsLoading } = useTokenStats();
  const { data: leaderboardResponse } = useTokenLeaderboard(5);
  const { data: rulesResponse } = useEarningRules();

  const leaderboard = leaderboardResponse?.success ? leaderboardResponse.data : [];
  const rules = rulesResponse?.success ? rulesResponse.data : [];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'pie-chart' },
    { id: 'history', name: 'History', icon: 'time' },
    { id: 'earning', name: 'Earning', icon: 'information-circle' },
  ];

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color?: string;
  }> = ({ title, value, subtitle, icon, color = colors.primary }) => (
    <Card elevation="sm" style={tw(layout.flex1, spacing.mr(3))}>
      <LinearGradient
        colors={[color + '10', color + '05'] as [string, string, ...string[]]}
        style={tw(spacing.p(4), border.rounded)}
      >
        <View style={tw(layout.itemsCenter)}>
          <Ionicons name={icon as any} size={24} color={color} />
          <Text style={[tw(text.xl, text.bold, spacing.mt(2)), { color }]}>
            {value}
          </Text>
          <Text style={[tw(text.sm, text.center), { color: colors.foreground }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[tw(text.xs, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </LinearGradient>
    </Card>
  );

  const OverviewTab = () => (
    <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
      {/* Token Balance Header */}
      <Card elevation="md" style={tw(spacing.mb(6))}>
        <LinearGradient
          colors={[colors.primary + '20', colors.primary + '10'] as [string, string, ...string[]]}
          style={tw(spacing.p(6), border.rounded)}
        >
          <View style={tw(layout.itemsCenter)}>
            <TokenBalance size="lg" showLabel={false} />
            <Text style={[tw(text.base, spacing.mt(2)), { color: colors.foreground }]}>
              Current Balance
            </Text>
          </View>
        </LinearGradient>
      </Card>

      {/* Statistics */}
      {!isStatsLoading && (
        <View style={tw(spacing.mb(6))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Your Stats
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw(spacing.pb(2))}
          >
            <StatCard
              icon="trending-up"
              title="Lifetime Earned"
              value={stats.lifetimeEarned}
              color={colors.primary}
            />
            <StatCard
              icon="trending-down"
              title="Lifetime Spent"
              value={stats.lifetimeSpent}
              color={colors.destructive}
            />
            <StatCard
              icon="calendar"
              title="This Week"
              value={stats.recentEarnings}
              subtitle="Earned"
              color={colors.primary}
            />
            <StatCard
              icon="receipt"
              title="Transactions"
              value={stats.totalTransactions}
              color={colors.mutedForeground}
            />
          </ScrollView>
        </View>
      )}

      {/* Quick Actions */}
      <View style={tw(spacing.mb(6))}>
        <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
          Quick Actions
        </Text>
        
        <View style={tw(layout.flexRow, spacing.gap(3))}>
          <Button
            variant="default"
            style={tw(layout.flex1)}
            onPress={() => setShowMarketplace(true)}
          >
            <Ionicons name="storefront" size={16} color={colors.primaryForeground} />
            <Text style={[tw(text.sm, spacing.ml(2)), { color: colors.primaryForeground }]}>
              Marketplace
            </Text>
          </Button>
          
          <Button
            variant="outline"
            style={tw(layout.flex1)}
            onPress={() => setActiveTab('earning')}
          >
            <Ionicons name="information-circle" size={16} color={colors.foreground} />
            <Text style={[tw(text.sm, spacing.ml(2)), { color: colors.foreground }]}>
              How to Earn
            </Text>
          </Button>
        </View>
      </View>

      {/* Mini Leaderboard */}
      {leaderboard.length > 0 && (
        <View style={tw(spacing.mb(6))}>
          <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Top Earners
          </Text>
          
          <Card elevation="sm">
            <View style={tw(spacing.p(4))}>
              {leaderboard.slice(0, 3).map((user: { user_id: string; total_points: number; profile?: any }, index: number) => (
                <View 
                  key={user.user_id}
                  style={tw(
                    layout.flexRow, 
                    layout.itemsCenter, 
                    layout.justifyBetween,
                    index < 2 ? spacing.mb(3) : spacing.mb(0)
                  )}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                    <View style={[
                      tw(spacing.w(8), spacing.h(8), layout.itemsCenter, layout.justifyCenter, border.rounded),
                      { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }
                    ]}>
                      <Text style={[tw(text.sm, text.bold), { color: '#FFF' }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[tw(text.sm), { color: colors.foreground }]}>
                      {user.profile?.first_name && user.profile?.last_name
                        ? `${user.profile.first_name} ${user.profile.last_name}`
                        : user.profile?.username || 'Unknown User'
                      }
                    </Text>
                  </View>
                  
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                    <Ionicons name="diamond" size={14} color={colors.primary} />
                    <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
                      {user.total_points}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );

  const EarningTab = () => (
    <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
      <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
        How to Earn Tokens
      </Text>

      {/* Default earning methods */}
      <Card elevation="sm" style={tw(spacing.mb(4))}>
        <View style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(3))}>
            <Ionicons name="fitness" size={24} color={colors.primary} />
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              Activities
            </Text>
          </View>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Complete fitness activities to earn 10-50 tokens based on duration and intensity.
          </Text>
        </View>
      </Card>

      <Card elevation="sm" style={tw(spacing.mb(4))}>
        <View style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(3))}>
            <Ionicons name="trophy" size={24} color={colors.primary} />
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              Achievements
            </Text>
          </View>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Unlock badges (50 tokens) and tier promotions (100 tokens) to earn bonus rewards.
          </Text>
        </View>
      </Card>

      <Card elevation="sm" style={tw(spacing.mb(4))}>
        <View style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(3))}>
            <Ionicons name="flame" size={24} color={colors.destructive} />
            <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
              Streaks
            </Text>
          </View>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            Maintain activity streaks: 3 days (25 tokens), 7 days (50 tokens), 14 days (100 tokens), 30+ days (200 tokens).
          </Text>
        </View>
      </Card>

      {/* Dynamic rules from database */}
      {rules.map((rule: TokenEarningRule) => (
        <Card key={rule.id} elevation="sm" style={tw(spacing.mb(4))}>
          <View style={tw(spacing.p(4))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), spacing.mb(3))}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                {rule.source.charAt(0).toUpperCase() + rule.source.slice(1)}
              </Text>
            </View>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              {rule.description} - Base: {rule.base_amount} tokens
              {rule.multiplier && ` (Bonus: ${rule.multiplier} per condition met)`}
            </Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          <Ionicons name="diamond" size={24} color={colors.primary} />
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Token Center
          </Text>
        </View>

        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[tw(layout.flexRow, spacing.p(4), border.borderB), { borderBottomColor: colors.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[
              tw(layout.flex1, layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2), spacing.py(2), border.rounded),
              {
                backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
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
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'history' && (
        <View style={tw(layout.flex1, spacing.p(4))}>
          <TokenTransactionHistory showHeader={false} />
        </View>
      )}
      {activeTab === 'earning' && <EarningTab />}

      {/* Marketplace Modal */}
      <Modal
        visible={showMarketplace}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <TokenMarketplace onClose={() => setShowMarketplace(false)} />
      </Modal>
    </MobileLayout>
  );
};