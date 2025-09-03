import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Dumbbell, Search, Filter, Grid, List, Star, TrendingUp } from 'lucide-react-native';

import { Exercise } from '@/services/exercise-service';
import { 
  useExercises, 
  usePopularExercises, 
  useRecommendedExercises,
  useExerciseCategories,
  useExerciseFilters 
} from '@/hooks/use-exercises';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseSearch } from './ExerciseSearch';
import { ExerciseDetailModal } from './ExerciseDetailModal';

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void;
  showSelectButton?: boolean;
  selectedExerciseIds?: string[];
}

type ViewMode = 'browse' | 'search';
type BrowseTab = 'popular' | 'recommended' | 'categories' | 'all';

export function ExerciseLibrary({ 
  onSelectExercise, 
  showSelectButton = false,
  selectedExerciseIds = []
}: ExerciseLibraryProps) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [browseTab, setBrowseTab] = useState<BrowseTab>('popular');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { filters, clearFilters, hasActiveFilters } = useExerciseFilters();
  
  // Data hooks
  const { popularExercises, isLoading: isLoadingPopular } = usePopularExercises(20);
  const { recommendedExercises, isLoading: isLoadingRecommended } = useRecommendedExercises(20);
  const { categories } = useExerciseCategories();
  const { 
    exercises: allExercises, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: isLoadingAll 
  } = useExercises(filters, 20);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Refresh will happen automatically via React Query
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (onSelectExercise) {
      onSelectExercise(exercise);
    }
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <ExerciseCard
      exercise={item}
      onPress={() => handleExercisePress(item)}
      onSelect={() => handleSelectExercise(item)}
      showSelectButton={showSelectButton}
      isSelected={selectedExerciseIds.includes(item.id)}
    />
  );

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {
        // Switch to filtered view
        setBrowseTab('all');
        // Apply category filter
      }}
      style={tw(spacing.mb(3))}
    >
      <Card>
        <CardContent style={tw(spacing.p(4))}>
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
              <Text style={[tw(text['2xl'], spacing.mr(3)), { color: colors.foreground }]}>
                {item.icon}
              </Text>
              
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                  {item.name}
                </Text>
                <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                  {item.exercises_count} exercises
                </Text>
              </View>
            </View>
            
            <View style={tw(layout.itemsCenter)}>
              <Badge variant="outline">
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {item.exercises_count}
                </Text>
              </Badge>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  if (viewMode === 'search') {
    return (
      <View style={tw(layout.flex1)}>
        {/* Header */}
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
          <Text style={[tw(text['2xl'], text.bold), { color: colors.foreground }]}>
            Exercise Search
          </Text>
          
          <TouchableOpacity
            onPress={() => setViewMode('browse')}
            style={[
              tw(spacing.p(2), border.rounded),
              { backgroundColor: colors.muted }
            ]}
          >
            <Grid size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ExerciseSearch
          onSelectExercise={onSelectExercise}
          showSelectButton={showSelectButton}
          selectedExerciseIds={selectedExerciseIds}
        />
      </View>
    );
  }

  return (
    <View style={tw(layout.flex1)}>
      {/* Header */}
      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(4))}>
        <Text style={[tw(text['2xl'], text.bold), { color: colors.foreground }]}>
          Exercise Library
        </Text>
        
        <TouchableOpacity
          onPress={() => setViewMode('search')}
          style={[
            tw(spacing.p(2), border.rounded),
            { backgroundColor: colors.muted }
          ]}
        >
          <Search size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={tw(layout.flexRow, spacing.mb(4))}>
        <TouchableOpacity
          onPress={() => setBrowseTab('popular')}
          style={[
            tw(layout.flex1, spacing.p(3), border.rounded, spacing.mr(1)),
            { backgroundColor: browseTab === 'popular' ? colors.primary : colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter)}>
            <TrendingUp size={16} color={browseTab === 'popular' ? colors.primaryForeground : colors.foreground} />
            <Text style={[
              tw(text.sm, text.semibold, spacing.ml(1)),
              { color: browseTab === 'popular' ? colors.primaryForeground : colors.foreground }
            ]}>
              Popular
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setBrowseTab('recommended')}
          style={[
            tw(layout.flex1, spacing.p(3), border.rounded, spacing.mx(1)),
            { backgroundColor: browseTab === 'recommended' ? colors.primary : colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter)}>
            <Star size={16} color={browseTab === 'recommended' ? colors.primaryForeground : colors.foreground} />
            <Text style={[
              tw(text.sm, text.semibold, spacing.ml(1)),
              { color: browseTab === 'recommended' ? colors.primaryForeground : colors.foreground }
            ]}>
              For You
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setBrowseTab('categories')}
          style={[
            tw(layout.flex1, spacing.p(3), border.rounded, spacing.mx(1)),
            { backgroundColor: browseTab === 'categories' ? colors.primary : colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter)}>
            <Grid size={16} color={browseTab === 'categories' ? colors.primaryForeground : colors.foreground} />
            <Text style={[
              tw(text.sm, text.semibold, spacing.ml(1)),
              { color: browseTab === 'categories' ? colors.primaryForeground : colors.foreground }
            ]}>
              Categories
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setBrowseTab('all')}
          style={[
            tw(layout.flex1, spacing.p(3), border.rounded, spacing.ml(1)),
            { backgroundColor: browseTab === 'all' ? colors.primary : colors.muted }
          ]}
        >
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter)}>
            <List size={16} color={browseTab === 'all' ? colors.primaryForeground : colors.foreground} />
            <Text style={[
              tw(text.sm, text.semibold, spacing.ml(1)),
              { color: browseTab === 'all' ? colors.primaryForeground : colors.foreground }
            ]}>
              All
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {hasActiveFilters && browseTab === 'all' && (
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(4))}>
          <Badge variant="outline" style={tw(spacing.mr(2))}>
            <Filter size={12} color={colors.mutedForeground} />
            <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.mutedForeground }]}>
              Filtered
            </Text>
          </Badge>
          
          <TouchableOpacity onPress={clearFilters}>
            <Text style={[tw(text.sm), { color: colors.primary }]}>
              Clear filters
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={tw(layout.flex1)}>
        {browseTab === 'popular' && (
          <FlatList
            data={popularExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={tw(spacing.pb(8))}
            ListHeaderComponent={
              <View style={tw(spacing.mb(4))}>
                <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                  Most popular exercises in the community
                </Text>
              </View>
            }
          />
        )}

        {browseTab === 'recommended' && (
          <FlatList
            data={recommendedExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={tw(spacing.pb(8))}
            ListHeaderComponent={
              <View style={tw(spacing.mb(4))}>
                <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                  Personalized recommendations based on your activity
                </Text>
              </View>
            }
          />
        )}

        {browseTab === 'categories' && (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.name}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={tw(spacing.pb(8))}
            ListHeaderComponent={
              <View style={tw(spacing.mb(4))}>
                <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                  Browse exercises by category
                </Text>
              </View>
            }
          />
        )}

        {browseTab === 'all' && (
          <FlatList
            data={allExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
            contentContainerStyle={tw(spacing.pb(8))}
            ListHeaderComponent={
              <View style={tw(spacing.mb(4))}>
                <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
                  All exercises in our database
                </Text>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={tw(spacing.py(4), layout.itemsCenter)}>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    Loading more exercises...
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isVisible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onSelect={onSelectExercise}
        showSelectButton={showSelectButton}
      />
    </View>
  );
}