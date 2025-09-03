import { useTheme } from '@/providers/theme-provider';
import { layout, spacing, text, tw } from '@/utils/styles';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { EnhancedChatInput } from './EnhancedChatInput';

export const ChatInputDemo: React.FC = () => {
  const { theme, colors } = useTheme();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Message sent:', message);
    setMessage('');
    setIsSending(false);
  };

  const handleMediaOptionPress = (option: string) => {
    Alert.alert(
      'Media Option Selected',
      `You selected: ${option}\n\nThis is a demo of the enhanced chat input component.`,
      [{ text: 'OK' }]
    );
  };

  const handleEmojiPress = (emoji: string) => {
    console.log('Emoji selected:', emoji);
  };

  return (
    <ScrollView 
      style={tw(layout.flex1, { backgroundColor: colors.background })}
      contentContainerStyle={tw(spacing.p(6))}
    >
      <Text style={[tw(text['2xl'], text.bold, spacing.mb(6)), { color: colors.foreground }]}>
        Enhanced Chat Input Demo
      </Text>
      
      <Text style={[tw(text.base, spacing.mb(8)), { color: colors.mutedForeground }]}>
        This demo showcases the enhanced chat input component with modern UI/UX features including:
        {'\n'}• Animated input height expansion
        {'\n'}• Media options panel (Camera, Gallery, Document, Voice)
        {'\n'}• Emoji picker with common emojis
        {'\n'}• Character count display
        {'\n'}• Enhanced send button with visual feedback
        {'\n'}• Smooth animations and transitions
      </Text>

      <View style={tw(spacing.mb(8))}>
        <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
          Basic Chat Input
        </Text>
        <EnhancedChatInput
          value={message}
          onChangeText={setMessage}
          onSend={handleSend}
          placeholder="Try typing a message..."
          maxLength={500}
          isSending={isSending}
        />
      </View>

      <View style={tw(spacing.mb(8))}>
        <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
          Chat Input with Custom Media Handler
        </Text>
        <EnhancedChatInput
          value=""
          onChangeText={() => {}}
          onSend={() => {}}
          placeholder="Tap media button to see custom handler..."
          showMediaOptions={false}
          onMediaOptionPress={handleMediaOptionPress}
        />
      </View>

      <View style={tw(spacing.mb(8))}>
        <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
          Disabled Chat Input
        </Text>
        <EnhancedChatInput
          value="This input is disabled"
          onChangeText={() => {}}
          onSend={() => {}}
          placeholder="This input is disabled"
          disabled={true}
        />
      </View>

      <View style={tw(spacing.mb(8))}>
        <Text style={[tw(text.lg, text.semibold, spacing.mb(4)), { color: colors.foreground }]}>
          Features
        </Text>
        <View style={tw(spacing.gap(3))}>
          {[
            '🎨 Modern Material Design-inspired UI',
            '📱 Responsive input height with smooth animations',
            '📎 Media options panel with icons and labels',
            '😊 Emoji picker with common emojis',
            '🔢 Character count display',
            '📤 Enhanced send button with visual states',
            '🎭 Smooth fade and scale animations',
            '♿ Accessibility-friendly with proper focus states',
            '🎨 Theme-aware colors and styling',
            '📱 Cross-platform compatibility'
          ].map((feature, index) => (
            <View key={index} style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <Text style={tw(text.lg)}>{feature.split(' ')[0]}</Text>
              <Text style={[tw(text.base), { color: colors.foreground }]}>
                {feature.split(' ').slice(1).join(' ')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default ChatInputDemo;
