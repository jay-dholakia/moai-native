import {
    Camera,
    Image,
    Mic,
    Paperclip,
    Plus,
    Send,
    Smile,
    X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Platform,
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { border, layout, spacing, text, tw } from '@/utils/styles';

const { width: screenWidth } = Dimensions.get('window');

export interface EnhancedChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  isSending?: boolean;
  showMediaOptions?: boolean;
  showEmojiPicker?: boolean;
  onMediaOptionPress?: (option: string) => void;
  onEmojiPress?: (emoji: string) => void;
  style?: any;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = "Type a message...",
  maxLength = 1000,
  disabled = false,
  isSending = false,
  showMediaOptions = false,
  showEmojiPicker = false,
  onMediaOptionPress,
  onEmojiPress,
  style,
}) => {
  const { theme, colors } = useTheme();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  const [localShowMediaOptions, setLocalShowMediaOptions] = useState(false);
  const [localShowEmojiPicker, setLocalShowEmojiPicker] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const inputHeightAnim = useRef(new Animated.Value(44)).current;
  const mediaPanelAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Use external state if provided, otherwise use local state
  const shouldShowMediaOptions = showMediaOptions !== undefined ? showMediaOptions : localShowMediaOptions;
  const shouldShowEmojiPicker = showEmojiPicker !== undefined ? showEmojiPicker : localShowEmojiPicker;

  // Smooth input height animation
  useEffect(() => {
    const targetHeight = Math.min(Math.max(inputHeight, 44), 100); // Limit max height to 100px
    Animated.spring(inputHeightAnim, {
      toValue: targetHeight,
      useNativeDriver: false,
      tension: 300,
      friction: 20,
    }).start();
  }, [inputHeight, inputHeightAnim]);

  // Media panel animation with spring physics
  useEffect(() => {
    Animated.spring(mediaPanelAnim, {
      toValue: shouldShowMediaOptions || shouldShowEmojiPicker ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [shouldShowMediaOptions, shouldShowEmojiPicker, mediaPanelAnim]);

  // Haptic feedback for interactions
  const triggerHaptic = useCallback(() => {
    try {
      Vibration.vibrate(50); // Light vibration feedback
    } catch (error) {
      // Vibration might not be available on all devices
      console.log('Vibration not available:', error);
    }
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    setLocalShowMediaOptions(false);
    setLocalShowEmojiPicker(false);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  const handleContentSizeChange = useCallback((event: any) => {
    const newHeight = event.nativeEvent.contentSize.height;
    setInputHeight(Math.min(Math.max(newHeight + 20, 44), 100));
  }, []);

  const toggleMediaOptions = useCallback(() => {
    triggerHaptic();
    const newState = !shouldShowMediaOptions;
    if (showMediaOptions === undefined) {
      setLocalShowMediaOptions(newState);
    }
    setLocalShowEmojiPicker(false);
    if (newState) {
      inputRef.current?.blur();
    }
  }, [shouldShowMediaOptions, showMediaOptions, triggerHaptic]);

  const toggleEmojiPicker = useCallback(() => {
    triggerHaptic();
    const newState = !shouldShowEmojiPicker;
    if (showEmojiPicker === undefined) {
      setLocalShowEmojiPicker(newState);
    }
    setLocalShowMediaOptions(false);
    if (newState) {
      inputRef.current?.blur();
    }
  }, [shouldShowEmojiPicker, showEmojiPicker, triggerHaptic]);

  const handleSend = useCallback(() => {
    if (!value.trim() || disabled || isSending) return;
    triggerHaptic();
    
    // Animate send button
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    onSend();
  }, [value, disabled, isSending, triggerHaptic, buttonScaleAnim, onSend]);

  const handleEmojiPress = useCallback((emoji: string) => {
    triggerHaptic();
    onChangeText(value + emoji);
    if (onEmojiPress) {
      onEmojiPress(emoji);
    }
    // Keep emoji picker open for multiple selections
    // setLocalShowEmojiPicker(false);
  }, [value, onChangeText, onEmojiPress, triggerHaptic]);

  const handleMediaOptionPress = useCallback((option: string) => {
    triggerHaptic();
    if (onMediaOptionPress) {
      onMediaOptionPress(option);
    } else {
      Alert.alert(option.charAt(0).toUpperCase() + option.slice(1), `${option.charAt(0).toUpperCase() + option.slice(1)} feature coming soon!`);
    }
    // Close media options after selection
    setLocalShowMediaOptions(false);
  }, [onMediaOptionPress, triggerHaptic]);

  const commonEmojis = ['😊', '👍', '❤️', '😂', '🔥', '💪', '🎯', '⭐', '🙏', '👏', '🎉', '🚀'];

  const mediaOptions = [
    { key: 'camera', icon: Camera, label: 'Camera' },
    { key: 'gallery', icon: Image, label: 'Gallery' },
    { key: 'document', icon: Paperclip, label: 'Document' },
    { key: 'voice', icon: Mic, label: 'Voice' },
  ];

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  const closeAllPickers = useCallback(() => {
    setLocalShowMediaOptions(false);
    setLocalShowEmojiPicker(false);
  }, []);

  return (
    <View style={[style]}>
      {/* Options Panel - Above input */}
      {(shouldShowMediaOptions || shouldShowEmojiPicker) && (
        <Animated.View
          style={[
            {
              backgroundColor: colors.card,
              marginHorizontal: 12,
              marginBottom: 8,
              borderRadius: 12,
              opacity: mediaPanelAnim,
              transform: [
                { 
                  translateY: mediaPanelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                },
                { 
                  scale: mediaPanelAnim.interpolate({
                    inputRange: [0, 1], 
                    outputRange: [0.95, 1],
                  })
                }
              ],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }
          ]}
        >
          {/* Panel Header */}
          <View style={[tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.px(4), spacing.py(2))]}>
            <Text style={[tw(text.sm, text.medium), { color: colors.foreground }]}>
              {shouldShowMediaOptions ? 'Share Media' : 'Quick Reactions'}
            </Text>
            <TouchableOpacity
              onPress={closeAllPickers}
              style={[tw(spacing.p(1), border.rounded), { backgroundColor: colors.muted }]}
              accessibilityLabel="Close picker"
              accessibilityRole="button"
            >
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Media Options */}
          {shouldShowMediaOptions && (
            <View style={[tw(layout.flexRow, spacing.px(4), spacing.pb(4), spacing.gap(3))]}>
              {mediaOptions.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => handleMediaOptionPress(option.key)}
                  style={({ pressed }) => [
                    tw(layout.flex1, spacing.py(4), spacing.px(3), border.rounded, layout.itemsCenter, spacing.gap(2)),
                    {
                      backgroundColor: pressed ? colors.primary + '15' : colors.muted,
                      borderWidth: 1.5,
                      borderColor: pressed ? colors.primary : colors.border,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    }
                  ]}
                  accessibilityLabel={`${option.label} option`}
                  accessibilityRole="button"
                >
                  <option.icon size={28} color={colors.primary} />
                  <Text style={[tw(text.xs, text.center, text.medium), { color: colors.foreground }]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Emoji Options */}
          {shouldShowEmojiPicker && (
            <View style={[tw(layout.flexRow, layout.flexWrap, spacing.px(4), spacing.pb(3), spacing.gap(2))]}>
              {commonEmojis.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleEmojiPress(emoji)}
                  style={({ pressed }) => [
                    tw(spacing.p(3), border.rounded),
                    {
                      backgroundColor: pressed ? colors.primary + '20' : colors.muted,
                      borderWidth: 1,
                      borderColor: pressed ? colors.primary : colors.border,
                      transform: [{ scale: pressed ? 1.1 : 1 }],
                      minWidth: 48,
                      minHeight: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }
                  ]}
                  accessibilityLabel={`${emoji} emoji`}
                  accessibilityRole="button"
                >
                  <Text style={tw(text.xl)}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* WhatsApp-style Input Row */}
      <View style={[
        tw(layout.flexRow, layout.itemsCenter, spacing.gap(3)),
        {
          paddingHorizontal: 8,
          paddingVertical: 6,
        }
      ]}>
        {/* Attachment Button - WhatsApp style */}
        <TouchableOpacity
          style={[
            {
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            }
          ]}
          onPress={toggleMediaOptions}
          disabled={disabled}
          accessibilityLabel="Attach media"
        >
          <Plus
            size={20}
            color={colors.primaryForeground}
            style={{ transform: [{ rotate: shouldShowMediaOptions ? '45deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {/* WhatsApp-style Text Input Container */}
        <View style={tw(layout.flex1)}>
          <Animated.View style={[
            {
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 40,
              maxHeight: 100,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }
          ]}>
            {/* Input Row - WhatsApp style */}
            <View style={tw(layout.flexRow, layout.itemsCenter)}>
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChangeText}
                onContentSizeChange={handleContentSizeChange}
                placeholder={placeholder}
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={maxLength}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                editable={!disabled}
                style={[
                  tw(layout.flex1),
                  {
                    color: colors.foreground,
                    fontSize: 16,
                    lineHeight: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    textAlignVertical: 'center',
                  }
                ]}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                returnKeyType="send"
                accessibilityLabel="Message input"
              />

              {/* Emoji Button - WhatsApp style */}
              <TouchableOpacity
                onPress={toggleEmojiPicker}
                style={[
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginRight: 4,
                  }
                ]}
                disabled={disabled}
                accessibilityLabel="Emoji picker"
              >
                <Smile
                  size={22}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

          </Animated.View>
        </View>

        {/* WhatsApp-style Send Button */}
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            style={[
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: canSend ? colors.primary : colors.muted,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isSending ? 0.7 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: canSend ? 0.2 : 0.1,
                shadowRadius: 2,
                elevation: canSend ? 3 : 1,
              }
            ]}
            accessibilityLabel="Send message"
          >
            {isSending ? (
              <View style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: colors.primaryForeground + '40',
                borderTopColor: colors.primaryForeground,
              }} />
            ) : (
              <Send
                size={18}
                color={canSend ? colors.primaryForeground : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default EnhancedChatInput;
