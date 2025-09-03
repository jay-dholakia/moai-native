import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Filter,
  TrendingUp,
  Clock,
  Award,
  Target
} from 'lucide-react-native';

import { MobileLayout } from '@/components/layouts/MobileLayout';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { useMoais, useMoaiSearch } from '@/hooks/use-moai';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Moai } from '@/services/types';

// Helper function to get user-friendly type labels
const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'motivation': 'Motivation',
    'activity': 'Activity',
    'fitness': 'Fitness',
    'running': 'Running',
    'cycling': 'Cycling',
    'yoga': 'Yoga',
    'weightlifting': 'Weight Lifting',
    'hiking': 'Hiking',
    'swimming': 'Swimming',
    'sports': 'Sports',
    'dance': 'Dance',
    'martial-arts': 'Martial Arts',
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

const DISCOVER_CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'new', label: 'New', icon: Clock },
  { id: 'popular', label: 'Popular', icon: Award },
  { id: 'nearby', label: 'Nearby', icon: MapPin },
];

const ACTIVITY_TYPES = [
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'running', label: 'Running', icon: '🏃' },
  { id: 'cycling', label: 'Cycling', icon: '🚴' },
  { id: 'yoga', label: 'Yoga', icon: '🧘' },
  { id: 'weightlifting', label: 'Weight Lifting', icon: '🏋️' },
  { id: 'hiking', label: 'Hiking', icon: '🥾' },
];

