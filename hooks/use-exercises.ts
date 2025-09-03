import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { ExerciseService, Exercise, ExerciseSearchFilters } from '@/services/exercise-service';
import { useAuth } from '@/hooks/useAuth';
import { ServiceResponse } from '@/services/types';

// Type for paginated exercise response - matches the service return
interface PaginatedExerciseResponse {
  exercises: Exercise[];
  hasMore: boolean;
  total: number;
}

export function useExercises(filters: ExerciseSearchFilters = {}, limit = 20) {
  const { user } = useAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<ServiceResponse<PaginatedExerciseResponse>, Error, {
    pages: PaginatedExerciseResponse[];
    pageParams: unknown[];
  }>({
    queryKey: ['exercises', filters],
    queryFn: ({ pageParam }) => ExerciseService.getExercises(filters, pageParam as number, limit),
    initialPageParam: 1,
    enabled: !!user,
    getNextPageParam: (lastPage: ServiceResponse<PaginatedExerciseResponse>, pages: ServiceResponse<PaginatedExerciseResponse>[]) => {
      if (lastPage.success && lastPage.data.hasMore) {
        return pages.length + 1;
      }
      return undefined;
    },
    select: (data) => ({
      pages: data.pages.map(page => page.success ? page.data : { exercises: [], hasMore: false, total: 0, page: 1 }),
      pageParams: data.pageParams,
    }),
  });

  const exercises = useMemo(() => {
    return data?.pages.flatMap(page => page.exercises) || [];
  }, [data]);

  const total = data?.pages[0]?.total || 0;

  return {
    exercises,
    total,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  };
}

export function useExerciseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { user } = useAuth();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: isSearching } = useQuery<ServiceResponse<Exercise[]>, Error, Exercise[]>({
    queryKey: ['exercise-search', debouncedQuery],
    queryFn: () => ExerciseService.searchExercises(debouncedQuery),
    enabled: !!user && debouncedQuery.length >= 2,
    select: (response: ServiceResponse<Exercise[]>) => response.success ? response.data : [],
  });

  return {
    searchQuery,
    setSearchQuery,
    searchResults: searchResults || [],
    isSearching,
    hasResults: (searchResults?.length || 0) > 0,
  };
}

export function useExerciseDetails(exerciseId: string | undefined) {
  const { user } = useAuth();

  const { data: exercise, isLoading } = useQuery<ServiceResponse<Exercise>, Error, Exercise | null>({
    queryKey: ['exercise', exerciseId],
    queryFn: () => ExerciseService.getExerciseById(exerciseId!),
    enabled: !!exerciseId && !!user,
    select: (response: ServiceResponse<Exercise>) => response.success ? response.data : null,
  });

  return {
    exercise,
    isLoading,
  };
}

export function useMuscleGroups() {
  const { user } = useAuth();

  const { data: muscleGroups } = useQuery<ServiceResponse<string[]>, Error, string[]>({
    queryKey: ['muscle-groups'],
    queryFn: () => ExerciseService.getMuscleGroups(),
    enabled: !!user,
    select: (response: ServiceResponse<string[]>) => response.success ? response.data : [],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  return {
    muscleGroups: muscleGroups || [],
  };
}

export function useEquipmentTypes() {
  const { user } = useAuth();

  const { data: equipmentTypes } = useQuery<ServiceResponse<string[]>, Error, string[]>({
    queryKey: ['equipment-types'],
    queryFn: () => ExerciseService.getEquipmentTypes(),
    enabled: !!user,
    select: (response: ServiceResponse<string[]>) => response.success ? response.data : [],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  return {
    equipmentTypes: equipmentTypes || [],
  };
}

export function useExerciseCategories() {
  const { user } = useAuth();

  const { data: categories } = useQuery<ServiceResponse<any[]>, Error, any[]>({
    queryKey: ['exercise-categories'],
    queryFn: () => ExerciseService.getExerciseCategories(),
    enabled: !!user,
    select: (response: ServiceResponse<any[]>) => response.success ? response.data : [],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  return {
    categories: categories || [],
  };
}

export function usePopularExercises(limit = 10) {
  const { user } = useAuth();

  const { data: popularExercises, isLoading } = useQuery<ServiceResponse<Exercise[]>, Error, Exercise[]>({
    queryKey: ['popular-exercises', limit],
    queryFn: () => ExerciseService.getPopularExercises(limit),
    enabled: !!user,
    select: (response: ServiceResponse<Exercise[]>) => response.success ? response.data : [],
  });

  return {
    popularExercises: popularExercises || [],
    isLoading,
  };
}

export function useRecommendedExercises(limit = 10) {
  const { user } = useAuth();

  const { data: recommendedExercises, isLoading } = useQuery<ServiceResponse<Exercise[]>, Error, Exercise[]>({
    queryKey: ['recommended-exercises', limit],
    queryFn: () => ExerciseService.getRecommendedExercises(limit),
    enabled: !!user,
    select: (response: ServiceResponse<Exercise[]>) => response.success ? response.data : [],
  });

  return {
    recommendedExercises: recommendedExercises || [],
    isLoading,
  };
}

export function useCreateCustomExercise() {
  const queryClient = useQueryClient();

  const createExercise = useMutation({
    mutationFn: ExerciseService.createCustomExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-categories'] });
    },
  });

  return {
    createExercise: createExercise.mutate,
    isCreating: createExercise.isPending,
  };
}

// Hook for exercise filtering
export function useExerciseFilters() {
  const [filters, setFilters] = useState<ExerciseSearchFilters>({});
  
  const { muscleGroups } = useMuscleGroups();
  const { equipmentTypes } = useEquipmentTypes();

  const updateFilter = (key: keyof ExerciseSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof ExerciseSearchFilters];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    muscleGroups,
    equipmentTypes,
  };
}