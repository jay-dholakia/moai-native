import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TokenBalance } from './TokenBalance';
import { Ionicons } from '@expo/vector-icons';
import { useMarketplace, useMarketplacePurchase, useCanAfford } from '@/hooks/use-token-system';
import { MarketplaceItem } from '@/services/token-service';

export interface TokenMarketplaceProps {
  onItemPurchased?: (item: MarketplaceItem) => void;
  onClose?: () => void;
}

export const TokenMarketplace: React.FC<TokenMarketplaceProps> = ({
  onItemPurchased,
  onClose,
}) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { data: marketplaceResponse, isLoading, error, refetch } = useMarketplace();
  const purchaseItem = useMarketplacePurchase();

  const items = marketplaceResponse?.success ? marketplaceResponse.data : [];
  
  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'badge', name: 'Badges', icon: 'shield' },
    { id: 'theme', name: 'Themes', icon: 'color-palette' },
    { id: 'avatar', name: 'Avatars', icon: 'person-circle' },
    { id: 'boost', name: 'Boosts', icon: 'flash' },
    { id: 'premium', name: 'Premium', icon: 'diamond' },
  ];

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const handlePurchase = (item: MarketplaceItem) => {
    Alert.alert(
      'Confirm Purchase',
      `Purchase "${item.name}" for ${item.cost} tokens?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              const result = await purchaseItem.mutateAsync(item.id);
              if (result.success) {
                Alert.alert('Success!', `You've purchased ${item.name}!`);
                onItemPurchased?.(item);
              } else {
                Alert.alert('Purchase Failed', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to complete purchase');
            }
          },
        },
      ]
    );
  };

  const MarketplaceItemCard: React.FC<{ item: MarketplaceItem }> = ({ item }) => {
    const { canAfford, shortfall } = useCanAfford(item.cost);

    return (
      <Card elevation="sm" style={tw(spacing.mb(3))}>
        <View style={tw(spacing.p(4))}>
          {/* Item Image */}
          <View style={tw(layout.itemsCenter, spacing.mb(3))}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={[
                  tw(border.rounded),
                  { width: 80, height: 80, backgroundColor: colors.muted }
                ]}
                resizeMode="cover"
              />
            ) : (
              <View style={[
                tw(spacing.w(20), spacing.h(20), layout.itemsCenter, layout.justifyCenter, border.rounded),
                { backgroundColor: colors.primary + '20' }
              ]}>
                <Ionicons 
                  name={getCategoryIcon(item.category) as any} 
                  size={32} 
                  color={colors.primary} 
                />
              </View>
            )}
          </View>

          {/* Item Info */}
          <View style={tw(layout.itemsCenter, spacing.mb(3))}>
            <Text style={[tw(text.base, text.semibold, text.center), { color: colors.foreground }]}>
              {item.name}
            </Text>
            <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
              {item.description}
            </Text>
          </View>

          {/* Category Badge */}
          <View style={tw(layout.itemsCenter, spacing.mb(3))}>
            <Text style={[
              tw(text.xs, text.semibold, spacing.px(2), spacing.py(1), border.rounded),
              { 
                color: colors.primary,
                backgroundColor: colors.primary + '20',
              }
            ]}>
              {item.category.toUpperCase()}
            </Text>
          </View>

          {/* Purchase Section */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mt(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
              <Ionicons name="diamond" size={16} color={colors.primary} />
              <Text style={[tw(text.lg, text.semibold), { color: colors.primary }]}>
                {item.cost}
              </Text>
            </View>

            <Button
              variant={canAfford ? "default" : "outline"}
              size="sm"
              onPress={() => handlePurchase(item)}
              disabled={!canAfford || purchaseItem.isPending}
              loading={purchaseItem.isPending}
            >
              {canAfford ? 'Purchase' : `Need ${shortfall} more`}
            </Button>
          </View>

          {item.purchase_limit && (
            <Text style={[tw(text.xs, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              Limited to {item.purchase_limit} per user
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.id === category);
    return categoryData?.icon || 'help';
  };

  if (isLoading) {
    return (
      <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
        <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
          Loading marketplace...
        </Text>
      </View>
    );
  }

  if (error || !marketplaceResponse?.success) {
    return (
      <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter, spacing.p(6))}>
        <Ionicons name="storefront-outline" size={64} color={colors.border} />
        <Text style={[tw(text.lg, text.center, spacing.mt(4)), { color: colors.foreground }]}>
          Failed to load marketplace
        </Text>
        <Button onPress={() => refetch()} variant="outline" style={tw(spacing.mt(4))}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={tw(layout.flex1)}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          <Ionicons name="storefront" size={24} color={colors.primary} />
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Token Marketplace
          </Text>
        </View>

        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          <TokenBalance size="sm" />
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={tw(spacing.p(4))}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw(spacing.gap(2))}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[
                tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
                {
                  backgroundColor: selectedCategory === category.id ? colors.primary : colors.secondary,
                }
              ]}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? colors.primaryForeground : colors.foreground} 
              />
              <Text style={[
                tw(text.sm, text.semibold),
                { color: selectedCategory === category.id ? colors.primaryForeground : colors.foreground }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items Grid */}
      <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
        {filteredItems.length > 0 ? (
          <View style={tw(spacing.gap(3))}>
            {filteredItems.map((item: MarketplaceItem) => (
              <MarketplaceItemCard key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View style={tw(layout.itemsCenter, spacing.mt(8))}>
            <Ionicons name="basket-outline" size={64} color={colors.border} />
            <Text style={[tw(text.lg, text.center, spacing.mt(4)), { color: colors.foreground }]}>
              No items available
            </Text>
            <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
              {selectedCategory === 'all' 
                ? 'The marketplace is currently empty'
                : `No ${selectedCategory} items available`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};