export default function ExploreScreen() {
  const { user } = useAuth();
  const { moais, isLoading: moaisLoading, fetchNextPage, hasNextPage } = useMoais();
  const { searchMoaisAsync, isSearching, searchResults, searchError } = useMoaiSearch();
  const { theme, colors } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Implement refresh logic
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  // Search effect
  React.useEffect(() => {
    if (!searchQuery.trim()) return;

    const timeoutId = setTimeout(() => {
      searchMoaisAsync({
        searchTerm: searchQuery,
        filters: {
          type: selectedActivityType || undefined,
        },
        page: 0,
        limit: 20
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedActivityType, searchMoaisAsync]);

  const renderMoaiCard = ({ item }: { item: Moai }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push(`/moai/${item.id}`)}
    >
      <Card style={tw(spacing.mb(3))}>
        <CardContent style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
            <View style={tw(layout.flex1)}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                {item.name}
              </Text>
              {item.location_address && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mt(1))}>
                  <MapPin size={12} color={colors.mutedForeground} />
                  <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
                    {item.location_address}
                  </Text>
                </View>
              )}
            </View>
            
            <Badge variant="outline" size="sm">
              <Text style={tw(text.xs)}>{getTypeLabel(item.type || 'fitness')}</Text>
            </Badge>
          </View>

          {item.description && (
            <Text 
              style={[tw(text.sm, spacing.mb(3)), { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
              <View style={tw(layout.flexRow, layout.itemsCenter)}>
                <Users size={14} color={colors.mutedForeground} />
                <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
                  {item.member_count || 0} members
                </Text>
              </View>
              
              {item.weekly_commitment_goal && (
                <View style={tw(layout.flexRow, layout.itemsCenter)}>
                  <Target size={14} color={colors.mutedForeground} />
                  <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
                    {item.weekly_commitment_goal}/week
                  </Text>
                </View>
              )}
            </View>

            <Button size="sm" variant="outline">
              Join
            </Button>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  const displayMoais = searchQuery.trim() ? searchResults?.data || [] : 
    moais?.pages?.flatMap(page => page.data) || [];

  return (
    <MobileLayout scrollable={false}>
      <AppHeader 
        title="Explore" 
        showBackButton={true}
        rightAction={{
          icon: () => <Filter size={20} color={colors.foreground} />,
          onPress: () => {
            // TODO: Open filter modal
          },
          label: 'Filter'
        }}
      />
      
      <ScrollView 
        style={tw(layout.flex1)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw(spacing.pb(8))}
      >
        {/* Header */}
        <View style={tw(spacing.mb(6))}>
          <Text style={[tw(text['2xl'], text.bold), { color: colors.foreground }]}>
            Discover Communities
          </Text>
          <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
            Find the perfect fitness community for you
          </Text>
        </View>

        {/* Search Bar */}
        <View style={tw(spacing.mb(6))}>
          <View style={tw(spacing.mb(4))}>
            <Input
              placeholder="Search for communities, activities, or locations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                tw(spacing.pl(12)),
                { backgroundColor: colors.muted }
              ]}
            />
            <Search 
              size={16} 
              color={colors.mutedForeground} 
              style={[tw(spacing.absolute), { left: 12, top: 14 }]} 
            />
          </View>
        </View>

        {/* Category Filters */}
        <View style={tw(spacing.mb(6))}>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Browse by Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw(layout.flexRow, spacing.gap(3))}>
              {DISCOVER_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[
                      tw(spacing.px(4), spacing.py(3), border.rounded),
                      {
                        backgroundColor: isSelected ? colors.primary : colors.muted,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                        minWidth: 100,
                      }
                    ]}
                  >
                    <View style={tw(layout.itemsCenter, spacing.gap(2))}>
                      <IconComponent 
                        size={18} 
                        color={isSelected ? colors.primaryForeground : colors.foreground} 
                      />
                      <Text 
                        style={[
                          tw(text.xs, text.semibold),
                          { color: isSelected ? colors.primaryForeground : colors.foreground }
                        ]}
                      >
                        {category.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Activity Type Filters */}
        <View style={tw(spacing.mb(6))}>
          <Text style={[tw(text.sm, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
            Activity Types
          </Text>
          <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
            {ACTIVITY_TYPES.map((activityType) => {
              const isSelected = selectedActivityType === activityType.id;
              
              return (
                <TouchableOpacity
                  key={activityType.id}
                  onPress={() => setSelectedActivityType(isSelected ? '' : activityType.id)}
                  style={[
                    tw(spacing.px(3), spacing.py(2), border.rounded),
                    {
                      backgroundColor: isSelected ? colors.primary : colors.muted,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                    <Text style={{ fontSize: 14 }}>{activityType.icon}</Text>
                    <Text 
                      style={[
                        tw(text.xs, text.semibold),
                        { color: isSelected ? colors.primaryForeground : colors.foreground }
                      ]}
                    >
                      {activityType.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Results Section */}
        <View style={tw(spacing.mb(6))}>
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              {searchQuery.trim() ? 'Search Results' : 'Trending Communities'}
            </Text>
            {displayMoais.length > 0 && (
              <Badge variant="secondary">
                <Text style={tw(text.xs)}>{displayMoais.length} communities</Text>
              </Badge>
            )}
          </View>

          {(isSearching || moaisLoading) && (
            <Card>
              <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {searchQuery.trim() ? `Searching for "${searchQuery}"...` : 'Loading communities...'}
                </Text>
              </CardContent>
            </Card>
          )}

          {searchError && (
            <Card style={[tw(spacing.mb(4)), { backgroundColor: colors.destructive + '20' }]}>
              <CardContent style={tw(spacing.p(4))}>
                <Text style={[tw(text.sm), { color: colors.destructive }]}>
                  Search error: {searchError.message}
                </Text>
              </CardContent>
            </Card>
          )}

          <FlatList
            data={displayMoais}
            renderItem={renderMoaiCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isSearching && !moaisLoading ? (
                <Card>
                  <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                    <Search size={48} color={colors.mutedForeground} style={tw(spacing.mb(3))} />
                    <Text style={[tw(text.base, text.semibold, spacing.mb(1)), { color: colors.foreground }]}>
                      {searchQuery.trim() ? 'No Results Found' : 'No Communities Yet'}
                    </Text>
                    <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                      {searchQuery.trim() 
                        ? 'Try adjusting your search terms or filters'
                        : 'Be the first to create a community!'
                      }
                    </Text>
                  </CardContent>
                </Card>
              ) : null
            }
          />
        </View>
      </ScrollView>
    </MobileLayout>
  );
}