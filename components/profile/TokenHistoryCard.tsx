import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { Card } from '@/components/ui/Card';
import { TokenService, TokenTransaction } from '@/services/token-service';

interface TokenHistoryCardProps {
  userId: string;
  initialCount?: number;
  showHeader?: boolean;
}

interface TransactionItemProps {
  transaction: TokenTransaction;
  theme: 'light' | 'dark';
  colors: any;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, theme, colors }) => {
  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'activity':
        return '🏃‍♂️';
      case 'rest_day':
        return '😴';
      case 'commitment_individual':
        return '🎯';
      case 'commitment_moai':
        return '🗿';
      case 'tier':
        return '⭐';
      case 'stone':
        return '💎';
      default:
        return '🏅';
    }
  };

  const getSourceDescription = (sourceType: string) => {
    switch (sourceType) {
      case 'activity':
        return 'Activity Completed';
      case 'rest_day':
        return 'Rest Day Logged';
      case 'commitment_individual':
        return 'Personal Goal';
      case 'commitment_moai':
        return 'Moai Challenge';
      case 'tier':
        return 'Tier Promotion';
      case 'stone':
        return 'Stone Collected';
      default:
        return 'Token Earned';
    }
  };

  const isPositive = transaction.points > 0;

  return (
    <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.py(3))}>
      <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
        <View
          style={[
            tw(layout.itemsCenter, layout.justifyCenter, border.rounded),
            {
              width: 40,
              height: 40,
              backgroundColor: isPositive ? colors.primary + '20' : colors.destructive + '20',
            }
          ]}
        >
          <Text style={tw(text.lg)}>
            {getSourceIcon(transaction.source_type)}
          </Text>
        </View>

        <View style={tw(layout.flex1)}>
          <Text style={tw(text.sm, text.medium, text.foreground(theme))}>
            {getSourceDescription(transaction.source_type)}
          </Text>
          <Text style={tw(text.xs, text.muted(theme))}>
            {format(new Date(transaction.awarded_on), 'MMM d, yyyy • h:mm a')}
          </Text>
        </View>
      </View>

      <View style={tw(layout.itemsCenter)}>
        <Text
          style={[
            tw(text.sm, text.bold),
            {
              color: isPositive ? colors.primary : colors.destructive,
            }
          ]}
        >
          {isPositive ? '+' : ''}{transaction.points}
        </Text>
        <Text style={tw(text.xs, text.muted(theme))}>
          tokens
        </Text>
      </View>
    </View>
  );
};

export const TokenHistoryCard: React.FC<TokenHistoryCardProps> = ({
  userId,
  initialCount = 10,
  showHeader = true
}) => {
  const { theme, colors } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const [currentLimit, setCurrentLimit] = useState(initialCount);

  // Fetch transaction history
  const { data: transactionsResponse, isLoading, error } = useQuery({
    queryKey: ['tokenHistory', userId, currentLimit],
    queryFn: () => TokenService.getTransactionHistory(userId, currentLimit),
    enabled: !!userId,
  });

  const transactions = transactionsResponse?.success ? transactionsResponse.data : [];
  const hasMore = transactions.length === currentLimit;

  const handleLoadMore = () => {
    setCurrentLimit(prev => prev + 10);
  };

  const handleToggleView = () => {
    if (showAll) {
      setCurrentLimit(initialCount);
      setShowAll(false);
    } else {
      setShowAll(true);
      setCurrentLimit(100); // Load more when expanding
    }
  };

  if (isLoading) {
    return (
      <Card elevation="md" style={tw(spacing.mb(6))}>
        <View style={tw(spacing.p(4), layout.itemsCenter, spacing.py(8))}>
          <Text style={tw(text.sm, text.muted(theme))}>Loading transaction history...</Text>
        </View>
      </Card>
    );
  }

  if (error || !transactions.length) {
    return (
      <Card elevation="md" style={tw(spacing.mb(6))}>
        <View style={tw(spacing.p(4))}>
          {showHeader && (
            <Text style={tw(text.base, text.bold, text.foreground(theme), spacing.mb(4))}>
              Token History
            </Text>
          )}
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            <Text style={tw(text.lg, spacing.mb(2))}>📊</Text>
            <Text style={tw(text.sm, text.muted(theme), text.center)}>
              {error ? 'Failed to load transaction history' : 'No token transactions yet'}
            </Text>
            <Text style={tw(text.xs, text.muted(theme), text.center, spacing.mt(1))}>
              Complete activities to start earning tokens
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card elevation="md" style={tw(spacing.mb(6))}>
      <View style={tw(spacing.p(4))}>
        {showHeader && (
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
            <Text style={tw(text.base, text.bold, text.foreground(theme))}>
              Token History
            </Text>
            {transactions.length > initialCount && (
              <TouchableOpacity
                onPress={handleToggleView}
                style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}
              >
                <Text style={tw(text.sm, text.medium)}>
                  {showAll ? 'Show Less' : 'View All'}
                </Text>
                <Ionicons
                  name={showAll ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.foreground}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        <ScrollView
          style={{ maxHeight: showAll ? 400 : 300 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {transactions.map((transaction, index) => (
            <React.Fragment key={`${transaction.id}-${index}`}>
              <TransactionItem
                transaction={transaction}
                theme={theme}
                colors={colors}
              />
              {index < transactions.length - 1 && (
                <View
                  style={[
                    tw(spacing.ml(12)),
                    {
                      height: 1,
                      backgroundColor: colors.border,
                    }
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </ScrollView>

        {/* Load More Button */}
        {hasMore && showAll && (
          <TouchableOpacity
            onPress={handleLoadMore}
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.py(3), spacing.mt(4), border.rounded),
              {
                backgroundColor: colors.muted + '40',
                borderWidth: 1,
                borderColor: colors.border,
              }
            ]}
          >
            <Ionicons name="add" size={16} color={colors.foreground} />
            <Text style={tw(text.sm, text.foreground(theme), spacing.ml(1))}>
              Load More
            </Text>
          </TouchableOpacity>
        )}

        {/* Summary Footer */}
        <View style={tw(spacing.mt(4), spacing.pt(4))}>
          <View
            style={[
              tw(spacing.py(3), border.rounded),
              {
                backgroundColor: colors.muted + '20',
                borderWidth: 1,
                borderColor: colors.border,
              }
            ]}
          >
            <Text style={tw(text.xs, text.muted(theme), text.center)}>
              Showing {Math.min(transactions.length, currentLimit)} of {transactions.length}+ transactions
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};