import React, { useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { Moai } from '@/services/types';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, layout } from '@/utils/styles';
import { MoaiProfileCircle } from './MoaiProfileCircle';
import { MoaiStoryRing } from './MoaiStoryRing';
import { FriendsCircle } from './FriendsCircle';
import { PlusCircle } from './PlusCircle';

interface MoaiSelectorProps {
  moais: Moai[];
  selectedMoai?: Moai | null;
  onMoaiSelect: (moai: Moai) => void;
  onFriendsToggle: () => void;
  onCreateMoai: () => void;
  showFriendsView?: boolean;
  // Story/moments status
  storyStatus?: Record<string, { hasStories: boolean; hasViewedStories: boolean }>;
  isLoading?: boolean;
}

export const MoaiSelector: React.FC<MoaiSelectorProps> = ({
  moais,
  selectedMoai,
  onMoaiSelect,
  onFriendsToggle,
  onCreateMoai,
  showFriendsView = false,
  storyStatus = {},
  isLoading = false,
}) => {
  const { colors } = useTheme();

  const handleMoaiPress = useCallback((moai: Moai) => {
    onMoaiSelect(moai);
  }, [onMoaiSelect]);

  // Sort moais by urgency status (same logic as web)
  const sortedMoais = React.useMemo(() => {
    return [...moais].sort((a, b) => {
      const getUrgencyPriority = (moai: Moai) => {
        const consecutiveMissed = moai.consecutive_missed_weeks || 0;
        const currentStreak = moai.current_streak_weeks || 0;
        
        if (consecutiveMissed >= 1) return 3; // Critical
        if (currentStreak === 0) return 2; // At Risk
        return 1; // On Track
      };
      
      return getUrgencyPriority(b) - getUrgencyPriority(a);
    });
  }, [moais]);

  const getStoryStatus = (moaiId: string) => {
    return storyStatus[moaiId] || { hasStories: false, hasViewedStories: false };
  };

  if (isLoading) {
    return (
      <View style={tw(spacing.py(4), spacing.px(4))}>
        <View style={tw(layout.flexRow, spacing.gap(4))}>
          {/* Loading placeholders */}
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                {
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.muted,
                },
                tw(spacing.mr(3)),
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={tw(spacing.py(2))}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw(spacing.px(4), spacing.gap(4))}
        style={tw(spacing.py(2))}
        bounces={true}
        decelerationRate="fast"
        snapToInterval={64} // Approximate width of each item
        snapToAlignment="start"
      >
        {/* User's Moais */}
        {sortedMoais.map((moai) => {
          const { hasStories, hasViewedStories } = getStoryStatus(moai.id);
          const isSelected = selectedMoai?.id === moai.id && !showFriendsView;
          
          return (
            <View key={moai.id} style={tw(layout.itemsCenter)}>
              <MoaiStoryRing
                hasStories={hasStories}
                hasViewedStories={hasViewedStories}
                onClick={() => handleMoaiPress(moai)}
              >
                <MoaiProfileCircle
                  moai={moai}
                  isSelected={isSelected}
                  onClick={() => handleMoaiPress(moai)}
                  showBadge={true}
                />
              </MoaiStoryRing>
            </View>
          );
        })}

        {/* Friends Circle */}
        <FriendsCircle 
          onClick={onFriendsToggle}
          isSelected={showFriendsView}
        />

        {/* Plus Circle */}
        <PlusCircle 
          onClick={onCreateMoai} 
          isAtCapacity={(sortedMoais?.length || 0) >= 3}
        />
      </ScrollView>
    </View>
  );
};

export default MoaiSelector;
export { FriendsCircle } from './FriendsCircle';
export { PlusCircle } from './PlusCircle';