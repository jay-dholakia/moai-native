import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionHistory } from '@/hooks/use-token-system';
import { TokenTransaction } from '@/services/token-service';

export interface TokenTransactionHistoryProps {
  limit?: number;
  showHeader?: boolean;
  onTransactionPress?: (transaction: TokenTransaction) => void;
}

export const TokenTransactionHistory: React.FC<TokenTransactionHistoryProps> = ({
  limit = 50,
  showHeader = true,
  onTransactionPress,
}) => {
  const { colors } = useTheme();
  const { data: transactionsResponse, isLoading, error, refetch } = useTransactionHistory(limit);

  const transactions = transactionsResponse?.success ? transactionsResponse.data : [];

  const getTransactionIcon = (transaction: TokenTransaction) => {
    switch (transaction.type) {
      case 'earn':
        switch (transaction.source) {
          case 'activity': return 'fitness';
          case 'achievement': return 'trophy';
          case 'streak': return 'flame';
          case 'tier_promotion': return 'trending-up';
          default: return 'add-circle';
        }
      case 'spend':
        switch (transaction.source) {
          case 'marketplace': return 'storefront';
          case 'purchase': return 'bag';
          default: return 'remove-circle';
        }
      case 'bonus':
        return 'gift';
      case 'refund':
        return 'return-up-back';
      default:
        return 'help-circle';
    }
  };

  const getTransactionColor = (transaction: TokenTransaction) => {
    switch (transaction.type) {
      case 'earn':
      case 'bonus':
      case 'refund':
        return colors.primary;
      case 'spend':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const formatAmount = (amount: number, type: TokenTransaction['type']) => {
    const absAmount = Math.abs(amount);
    const sign = type === 'spend' ? '-' : '+';
    return `${sign}${absAmount}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const groupTransactionsByDate = (transactions: TokenTransaction[]) => {
    const groups: { [key: string]: TokenTransaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    return groups;
  };

  const transactionGroups = groupTransactionsByDate(transactions);

  if (isLoading) {
    return (
      <Card elevation="sm">
        <View style={tw(spacing.p(6), layout.itemsCenter)}>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Loading transactions...
          </Text>
        </View>
      </Card>
    );
  }

  if (error || !transactionsResponse?.success) {
    return (
      <Card elevation="sm">
        <View style={tw(spacing.p(6), layout.itemsCenter)}>
          <Ionicons name="alert-circle" size={48} color={colors.destructive} />
          <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.foreground }]}>
            Failed to load transactions
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={tw(spacing.mt(4))}>
            <Text style={[tw(text.sm, text.semibold), { color: colors.primary }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card elevation="sm">
        <View style={tw(spacing.p(6), layout.itemsCenter)}>
          <Ionicons name="receipt-outline" size={48} color={colors.border} />
          <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.foreground }]}>
            No transactions yet
          </Text>
          <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
            Complete activities and unlock achievements to earn tokens!
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card elevation="sm">
      {showHeader && (
        <View style={[tw(spacing.p(4), border.borderB), { borderBottomColor: colors.border }]}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Recent Transactions
          </Text>
        </View>
      )}
      
      <ScrollView 
        style={tw(layout.maxH(96))} // Limit height
        contentContainerStyle={tw(spacing.p(4))}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {Object.entries(transactionGroups).map(([dateKey, dayTransactions]) => (
          <View key={dateKey} style={tw(spacing.mb(4))}>
            {/* Date Header */}
            <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.mutedForeground }]}>
              {new Date(dateKey).toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
            {/* Transactions for this date */}
            <View style={tw(spacing.gap(2))}>
              {dayTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  onPress={() => onTransactionPress?.(transaction)}
                  style={[
                    tw(spacing.p(3), border.rounded, layout.flexRow, layout.itemsCenter, layout.justifyBetween),
                    { backgroundColor: colors.muted + '40' }
                  ]}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3), layout.flex1)}>
                    <View style={[
                      tw(spacing.w(10), spacing.h(10), layout.itemsCenter, layout.justifyCenter, border.rounded),
                      { backgroundColor: getTransactionColor(transaction) + '20' }
                    ]}>
                      <Ionicons 
                        name={getTransactionIcon(transaction) as any} 
                        size={20} 
                        color={getTransactionColor(transaction)} 
                      />
                    </View>
                    
                    <View style={tw(layout.flex1)}>
                      <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                        {transaction.description}
                      </Text>
                      <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                        {formatDate(transaction.created_at)} • {transaction.source}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={tw(layout.itemsEnd)}>
                    <Text style={[
                      tw(text.sm, text.semibold),
                      { color: getTransactionColor(transaction) }
                    ]}>
                      {formatAmount(transaction.amount, transaction.type)}
                    </Text>
                    <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                      Balance: {transaction.balance_after}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        
        {transactions.length >= limit && (
          <View style={tw(layout.itemsCenter, spacing.mt(4))}>
            <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
              Showing {limit} most recent transactions
            </Text>
          </View>
        )}
      </ScrollView>
    </Card>
  );
};