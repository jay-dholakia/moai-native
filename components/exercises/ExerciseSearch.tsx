import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';

import { Exercise, ExerciseSearchFilters } from '@/services/exercise-service';
import { useExerciseSearch, useExerciseFilters } from '@/hooks/use-exercises';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseDetailModal } from './ExerciseDetailModal';

interface ExerciseSearchProps {
  onSelectExercise?: (exercise: Exercise) => void;
  showSelectButton?: boolean;
  selectedExerciseIds?: string[];
  placeholder?: string;
}

export function ExerciseSearch({ 
  onSelectExercise, 
  showSelectButton = false,
  selectedExerciseIds = [],
  placeholder = "Search exercises..."
}: ExerciseSearchProps) {
  const { colors } = useTheme();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    hasResults,
  } = useExerciseSearch();

  const {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    muscleGroups,
    equipmentTypes,
  } = useExerciseFilters();

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (onSelectExercise) {
      onSelectExercise(exercise);
    }
  };

  const handleFiltersChange = (newFilters: ExerciseSearchFilters) => {
    Object.keys(newFilters).forEach(key => {
      updateFilter(key as keyof ExerciseSearchFilters, newFilters[key as keyof ExerciseSearchFilters]);
    });
  };

  return (
    <View style={tw(layout.flex1)}>
      {/* Search Input */}
      <View style={tw(spacing.mb(4))}>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.relative)}>
          <Search 
            size={20} 
            color={colors.mutedForeground}
            style={tw(layout.absolute, layout.left(12), layout.zIndex(1))}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            style={[
              tw(layout.flex1, spacing.pl(10), spacing.pr(12), spacing.py(3), border.rounded),
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                fontSize: 16,
              }
            ]}
          />
          
          {/* Clear Search */}
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={tw(layout.absolute, layout.right(12), layout.zIndex(1))}
            >
              <X size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <ExerciseFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        muscleGroups={muscleGroups}
        equipmentTypes={equipmentTypes}
        isVisible={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Search Results */}
      <View style={tw(layout.flex1)}>
        {isSearching ? (
          <View style={tw(layout.itemsCenter, layout.justifyCenter, spacing.py(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Searching exercises...
            </Text>
          </View>
        ) : hasResults ? (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <ExerciseCard
                exercise={item}
                onPress={() => handleExercisePress(item)}
                onSelect={() => handleSelectExercise(item)}
                showSelectButton={showSelectButton}
                isSelected={selectedExerciseIds.includes(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw(spacing.pb(8))}
          />
        ) : searchQuery.length >= 2 ? (
          <Card style={tw(spacing.mt(8))}>
            <CardContent style={tw(spacing.p(8), layout.itemsCenter)}>
              <Search size={48} color={colors.mutedForeground} />
              <Text style={[tw(text.lg, text.semibold, spacing.mt(4)), { color: colors.foreground }]}>
                No exercises found
              </Text>
              <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                Try adjusting your search terms or filters
              </Text>
              
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={clearFilters}
                  style={[
                    tw(spacing.mt(4), spacing.px(4), spacing.py(2), border.rounded),
                    { backgroundColor: colors.muted }
                  ]}
                >
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card style={tw(spacing.mt(8))}>
            <CardContent style={tw(spacing.p(8), layout.itemsCenter)}>
              <Search size={48} color={colors.mutedForeground} />
              <Text style={[tw(text.lg, text.semibold, spacing.mt(4)), { color: colors.foreground }]}>
                Search for Exercises
              </Text>
              <Text style={[tw(text.sm, text.center, spacing.mt(2)), { color: colors.mutedForeground }]}>
                Start typing to search through our exercise database
              </Text>
            </CardContent>
          </Card>
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