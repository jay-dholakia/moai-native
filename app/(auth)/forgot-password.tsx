import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, bg, border, layout } from '@/utils/styles';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  
  const { resetPassword } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.success) {
        setIsEmailSent(true);
      }
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  if (isEmailSent) {
    return (
      <View style={tw(layout.flex1, bg.background(theme), layout.justifyCenter, spacing.px(6))}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        
        <View style={tw(layout.itemsCenter, spacing.py(8))}>
          <Text style={tw(text['3xl'], text.bold, text.foreground(theme), spacing.mb(4))}>
            Check Your Email
          </Text>
          
          <Text style={tw(text.base, text.muted(theme), text.center, spacing.mb(8))}>
            We've sent a password reset link to {email}. Please check your email and follow the instructions to reset your password.
          </Text>
          
          <TouchableOpacity
            style={[
              tw(
                spacing.py(4),
                spacing.px(8),
                border.rounded,
                layout.itemsCenter,
                layout.justifyCenter
              ),
              { backgroundColor: colors.primary }
            ]}
            onPress={navigateToLogin}
          >
            <Text style={[tw(text.base, text.medium), { color: colors.primaryForeground }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={tw(layout.flex1)} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView 
        style={tw(layout.flex1, bg.background(theme))}
        contentContainerStyle={tw(layout.justifyCenter, spacing.px(6))}
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw(spacing.py(12))}>
          {/* Header */}
          <View style={tw(spacing.mb(8), layout.itemsCenter)}>
            <Text style={tw(text['3xl'], text.bold, text.foreground(theme), spacing.mb(2))}>
              Reset Password
            </Text>
            <Text style={tw(text.lg, text.muted(theme), text.center)}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={tw(spacing.gap(6))}>
            {/* Email Input */}
            <View>
              <Text style={tw(text.sm, text.medium, text.foreground(theme), spacing.mb(2))}>
                Email
              </Text>
              <TextInput
                style={[
                  tw(
                    spacing.px(4),
                    spacing.py(3),
                    border.border,
                    border.rounded,
                    text.base,
                    bg.background(theme)
                  ),
                  { 
                    borderColor: colors.border,
                    color: colors.foreground,
                    minHeight: 48,
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                tw(
                  spacing.py(4),
                  border.rounded,
                  layout.itemsCenter,
                  layout.justifyCenter
                ),
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                }
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={[tw(text.base, text.medium), { color: colors.primaryForeground }]}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.mt(4))}>
              <Text style={tw(text.sm, text.muted(theme))}>
                Remember your password?{' '}
              </Text>
              <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
                <Text style={tw(text.sm, text.medium, text.primary(theme))}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}