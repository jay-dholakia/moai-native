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
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.success) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignUp = () => {
    router.push('/(auth)/signup');
  };

  const navigateToForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <KeyboardAvoidingView 
      style={tw(layout.flex1)} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView 
        style={tw(layout.flex1, { backgroundColor: colors.background })}
        contentContainerStyle={tw(layout.justifyCenter, spacing.px(6), { minHeight: '100%' })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={tw(spacing.py(12))}>
          {/* Header */}
          <View style={tw(spacing.mb(8), layout.itemsCenter)}>
            <Text style={tw(text['3xl'], text.bold, spacing.mb(2), { color: colors.foreground })}>
              Welcome Back
            </Text>
            <Text style={tw(text.lg, text.center, { color: colors.mutedForeground, lineHeight: 24 })}>
              Sign in to continue to Moai
            </Text>
          </View>

          {/* Form */}
          <View style={tw(spacing.gap(5))}>
            {/* Email Input */}
            <View>
              <Text style={tw(text.sm, text.medium, spacing.mb(2), { color: colors.foreground })}>
                Email
              </Text>
              <TextInput
                style={tw(spacing.p(4), border.rounded, text.base, {
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  minHeight: 48,
                })}
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

            {/* Password Input */}
            <View>
              <Text style={tw(text.sm, text.medium, spacing.mb(2), { color: colors.foreground })}>
                Password
              </Text>
              <View style={tw({ position: 'relative' })}>
                <TextInput
                  style={tw(spacing.p(4), spacing.pr(12), border.rounded, text.base, {
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    minHeight: 48,
                  })}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={tw({ position: 'absolute', right: 12, top: 14 })}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <Ionicons name="eye-off" size={20} color={colors.mutedForeground} />
                  ) : (
                    <Ionicons name="eye" size={20} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={tw({ alignSelf: 'flex-end' })}
              onPress={navigateToForgotPassword}
              disabled={isLoading}
            >
              <Text style={tw(text.sm, { color: colors.primary })}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={tw(spacing.p(4), spacing.mt(2), border.rounded, {
                backgroundColor: colors.primary,
                minHeight: 48,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isLoading ? 0.7 : 1,
              })}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={tw(text.base, text.medium, { color: colors.primaryForeground })}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.my(6))}>
              <View style={tw(layout.flex1, { height: 1, backgroundColor: colors.border })} />
              <Text style={tw(text.sm, spacing.mx(4), { color: colors.mutedForeground })}>
                or
              </Text>
              <View style={tw(layout.flex1, { height: 1, backgroundColor: colors.border })} />
            </View>

            {/* Sign Up Link */}
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.mt(4))}>
              <Text style={tw(text.sm, { color: colors.mutedForeground })}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
                <Text style={tw(text.sm, text.medium, { color: colors.primary })}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}