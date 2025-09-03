import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, MessageSquare } from 'lucide-react-native';
import { tw, text, spacing, layout } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

interface AccountabilityBuddyIndicatorProps {
  isAccountabilityBuddy: boolean;
  memberName: string;
  memberId: string;
  onChatPress?: (memberId: string, memberName: string) => void;
  showTooltip?: boolean;
}

/**
 * AccountabilityBuddyIndicator shows buddy relationship and provides chat option
 */
export const AccountabilityBuddyIndicator: React.FC<AccountabilityBuddyIndicatorProps> = ({
  isAccountabilityBuddy,
  memberName,
  memberId,
  onChatPress,
  showTooltip = false,
}) => {
  const { colors } = useTheme();
  const [showTooltipState, setShowTooltipState] = useState(false);

  if (!isAccountabilityBuddy) return null;

  return (
    <View style={tw('flex-row items-center gap-2')}>
      {/* Buddy Indicator */}
      <TouchableOpacity
        onPress={() => setShowTooltipState(!showTooltipState)}
        style={[
          tw('w-6 h-6 rounded-full flex items-center justify-center'),
          { backgroundColor: colors.primary }
        ]}
      >
        <Users size={12} color="white" />
      </TouchableOpacity>

      {/* Chat Button */}
      {onChatPress && (
        <TouchableOpacity
          onPress={() => onChatPress(memberId, memberName)}
          style={tw('w-6 h-6 rounded-full flex items-center justify-center bg-teal-500')}
        >
          <MessageSquare size={12} color="white" />
        </TouchableOpacity>
      )}

      {/* Tooltip */}
      {(showTooltip || showTooltipState) && (
        <View
          style={[
            tw('absolute z-10 px-2 py-1 rounded'),
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              bottom: 30,
              left: -50,
              minWidth: 120,
            }
          ]}
        >
          <Text style={[text.xs, { color: colors.foreground }]}>
            Your accountability buddy!
          </Text>
          
          {/* Tooltip Arrow */}
          <View
            style={[
              tw('absolute w-3 h-3 transform rotate-45'),
              {
                backgroundColor: colors.card,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderColor: colors.border,
                bottom: -6,
                left: 60,
              }
            ]}
          />
        </View>
      )}
    </View>
  );
};

export default AccountabilityBuddyIndicator;