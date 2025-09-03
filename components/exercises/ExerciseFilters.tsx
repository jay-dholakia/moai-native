import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Filter, X, ChevronDown } from 'lucide-react-native';

import { ExerciseSearchFilters } from '@/services/exercise-service';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ExerciseFiltersProps {
  filters: ExerciseSearchFilters;
  onFiltersChange: (filters: ExerciseSearchFilters) => void;
  muscleGroups: string[];
  equipmentTypes: string[];
  isVisible: boolean;
  onToggle: () => void;
}

const EXERCISE_TYPES = [
  { value: 'strength', label: 'Strength', icon: '💪' },
  { value: 'cardio', label: 'Cardio', icon: '🏃' },
  { value: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { value: 'balance', label: 'Balance', icon: '⚖️' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
] as const;

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: '#10B981' },
  { value: 'intermediate', label: 'Intermediate', color: '#F59E0B' },
  { value: 'advanced', label: 'Advanced', color: '#EF4444' },
] as const;

export function ExerciseFilters({
  filters,
  onFiltersChange,
  muscleGroups,
  equipmentTypes,
  isVisible,
  onToggle
}: ExerciseFiltersProps) {
  const { colors } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['type']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const updateFilter = (key: keyof ExerciseSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleArrayFilter = (key: 'muscle_groups' | 'equipment', value: string) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof ExerciseSearchFilters];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.exercise_type) count++;
    if (filters.difficulty_level) count++;
    if (filters.muscle_groups?.length) count++;
    if (filters.equipment?.length) count++;
    return count;
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        onPress={onToggle}
        style={[
          tw(layout.flexRow, layout.itemsCenter, spacing.px(4), spacing.py(3), border.rounded, spacing.mb(4)),
          { backgroundColor: colors.muted }
        ]}
      >
        <Filter size={16} color={colors.foreground} />
        <Text style={[tw(text.sm, spacing.ml(2)), { color: colors.foreground }]}>
          Filters
        </Text>
        {hasActiveFilters && (
          <Badge variant="destructive" style={tw(spacing.ml(2))}>
            {getActiveFiltersCount()}
          </Badge>
        )}
        <ChevronDown size={16} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
    );
  }

  return (
    <Card style={tw(spacing.mb(4))}>
      <CardHeader>
        <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
          <CardTitle>
            <View style={tw(layout.flexRow, layout.itemsCenter)}>
              <Filter size={16} color={colors.foreground} />
              <Text style={[tw(text.lg, text.semibold, spacing.ml(2)), { color: colors.foreground }]}>
                Filters
              </Text>
              {hasActiveFilters && (
                <Badge variant="destructive" style={tw(spacing.ml(2))}>
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </View>
          </CardTitle>
          
          <View style={tw(layout.flexRow, spacing.gap(2))}>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onPress={clearAllFilters}>
                <X size={14} color={colors.foreground} />
                <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.foreground }]}>
                  Clear
                </Text>
              </Button>
            )}
            
            <TouchableOpacity onPress={onToggle}>
              <X size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </CardHeader>

      <CardContent>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Exercise Type */}
          <FilterSection
            title="Exercise Type"
            icon="🏋️"
            isExpanded={expandedSections.has('type')}
            onToggle={() => toggleSection('type')}
          >
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
              {EXERCISE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => updateFilter('exercise_type', 
                    filters.exercise_type === type.value ? undefined : type.value
                  )}
                  style={[
                    tw(layout.flexRow, layout.itemsCenter, spacing.px(3), spacing.py(2), border.rounded),
                    {
                      backgroundColor: filters.exercise_type === type.value 
                        ? colors.primary 
                        : colors.muted,
                      borderWidth: 1,
                      borderColor: filters.exercise_type === type.value 
                        ? colors.primary 
                        : colors.border,
                    }
                  ]}
                >
                  <Text style={tw(text.sm, spacing.mr(1))}>
                    {type.icon}
                  </Text>
                  <Text style={[
                    tw(text.sm),
                    { 
                      color: filters.exercise_type === type.value 
                        ? colors.primaryForeground 
                        : colors.foreground 
                    }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FilterSection>

          {/* Difficulty Level */}
          <FilterSection
            title="Difficulty"
            icon="📊"
            isExpanded={expandedSections.has('difficulty')}
            onToggle={() => toggleSection('difficulty')}
          >
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
              {DIFFICULTY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  onPress={() => updateFilter('difficulty_level', 
                    filters.difficulty_level === level.value ? undefined : level.value
                  )}
                  style={[
                    tw(spacing.px(3), spacing.py(2), border.rounded),
                    {
                      backgroundColor: filters.difficulty_level === level.value 
                        ? level.color 
                        : colors.muted,
                      borderWidth: 1,
                      borderColor: filters.difficulty_level === level.value 
                        ? level.color 
                        : colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    tw(text.sm, text.semibold),
                    { 
                      color: filters.difficulty_level === level.value 
                        ? '#FFFFFF' 
                        : colors.foreground 
                    }
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FilterSection>

          {/* Muscle Groups */}
          <FilterSection
            title="Muscle Groups"
            icon="💪"
            isExpanded={expandedSections.has('muscles')}
            onToggle={() => toggleSection('muscles')}
          >
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  onPress={() => toggleArrayFilter('muscle_groups', muscle)}
                  style={[
                    tw(spacing.px(3), spacing.py(2), border.rounded),
                    {
                      backgroundColor: filters.muscle_groups?.includes(muscle) 
                        ? colors.primary 
                        : colors.muted,
                      borderWidth: 1,
                      borderColor: filters.muscle_groups?.includes(muscle) 
                        ? colors.primary 
                        : colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    tw(text.sm),
                    { 
                      color: filters.muscle_groups?.includes(muscle) 
                        ? colors.primaryForeground 
                        : colors.foreground 
                    }
                  ]}>
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FilterSection>

          {/* Equipment */}
          <FilterSection
            title="Equipment"
            icon="🏋️"
            isExpanded={expandedSections.has('equipment')}
            onToggle={() => toggleSection('equipment')}
          >
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
              {equipmentTypes.map((equipment) => (
                <TouchableOpacity
                  key={equipment}
                  onPress={() => toggleArrayFilter('equipment', equipment)}
                  style={[
                    tw(spacing.px(3), spacing.py(2), border.rounded),
                    {
                      backgroundColor: filters.equipment?.includes(equipment) 
                        ? colors.primary 
                        : colors.muted,
                      borderWidth: 1,
                      borderColor: filters.equipment?.includes(equipment) 
                        ? colors.primary 
                        : colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    tw(text.sm),
                    { 
                      color: filters.equipment?.includes(equipment) 
                        ? colors.primaryForeground 
                        : colors.foreground 
                    }
                  ]}>
                    {equipment}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FilterSection>
        </ScrollView>
      </CardContent>
    </Card>
  );
}

interface FilterSectionProps {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, icon, isExpanded, onToggle, children }: FilterSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={tw(spacing.mb(4))}>
      <TouchableOpacity
        onPress={onToggle}
        style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(3))}
      >
        <View style={tw(layout.flexRow, layout.itemsCenter)}>
          <Text style={tw(text.base, spacing.mr(2))}>
            {icon}
          </Text>
          <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
            {title}
          </Text>
        </View>
        
        <ChevronDown 
          size={16} 
          color={colors.mutedForeground}
          style={[
            tw(layout.transform),
            { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }
          ]}
        />
      </TouchableOpacity>

      {isExpanded && children}
    </View>
  );
}