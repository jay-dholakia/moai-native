import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/theme-provider';
import { createStyles } from '@/utils/theme-styles';
import { checkUsernameAvailability, validateUsername } from '@/services/username-service';
import { InvitationService, InviteDetails } from '@/services/invitation-service';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkUsernameTimeout, setCheckUsernameTimeout] = useState<NodeJS.Timeout | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  const updateFormData = (field: string, value: string) => {
    console.log(`Form update - ${field}:`, value, `(length: ${value.length})`);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check for pending invite code on mount
  useEffect(() => {
    const checkPendingInvite = async () => {
      try {
        const pendingInviteCode = await AsyncStorage.getItem('pendingInviteCode');
        if (pendingInviteCode) {
          console.log('📝 [SIGNUP] Found pending invite code:', pendingInviteCode);
          setFormData(prev => ({ ...prev, inviteCode: pendingInviteCode }));
        }
      } catch (error) {
        console.error('❌ [SIGNUP] Error checking pending invite:', error);
      }
    };
    
    checkPendingInvite();
  }, []);

  // Invite code validation with debouncing
  useEffect(() => {
    const validateInviteCode = async () => {
      if (!formData.inviteCode.trim()) {
        setInviteDetails(null);
        setInviteError(null);
        return;
      }

      setIsCheckingInvite(true);
      setInviteError(null);

      try {
        const result = await InvitationService.getInviteDetails(formData.inviteCode.trim());
        if (result.success && result.data) {
          setInviteDetails(result.data);
          if (!result.data.is_valid) {
            if (result.data.is_expired) {
              setInviteError('This invite has expired');
            } else if (result.data.is_full) {
              setInviteError('This moai is full');
            } else {
              setInviteError('This invite is no longer valid');
            }
          }
        } else {
          setInviteError(result.error || 'Invalid invite code');
        }
      } catch (error) {
        console.error('❌ [SIGNUP] Error validating invite:', error);
        setInviteError('Error validating invite code');
      } finally {
        setIsCheckingInvite(false);
      }
    };

    const timeout = setTimeout(validateInviteCode, 500);
    return () => clearTimeout(timeout);
  }, [formData.inviteCode]);

  // Username validation with debouncing
  useEffect(() => {
    if (checkUsernameTimeout) {
      clearTimeout(checkUsernameTimeout);
    }

    if (!formData.username) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    const validationError = validateUsername(formData.username);
    if (validationError) {
      setUsernameStatus('invalid');
      setUsernameError(validationError);
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);

    const timeout = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailability(formData.username);
        if (isAvailable) {
          setUsernameStatus('available');
          setUsernameError(null);
        } else {
          setUsernameStatus('taken');
          setUsernameError('Username is already taken');
        }
      } catch (error) {
        setUsernameStatus('invalid');
        setUsernameError('Error checking username availability');
      }
    }, 500);

    setCheckUsernameTimeout(timeout as any);

    return () => {
      if (checkUsernameTimeout) {
        clearTimeout(checkUsernameTimeout);
      }
    };
  }, [formData.username]);

  const validateForm = () => {
    const { username, email, password, confirmPassword, inviteCode } = formData;
    
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (usernameStatus !== 'available') {
      Alert.alert('Error', 'Please choose a valid and available username');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 1) {
      console.log('Password validation failed. Length:', password.length, 'Password:', password);
      Alert.alert('Error', `Password must be at least 1 character long (current: ${password.length})`);
      return false;
    }

    // Validate invite code if provided
    if (inviteCode.trim()) {
      if (isCheckingInvite) {
        Alert.alert('Error', 'Please wait while we validate your invite code');
        return false;
      }
      
      if (inviteError) {
        Alert.alert('Error', `Invalid invite code: ${inviteError}`);
        return false;
      }
      
      if (!inviteDetails?.is_valid) {
        Alert.alert('Error', 'The invite code is not valid or has expired');
        return false;
      }
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Store invite code for after authentication if provided
      if (formData.inviteCode.trim()) {
        await AsyncStorage.setItem('pendingInviteCode', formData.inviteCode.trim());
        console.log('📝 [SIGNUP] Stored pending invite code for after auth');
      }

      const result = await signUp(
        formData.email.trim(),
        formData.password,
        {
          username: formData.username.trim().toLowerCase(),
        }
      );
      
      if (result.success) {
        const successMessage = inviteDetails?.is_valid 
          ? `Account created! Please check your email to verify your account. You'll be able to join "${inviteDetails.moai_name}" after verification.`
          : 'Account created! Please check your email to verify your account.';

        Alert.alert(
          'Welcome to Moai!',
          successMessage,
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView 
      style={tw(layout.flex1)} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView 
        style={tw(layout.flex1, { backgroundColor: colors.background })}
        contentContainerStyle={tw(spacing.px(6), spacing.py(8))}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={tw(spacing.mb(8), layout.itemsCenter)}>
          <Text style={tw(text['3xl'], text.bold, { color: colors.foreground, marginBottom: 8 })}>
            {inviteDetails?.is_valid && inviteDetails.moai_name 
              ? `Join ${inviteDetails.moai_name}`
              : 'Join Moai'
            }
          </Text>
          <Text style={tw(text.lg, text.center, { color: colors.mutedForeground, lineHeight: 24 })}>
            {inviteDetails?.is_valid && inviteDetails.inviter_name 
              ? `${inviteDetails.inviter_name} invited you to join their wellness community`
              : 'Create your account to get started'
            }
          </Text>
        </View>

        {/* Form */}
        <View style={tw(spacing.gap(4))}>
          {/* Username Field */}
          <View>
            <Text style={tw(text.sm, text.medium, spacing.mb(2), { color: colors.foreground })}>
              Username
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
                placeholder="username"
                placeholderTextColor={colors.mutedForeground}
                value={formData.username}
                onChangeText={(value) => updateFormData('username', value)}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {usernameStatus === 'checking' && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
              {usernameStatus === 'available' && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
              )}
              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </View>
              )}
            </View>
            {usernameError && (
              <Text style={[{ color: '#EF4444', fontSize: 14, marginTop: 4 }]}>
                {usernameError}
              </Text>
            )}
          </View>

          {/* Email Input */}
          <View>
            <Text style={[styles.textSm, styles.fontMedium, styles.textForeground, styles.mb2]}>
              Email
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.mutedForeground}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Invite Code Input */}
          <View>
            <Text style={[styles.textSm, styles.fontMedium, styles.textForeground, styles.mb2]}>
              Invite Code (Optional)
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Enter invite code"
                placeholderTextColor={colors.mutedForeground}
                value={formData.inviteCode}
                onChangeText={(value) => updateFormData('inviteCode', value)}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
              />
              {isCheckingInvite && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
              {inviteDetails?.is_valid && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
              )}
              {inviteError && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </View>
              )}
            </View>
            {inviteError && (
              <Text style={[{ color: '#EF4444', fontSize: 14, marginTop: 4 }]}>
                {inviteError}
              </Text>
            )}
            {inviteDetails?.is_valid && (
              <View style={[{ marginTop: 8, padding: 12, backgroundColor: colors.primary + '20', borderRadius: 8 }]}>
                <Text style={[{ fontSize: 14, fontWeight: '500', color: colors.primary }]}>
                  You're invited to join "{inviteDetails.moai_name}"
                </Text>
                <Text style={[{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }]}>
                  by {inviteDetails.inviter_name}
                </Text>
                {inviteDetails.member_names && inviteDetails.member_names.length > 0 && (
                  <Text style={[{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }]}>
                    Current members: {inviteDetails.member_names.slice(0, 3).join(', ')}
                    {inviteDetails.member_names.length > 3 && ` +${inviteDetails.member_names.length - 3} more`}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Password Input */}
          <View>
            <Text style={[styles.textSm, styles.fontMedium, styles.textForeground, styles.mb2]}>
              Password
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={colors.mutedForeground}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={false}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
                keyboardType="default"
                spellCheck={false}
                clearTextOnFocus={false}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 12, top: 12 }}
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

          {/* Confirm Password Input */}
          <View>
            <Text style={[styles.textSm, styles.fontMedium, styles.textForeground, styles.mb2]}>
              Confirm Password
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={colors.mutedForeground}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
                keyboardType="default"
                spellCheck={false}
                clearTextOnFocus={false}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 12, top: 12 }}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <Ionicons name="eye-off" size={20} color={colors.mutedForeground} />
                ) : (
                  <Ionicons name="eye" size={20} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.button,
              styles.bgPrimary,
              styles.mt6,
              { opacity: isLoading ? 0.7 : 1 }
            ]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={[styles.textBase, styles.fontMedium, styles.textPrimaryForeground]}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={[styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.mt6]}>
            <Text style={[styles.textSm, styles.textMuted]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
              <Text style={[styles.textSm, styles.fontMedium, styles.textPrimary]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}