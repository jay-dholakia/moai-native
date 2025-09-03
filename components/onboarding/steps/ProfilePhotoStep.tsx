import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTheme } from '@/providers/theme-provider';
import { StepProps } from '@/types/onboarding';
import { border, layout, spacing, text, tw } from '@/utils/styles';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, User, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';

export const ProfilePhotoStep = ({ 
  formData, 
  onChange 
}: StepProps) => {
  const { colors } = useTheme();
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to set your profile photo.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setIsUploading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Convert to File-like object for React Native
        const file = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any;
        
        onChange('profileImage', file);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setIsUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Convert to File-like object for React Native
        const file = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any;
        
        onChange('profileImage', file);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose how you\'d like to add your profile photo',
      [
        { text: 'Take Photo', onPress: pickImageFromCamera },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => onChange('profileImage', null) },
      ]
    );
  };

  return (
    <View>
      <Card>
        <CardHeader>
          <View style={tw(layout.flexRow, layout.itemsCenter, spacing.mb(2))}>
            <View style={[
              tw(spacing.p(2), spacing.mr(3)),
              {
                backgroundColor: colors.primary + '20',
                borderRadius: 8,
              }
            ]}>
              <Video size={24} color={colors.primary} />
            </View>
            <View style={tw(layout.flex1)}>
              <CardTitle>Profile Photo</CardTitle>
              <Text style={[tw(text.sm, spacing.mt(1)), { color: colors.mutedForeground }]}>
                Add a photo to help others recognize you (optional)
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={tw(layout.itemsCenter, spacing.py(8))}>
            {/* Photo Preview */}
            <View style={[
              tw(border.rounded, layout.itemsCenter, layout.justifyCenter, spacing.mb(6)),
            { width: 128, height: 128 },
              {
                backgroundColor: colors.muted,
                borderWidth: 2,
                borderColor: colors.border,
                borderStyle: 'dashed',
              }
            ]}>
              {formData.profileImage ? (
                <Image 
                  source={{ uri: (formData.profileImage as any)?.uri }}
                  style={[
                    { width: '100%', height: '100%', borderRadius: 8 }
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View style={tw(layout.itemsCenter)}>
                  <User size={48} color={colors.mutedForeground} />
                  <Text style={[tw(text.sm, spacing.mt(2)), { color: colors.mutedForeground }]}>
                    No photo selected
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={tw(layout.itemsCenter, spacing.gap(3))}>
              {!formData.profileImage ? (
                <TouchableOpacity
                  onPress={showImagePickerOptions}
                  disabled={isUploading}
                  style={[
                    tw(layout.flexRow, layout.itemsCenter, spacing.px(6), spacing.py(3), border.rounded),
                    {
                      backgroundColor: colors.primary,
                      opacity: isUploading ? 0.7 : 1,
                    }
                  ]}
                >
                  <Upload size={20} color="#FFFFFF" style={tw(spacing.mr(2))} />
                  <Text style={[tw(text.base, text.medium), { color: '#FFFFFF' }]}>
                    {isUploading ? 'Processing...' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={tw(layout.flexRow, spacing.gap(3))}>
                  <TouchableOpacity
                    onPress={showImagePickerOptions}
                    disabled={isUploading}
                    style={[
                      tw(layout.flexRow, layout.itemsCenter, spacing.px(4), spacing.py(2), border.rounded),
                      {
                        backgroundColor: colors.primary,
                        opacity: isUploading ? 0.7 : 1,
                      }
                    ]}
                  >
                    <Camera size={16} color="#FFFFFF" style={tw(spacing.mr(2))} />
                    <Text style={[tw(text.sm, text.medium), { color: '#FFFFFF' }]}>
                      Change
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={removePhoto}
                    style={[
                      tw(layout.flexRow, layout.itemsCenter, spacing.px(4), spacing.py(2), border.rounded),
                      {
                        backgroundColor: colors.muted,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }
                    ]}
                  >
                    <Text style={[tw(text.sm), { color: colors.foreground }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Help Text */}
            <Text style={[tw(text.xs, text.center, spacing.mt(4), spacing.px(4)), { color: colors.mutedForeground }]}>
              Your profile photo helps build trust within your Moai community. 
              You can always change or remove it later.
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};