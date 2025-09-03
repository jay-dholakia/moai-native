import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Ionicons } from '@expo/vector-icons';
import { usePublicPrograms, useProgramReviews } from '@/hooks/use-program-management';
import { ProgramTemplate, ProgramReview } from '@/services/program-service';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgramMarketplaceProps {
  onProgramSelect?: (program: ProgramTemplate) => void;
  onEnroll?: (program: ProgramTemplate) => void;
  onClose?: () => void;
}

export const ProgramMarketplace: React.FC<ProgramMarketplaceProps> = ({
  onProgramSelect,
  onEnroll,
  onClose,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramTemplate | null>(null);

  const filters = {
    difficulty: selectedDifficulty || undefined,
    type: selectedType || undefined,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    searchQuery: searchQuery || undefined,
  };

  const { data: programsResponse, isLoading, error, refetch } = usePublicPrograms(filters);
  const programs = programsResponse?.success ? programsResponse.data : [];

  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const programTypes = [
    { id: 'strength', name: 'Strength', icon: 'barbell' },
    { id: 'cardio', name: 'Cardio', icon: 'heart' },
    { id: 'hybrid', name: 'Hybrid', icon: 'fitness' },
    { id: 'flexibility', name: 'Flexibility', icon: 'body' },
    { id: 'sport_specific', name: 'Sport Specific', icon: 'football' },
  ];

  const resetFilters = () => {
    setSelectedDifficulty(null);
    setSelectedType(null);
    setPriceRange({});
    setSearchQuery('');
  };

  const ProgramCard: React.FC<{ program: ProgramTemplate }> = ({ program }) => {
    const getDifficultyColor = () => {
      switch (program.difficulty_level) {
        case 'beginner': return '#10B981';
        case 'intermediate': return '#F59E0B';
        case 'advanced': return '#EF4444';
        default: return colors.primary;
      }
    };

    return (
      <Card elevation="sm" style={tw(spacing.mb(3))}>
        <TouchableOpacity
          onPress={() => setSelectedProgram(program)}
          style={tw(spacing.p(4))}
        >
          {/* Program Image or Placeholder */}
          {program.image_url ? (
            <Image
              source={{ uri: program.image_url }}
              style={[
                tw(spacing.mb(3), border.rounded),
                { width: '100%', height: 150, backgroundColor: colors.muted }
              ]}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10'] as [string, string, ...string[]]}
              style={[tw(spacing.mb(3), border.rounded, layout.itemsCenter, layout.justifyCenter), { height: 150 }]}
            >
              <Ionicons name="fitness" size={48} color={colors.primary} />
            </LinearGradient>
          )}

          {/* Program Info */}
          <View style={tw(spacing.mb(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(2))}>
              <Text style={[tw(text.lg, text.semibold, layout.flex1), { color: colors.foreground }]}>
                {program.name}
              </Text>
              {program.is_featured && (
                <Badge variant="default" size="sm">
                  <Ionicons name="star" size={12} color={colors.primaryForeground} />
                  <Text style={[tw(text.xs, spacing.ml(1)), { color: colors.primaryForeground }]}>
                    Featured
                  </Text>
                </Badge>
              )}
            </View>

            <Text 
              style={[tw(text.sm, spacing.mb(3)), { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {program.description}
            </Text>

            {/* Program Meta */}
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3), spacing.mb(3))}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons name="time" size={14} color={colors.mutedForeground} />
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {program.duration_weeks} weeks
                </Text>
              </View>

              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <View style={[
                  tw(spacing.w(2), spacing.h(2), border.rounded),
                  { backgroundColor: getDifficultyColor() }
                ]} />
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {program.difficulty_level.charAt(0).toUpperCase() + program.difficulty_level.slice(1)}
                </Text>
              </View>

              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                <Ionicons name="fitness" size={14} color={colors.mutedForeground} />
                <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                  {program.program_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
              </View>

              {program.rating_average && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    {program.rating_average.toFixed(1)} ({program.rating_count})
                  </Text>
                </View>
              )}
            </View>

            {/* Coach Info */}
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween)}>
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Avatar
                  source={program.coach_profile?.avatar_url ? { uri: program.coach_profile.avatar_url } : undefined}
                  fallback={program.coach_profile?.first_name?.[0] || 'C'}
                  size="sm"
                />
                <View>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Coach
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    {program.coach_profile?.first_name} {program.coach_profile?.last_name}
                  </Text>
                </View>
              </View>

              <View style={tw(layout.itemsEnd)}>
                <Text style={[tw(text.lg, text.bold), { color: colors.primary }]}>
                  {program.price === 0 ? 'Free' : `$${program.price}`}
                </Text>
                {program.price > 0 && (
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    per month
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <MobileLayout safeArea padding={false}>
      {/* Header */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
        { borderBottomColor: colors.border }
      ]}>
        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
          <Ionicons name="storefront" size={24} color={colors.primary} />
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Program Marketplace
          </Text>
        </View>

        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={tw(spacing.p(4), spacing.pb(0))}>
        <View style={tw(layout.flexRow, spacing.gap(2))}>
          <View style={tw(layout.flex1, layout.relative)}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search programs..."
              style={[tw(spacing.mb(0), spacing.pl(10))]}
            />
            <View 
              style={[
                tw(layout.absolute, layout.justifyCenter, layout.itemsCenter),
                { left: 12, top: 0, bottom: 0, width: 20 }
              ]}
            >
              <Ionicons 
                name="search" 
                size={20} 
                color={colors.mutedForeground} 
              />
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={[
              tw(spacing.px(4), layout.justifyCenter, border.rounded),
              { backgroundColor: showFilters ? colors.primary : colors.secondary }
            ]}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={showFilters ? colors.primaryForeground : colors.foreground} 
            />
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        {(selectedDifficulty || selectedType || priceRange.min || priceRange.max) && (
          <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2), spacing.mt(3))}>
            {selectedDifficulty && (
              <Badge variant="secondary" size="sm">
                <Text style={[tw(text.xs), { color: colors.foreground }]}>
                  {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDifficulty(null)}>
                  <Ionicons name="close" size={14} color={colors.foreground} />
                </TouchableOpacity>
              </Badge>
            )}
            
            {selectedType && (
              <Badge variant="secondary" size="sm">
                <Text style={[tw(text.xs), { color: colors.foreground }]}>
                  {selectedType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
                <TouchableOpacity onPress={() => setSelectedType(null)}>
                  <Ionicons name="close" size={14} color={colors.foreground} />
                </TouchableOpacity>
              </Badge>
            )}
            
            {(priceRange.min !== undefined || priceRange.max !== undefined) && (
              <Badge variant="secondary" size="sm">
                <Text style={[tw(text.xs), { color: colors.foreground }]}>
                  ${priceRange.min || 0} - ${priceRange.max || '∞'}
                </Text>
                <TouchableOpacity onPress={() => setPriceRange({})}>
                  <Ionicons name="close" size={14} color={colors.foreground} />
                </TouchableOpacity>
              </Badge>
            )}
            
            <TouchableOpacity onPress={resetFilters}>
              <Text style={[tw(text.xs), { color: colors.primary }]}>
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={[
          tw(spacing.p(4), spacing.pt(0), border.borderB),
          { borderBottomColor: colors.border }
        ]}>
          {/* Difficulty Filter */}
          <View style={tw(spacing.mb(3))}>
            <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
              Difficulty Level
            </Text>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              {difficulties.map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  onPress={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
                  style={[
                    tw(layout.flex1, spacing.py(2), border.rounded, layout.itemsCenter),
                    {
                      backgroundColor: selectedDifficulty === difficulty ? colors.primary : colors.secondary,
                    }
                  ]}
                >
                  <Text style={[
                    tw(text.xs, text.semibold),
                    { color: selectedDifficulty === difficulty ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type Filter */}
          <View style={tw(spacing.mb(3))}>
            <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
              Program Type
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={tw(layout.flexRow, spacing.gap(2))}>
                {programTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setSelectedType(selectedType === type.id ? null : type.id)}
                    style={[
                      tw(spacing.px(3), spacing.py(2), border.rounded, layout.flexRow, layout.itemsCenter, spacing.gap(1)),
                      {
                        backgroundColor: selectedType === type.id ? colors.primary : colors.secondary,
                      }
                    ]}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={14} 
                      color={selectedType === type.id ? colors.primaryForeground : colors.foreground} 
                    />
                    <Text style={[
                      tw(text.xs, text.semibold),
                      { color: selectedType === type.id ? colors.primaryForeground : colors.foreground }
                    ]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Price Range */}
          <View>
            <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
              Price Range
            </Text>
            <View style={tw(layout.flexRow, spacing.gap(2))}>
              <Input
                value={priceRange.min?.toString() || ''}
                onChangeText={(text) => setPriceRange({ ...priceRange, min: parseInt(text) || undefined })}
                placeholder="Min"
                keyboardType="numeric"
                style={tw(layout.flex1, spacing.mb(0))}
              />
              <Text style={[tw(text.base), { color: colors.mutedForeground }]}>-</Text>
              <Input
                value={priceRange.max?.toString() || ''}
                onChangeText={(text) => setPriceRange({ ...priceRange, max: parseInt(text) || undefined })}
                placeholder="Max"
                keyboardType="numeric"
                style={tw(layout.flex1, spacing.mb(0))}
              />
            </View>
          </View>
        </View>
      )}

      {/* Programs List */}
      <ScrollView style={tw(layout.flex1)} contentContainerStyle={tw(spacing.p(4))}>
        {isLoading ? (
          <View style={tw(layout.itemsCenter, spacing.mt(8))}>
            <Text style={[tw(text.base), { color: colors.mutedForeground }]}>
              Loading programs...
            </Text>
          </View>
        ) : error || !programsResponse?.success ? (
          <Card elevation="sm">
            <View style={tw(spacing.p(6), layout.itemsCenter)}>
              <Ionicons name="alert-circle" size={48} color={colors.destructive} />
              <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.foreground }]}>
                Failed to load programs
              </Text>
              <Button onPress={() => refetch()} variant="outline" size="sm" style={tw(spacing.mt(4))}>
                Try Again
              </Button>
            </View>
          </Card>
        ) : programs.length === 0 ? (
          <Card elevation="sm">
            <View style={tw(spacing.p(6), layout.itemsCenter)}>
              <Ionicons name="search" size={48} color={colors.border} />
              <Text style={[tw(text.base, text.center, spacing.mt(2)), { color: colors.foreground }]}>
                No programs found
              </Text>
              <Text style={[tw(text.sm, text.center, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Try adjusting your filters or search query
              </Text>
              <Button onPress={resetFilters} variant="outline" size="sm" style={tw(spacing.mt(4))}>
                Clear Filters
              </Button>
            </View>
          </Card>
        ) : (
          <>
            <Text style={[tw(text.sm, spacing.mb(3)), { color: colors.mutedForeground }]}>
              {programs.length} program{programs.length !== 1 ? 's' : ''} found
            </Text>
            {programs.map((program: ProgramTemplate) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
          onEnroll={() => {
            onEnroll?.(selectedProgram);
            setSelectedProgram(null);
          }}
        />
      )}
    </MobileLayout>
  );
};

interface ProgramDetailModalProps {
  program: ProgramTemplate;
  onClose: () => void;
  onEnroll: () => void;
}

const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  program,
  onClose,
  onEnroll,
}) => {
  const { colors } = useTheme();
  const { data: reviewsResponse } = useProgramReviews(program.id);
  const reviews = reviewsResponse?.success ? reviewsResponse.data : [];

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <MobileLayout safeArea padding={false}>
        {/* Header */}
        <View style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderB),
          { borderBottomColor: colors.border }
        ]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          
          <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
            Program Details
          </Text>
          
          <View style={tw(spacing.w(6))} />
        </View>

        <ScrollView style={tw(layout.flex1)}>
          {/* Program Header */}
          {program.image_url ? (
            <Image
              source={{ uri: program.image_url }}
              style={{ width: '100%', height: 200, backgroundColor: colors.muted }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10'] as [string, string, ...string[]]}
              style={[tw(layout.itemsCenter, layout.justifyCenter), { height: 200 }]}
            >
              <Ionicons name="fitness" size={64} color={colors.primary} />
            </LinearGradient>
          )}

          <View style={tw(spacing.p(4))}>
            {/* Title and Rating */}
            <View style={tw(spacing.mb(4))}>
              <Text style={[tw(text['2xl'], text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                {program.name}
              </Text>
              
              {program.rating_average && (
                <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(1))}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.floor(program.rating_average || 0) ? "star" : "star-outline"}
                        size={16}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    {program.rating_average.toFixed(1)} ({program.rating_count} reviews)
                  </Text>
                </View>
              )}
            </View>

            {/* Coach Info */}
            <Card elevation="sm" style={tw(spacing.mb(4))}>
              <View style={tw(spacing.p(4), layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
                <Avatar
                  source={program.coach_profile?.avatar_url ? { uri: program.coach_profile.avatar_url } : undefined}
                  fallback={program.coach_profile?.first_name?.[0] || 'C'}
                  size="lg"
                />
                <View style={tw(layout.flex1)}>
                  <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                    Created by
                  </Text>
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {program.coach_profile?.first_name} {program.coach_profile?.last_name}
                  </Text>
                  {program.coach_profile?.bio && (
                    <Text 
                      style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {program.coach_profile.bio}
                    </Text>
                  )}
                </View>
              </View>
            </Card>

            {/* Program Details */}
            <View style={tw(spacing.mb(6))}>
              <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                About This Program
              </Text>
              <Text style={[tw(text.base), { color: colors.foreground }]}>
                {program.description}
              </Text>
            </View>

            {/* Program Info Grid */}
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3), spacing.mb(6))}>
              <View style={[tw(layout.flex1, spacing.p(3), border.rounded), { backgroundColor: colors.muted, minWidth: '45%' }]}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  Duration
                </Text>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  {program.duration_weeks} Weeks
                </Text>
              </View>

              <View style={[tw(layout.flex1, spacing.p(3), border.rounded), { backgroundColor: colors.muted, minWidth: '45%' }]}>
                <Ionicons name="speedometer" size={20} color={colors.primary} />
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  Difficulty
                </Text>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  {program.difficulty_level.charAt(0).toUpperCase() + program.difficulty_level.slice(1)}
                </Text>
              </View>

              <View style={[tw(layout.flex1, spacing.p(3), border.rounded), { backgroundColor: colors.muted, minWidth: '45%' }]}>
                <Ionicons name="fitness" size={20} color={colors.primary} />
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  Type
                </Text>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  {program.program_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
              </View>

              <View style={[tw(layout.flex1, spacing.p(3), border.rounded), { backgroundColor: colors.muted, minWidth: '45%' }]}>
                <Ionicons name="people" size={20} color={colors.primary} />
                <Text style={[tw(text.xs, spacing.mt(1)), { color: colors.mutedForeground }]}>
                  Enrolled
                </Text>
                <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                  {program.enrollment_count} Users
                </Text>
              </View>
            </View>

            {/* Goals */}
            {program.goals.length > 0 && (
              <View style={tw(spacing.mb(6))}>
                <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                  Program Goals
                </Text>
                {program.goals.map((goal, index) => (
                  <View key={index} style={tw(layout.flexRow, layout.itemsStart, spacing.gap(2), spacing.mb(2))}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={tw(spacing.mt(1))} />
                    <Text style={[tw(text.base, layout.flex1), { color: colors.foreground }]}>
                      {goal}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Equipment */}
            {program.equipment_needed.length > 0 && (
              <View style={tw(spacing.mb(6))}>
                <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                  Equipment Needed
                </Text>
                <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
                  {program.equipment_needed.map((equipment, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      <Text style={[tw(text.xs), { color: colors.foreground }]}>
                        {equipment}
                      </Text>
                    </Badge>
                  ))}
                </View>
              </View>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <View style={tw(spacing.mb(6))}>
                <Text style={[tw(text.lg, text.semibold, spacing.mb(3)), { color: colors.foreground }]}>
                  Reviews
                </Text>
                {reviews.slice(0, 3).map((review: ProgramReview) => (
                  <Card key={review.id} elevation="sm" style={tw(spacing.mb(3))}>
                    <View style={tw(spacing.p(4))}>
                      <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.mb(2))}>
                        <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                          <Avatar
                            source={review.client_profile?.avatar_url ? { uri: review.client_profile.avatar_url } : undefined}
                            fallback={review.client_profile?.first_name?.[0] || 'U'}
                            size="sm"
                          />
                          <Text style={[tw(text.sm, text.semibold), { color: colors.foreground }]}>
                            {review.client_profile?.first_name} {review.client_profile?.last_name}
                          </Text>
                        </View>
                        <View style={tw(layout.flexRow)}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={star <= review.rating ? "star" : "star-outline"}
                              size={12}
                              color="#F59E0B"
                            />
                          ))}
                        </View>
                      </View>
                      {review.review_text && (
                        <Text style={[tw(text.sm), { color: colors.foreground }]}>
                          {review.review_text}
                        </Text>
                      )}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={[
          tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), border.borderT),
          { borderTopColor: colors.border }
        ]}>
          <View>
            <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
              Price
            </Text>
            <Text style={[tw(text['2xl'], text.bold), { color: colors.primary }]}>
              {program.price === 0 ? 'Free' : `$${program.price}`}
            </Text>
            {program.price > 0 && (
              <Text style={[tw(text.xs), { color: colors.mutedForeground }]}>
                per month
              </Text>
            )}
          </View>

          <Button
            variant="gradient"
            size="lg"
            onPress={onEnroll}
          >
            Enroll Now
          </Button>
        </View>
      </MobileLayout>
    </Modal>
  );
};