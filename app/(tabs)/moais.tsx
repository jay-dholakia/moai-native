import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Plus, Search, MapPin, Star, Users, ChevronRight, Filter } from 'lucide-react-native';

import { useMoais, useUserMoais, useMoaiSearch } from '@/hooks/use-moai';
import { useMoaiRealtime } from '@/hooks/use-moai-realtime';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, bg, layout, border } from '@/utils/styles';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { AppHeader } from '@/components/ui/AppHeader';
import { Moai } from '@/services/types';

// Import the YourMoaiScreen component
const YourMoaiScreen = React.lazy(() => import('../your-moai'));

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

export default function MoaisScreen() {
  const { user } = useAuth();
  const { userMoais, isLoading: userMoaisLoading } = useUserMoais();
  const { moais, isLoading: moaisLoading } = useMoais();
  const { searchMoaisAsync, isSearching, searchResults, searchError } = useMoaiSearch();
  const { isConnected: isRealtimeConnected } = useMoaiRealtime();
  const { theme, colors } = useTheme();

  // Check if user has any moais to determine which view to show
  const userMoaisList = useMemo(() => {
    return userMoais?.pages?.flatMap(page => page.data) || [];
  }, [userMoais]);

  const hasUserMoais = userMoaisList.length > 0;
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<{
    type?: string;
    hobbies?: string[];
    location?: string;
  }>({});

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Implement refresh logic for moais
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  // Debounced search effect
  React.useEffect(() => {
    if (!searchQuery.trim()) return;

    const timeoutId = setTimeout(() => {
      searchMoaisAsync({
        searchTerm: searchQuery,
        filters: searchFilters,
        page: 0,
        limit: 20
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchFilters, searchMoaisAsync]);

  const renderMoaiCard = ({ item, showJoinButton = false }: { item: Moai; showJoinButton?: boolean }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push(`/moai/${item.id}`)}
    >
      <Card elevation="md" style={tw(spacing.mb(3))}>
        <CardContent style={tw(spacing.p(0))}>
          {/* Cover Image */}
          {item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={[
                tw(border.rounded),
                { height: 120, width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
              ]}
              resizeMode="cover"
            />
          )}
          
          <View style={tw(spacing.p(4))}>
            {/* Header */}
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
              
              {showJoinButton && item.moai_type === 'public' && (
                <Badge variant="secondary" size="sm">
                  <Star size={10} color={colors.primary} />
                  Public
                </Badge>
              )}
            </View>

            {/* Description */}
            {item.description && (
              <Text 
                style={[tw(text.sm, spacing.mb(3)), { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}

            {/* Stats */}
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(4))}>
                <View style={tw(layout.flexRow, layout.itemsCenter)}>
                  <Users size={14} color={colors.mutedForeground} />
                  <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
                    {item.member_count || 0} members
                  </Text>
                </View>
                
                <Badge variant="outline" size="sm">
                  {getTypeLabel(item.type || 'fitness')}
                </Badge>
              </View>

              {showJoinButton && (
                <Button size="sm" variant="outline">
                  Join
                </Button>
              )}
            </View>

            {/* Goals or Hobbies */}
            {(item.goals && item.goals.length > 0) && (
              <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(1), spacing.mb(3))}>
                {item.goals.slice(0, 3).map((goal, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    <Text style={tw(text.xs)}>
                      {goal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </Badge>
                ))}
                {item.goals.length > 3 && (
                  <Badge variant="outline" size="sm">
                    <Text style={tw(text.xs)}>+{item.goals.length - 3}</Text>
                  </Badge>
                )}
              </View>
            )}

            {/* Member Avatars */}
            {item.member_count && item.member_count > 0 && (
              <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
                <View style={tw(layout.flexRow, layout.itemsCenter)}>
                  {/* Mock member avatars */}
                  <View style={tw(layout.flexRow)}>
                    {Array.from({ length: Math.min(3, item.member_count) }, (_, index) => (
                      <Avatar
                        key={index}
                        size="sm"
                        fallback={`M${index + 1}`}
                        style={[
                          { marginLeft: index > 0 ? -8 : 0 },
                          { zIndex: 3 - index }
                        ]}
                      />
                    ))}
                  </View>
                  {item.member_count > 3 && (
                    <Text style={[tw(text.xs, spacing.ml(2)), { color: colors.mutedForeground }]}>
                      +{item.member_count - 3} more
                    </Text>
                  )}
                </View>
                
                <ChevronRight size={16} color={colors.mutedForeground} />
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  // If user has moais, show YourMoaiScreen, otherwise show discovery screen
  if (hasUserMoais && !userMoaisLoading) {
    return (
      <React.Suspense fallback={
        <MobileLayout>
          <AppHeader title="Your Moai" showProfile={true} />
          <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Loading...
            </Text>
          </View>
        </MobileLayout>
      }>
        <YourMoaiScreen />
      </React.Suspense>
    );
  }

  return (
    <MobileLayout scrollable={false}>
      <AppHeader 
        title={
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Discover Moais
            </Text>
            {isRealtimeConnected && (
              <View
                style={[
                  tw(spacing.w(2), spacing.h(2), border.rounded),
                  { backgroundColor: '#10B981' }
                ]}
              />
            )}
          </View>
        }
        showProfile={true}
        rightAction={{
          icon: () => <Search size={20} color={colors.foreground} />,
          onPress: () => setShowSearch(!showSearch),
          label: 'Search moais'
        }}
      />
      <ScrollView 
        style={tw(layout.flex1)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(6))}>
          <View>
            <Text style={[tw(text['2xl'], text.bold), { color: colors.foreground }]}>
              Discover Moais
            </Text>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Find fitness communities to join
            </Text>
          </View>
          
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Search size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Filter size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={tw(spacing.mb(6))}>
            <View style={tw(spacing.mb(4))}>
              <Input
                placeholder="Search for fitness communities..."
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
            
            {/* Search Filters */}
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <TouchableOpacity
                onPress={() => setSearchFilters(prev => ({ ...prev, type: prev.type ? undefined : 'fitness' }))}
                style={[
                  tw(spacing.px(3), spacing.py(2), border.rounded),
                  { 
                    backgroundColor: searchFilters.type ? colors.primary : colors.muted,
                    borderWidth: 1,
                    borderColor: searchFilters.type ? colors.primary : colors.border
                  }
                ]}
              >
                <Text style={[
                  tw(text.xs), 
                  { color: searchFilters.type ? colors.primaryForeground : colors.foreground }
                ]}>
                  Fitness
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setSearchFilters(prev => ({ ...prev, location: prev.location ? undefined : 'San Francisco' }))}
                style={[
                  tw(spacing.px(3), spacing.py(2), border.rounded),
                  { 
                    backgroundColor: searchFilters.location ? colors.primary : colors.muted,
                    borderWidth: 1,
                    borderColor: searchFilters.location ? colors.primary : colors.border
                  }
                ]}
              >
                <Text style={[
                  tw(text.xs), 
                  { color: searchFilters.location ? colors.primaryForeground : colors.foreground }
                ]}>
                  Near Me
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={tw(spacing.mb(6))}>
          <View style={tw(layout.flexRow, spacing.gap(3))}>
            <Button
              variant="gradient"
              style={tw(layout.flex1)}
              onPress={() => {
                router.push('/create-moai');
              }}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Create Moai
                </Text>
              </View>
            </Button>
            
            <Button
              variant="outline"
              style={tw(layout.flex1)}
              onPress={() => {
                router.push('/explore');
              }}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Search size={16} color={colors.foreground} />
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  Explore
                </Text>
              </View>
            </Button>
          </View>
        </View>

        {/* Getting Started Section for New Users */}
        <View style={tw(spacing.mb(8))}>
          <Card style={[{ backgroundColor: `${colors.primary}20` }]}>
            <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
              <Users size={48} color={colors.primary} style={tw(spacing.mb(3))} />
              <Text style={[tw(text.lg, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                Welcome to Moais!
              </Text>
              <Text style={[tw(text.sm, text.center, spacing.mb(4)), { color: colors.mutedForeground }]}>
                Join fitness communities to stay motivated, track progress with friends, and achieve your goals together.
              </Text>
              <Button variant="default" size="lg">
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                  <Plus size={16} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                    Create Your First Moai
                  </Text>
                </View>
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* Search Results or Featured Moais Section */}
        {searchQuery.trim() ? (
          <View style={tw(spacing.mb(8))}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
                Search Results
              </Text>
              {searchResults?.data && searchResults.data.length > 0 && (
                <Badge variant="secondary">
                  <Text style={tw(text.xs)}>{searchResults.data.length} found</Text>
                </Badge>
              )}
            </View>
            
            {isSearching && (
              <Card>
                <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Searching for "{searchQuery}"...
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
            
            {searchResults?.data?.map((moai: Moai) => (
              <View key={`search-${moai.id}`}>
                {renderMoaiCard({ item: moai, showJoinButton: true })}
              </View>
            ))}
            
            {!isSearching && searchQuery.trim() && (!searchResults?.data || searchResults.data.length === 0) && (
              <Card>
                <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Search size={48} color={colors.mutedForeground} style={tw(spacing.mb(3))} />
                  <Text style={[tw(text.base, text.semibold, spacing.mb(1)), { color: colors.foreground }]}>
                    No Results Found
                  </Text>
                  <Text style={[tw(text.sm, text.center), { color: colors.mutedForeground }]}>
                    Try adjusting your search terms or filters
                  </Text>
                </CardContent>
              </Card>
            )}
          </View>
        ) : (
          <View style={tw(spacing.mb(8))}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
                Discover Moais
              </Text>
            </View>
            
            {moaisLoading && (
              <Card>
                <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Loading public moais...
                  </Text>
                </CardContent>
              </Card>
            )}
            
            {moais?.pages?.map((page: any, pageIndex: number) => 
              page.data.slice(0, 3).map((moai: Moai) => (
                <View key={`discover-${moai.id}`}>
                  {renderMoaiCard({ item: moai, showJoinButton: true })}
                </View>
              ))
            )}
            
            {moais?.pages && moais.pages[0]?.data.length > 3 && (
              <Button variant="outline" style={tw(spacing.mt(3))}>
                View All Public Moais
              </Button>
            )}
          </View>
        )}

        {/* Recommended Section */}
        <View style={tw(spacing.mb(8))}>
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
            <Text style={[tw(text.xl, text.semibold), { color: colors.foreground }]}>
              Recommended for You
            </Text>
          </View>
          
          <Card>
            <CardContent style={tw(spacing.p(6), layout.itemsCenter)}>
              <Text style={[tw(text.base, text.semibold, spacing.mb(1)), { color: colors.foreground }]}>
                Personalized Recommendations
              </Text>
              <Text style={[tw(text.sm, text.center, spacing.mb(4)), { color: colors.mutedForeground }]}>
                Complete your profile to get personalized Moai recommendations based on your interests and location.
              </Text>
              <Button variant="outline">
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* Bottom spacing for navigation */}
        <View style={tw(spacing.h(8))} />
      </ScrollView>
    </MobileLayout>
  );
}