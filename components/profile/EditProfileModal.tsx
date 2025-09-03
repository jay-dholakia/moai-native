import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/Button';

interface ProfileFormData {
  username: string;
  first_name: string;
  last_name: string;
  age: string;
  gender: string;
  phone_number: string;
  city: string;
  state: string;
  profile_image: string;
}

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isVisible,
  onClose,
}) => {
  const { theme, colors } = useTheme();
  const { userProfile, updateProfile, isUpdatingProfile } = useProfile();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    first_name: '',
    last_name: '',
    age: '',
    gender: '',
    phone_number: '',
    city: '',
    state: '',
    profile_image: ''
  });

  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  
  // Mock hobbies for now - should be replaced with actual hook
  const mockHobbies = [
    { id: '1', name: 'Running', icon: '🏃‍♂️' },
    { id: '2', name: 'Yoga', icon: '🧘‍♀️' },
    { id: '3', name: 'Weightlifting', icon: '🏋️‍♂️' },
    { id: '4', name: 'Cycling', icon: '🚴‍♂️' },
    { id: '5', name: 'Swimming', icon: '🏊‍♂️' },
    { id: '6', name: 'Hiking', icon: '🥾' },
  ];

  // Load user data when modal opens
  useEffect(() => {
    if (userProfile.data && isVisible) {
      const profile = userProfile.data;
      setFormData({
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        phone_number: profile.phone_number || '',
        city: profile.city || '',
        state: profile.state || '',
        profile_image: profile.profile_image || ''
      });
      setSelectedHobbies(profile.hobbies || []);
    }
  }, [userProfile.data, isVisible]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleHobby = (hobbyName: string) => {
    setSelectedHobbies(prev => 
      prev.includes(hobbyName)
        ? prev.filter(h => h !== hobbyName)
        : [...prev, hobbyName]
    );
  };

  const handleSave = async () => {
    try {
      const updatedProfile = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        phone_number: formData.phone_number,
        city: formData.city,
        state: formData.state,
        hobbies: selectedHobbies,
      };

      await updateProfile(updatedProfile);
      Alert.alert('Success', 'Your profile has been updated successfully!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const userInitials = `${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
        {/* Header */}
        <View 
          style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), spacing.pt(12)),
            { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }
          ]}
        >
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={tw(text.lg, text.bold, text.foreground(theme))}>
            Edit Profile
          </Text>
          <View style={tw(spacing.w(6))} />
        </View>

        <ScrollView
          style={tw(layout.flex1)}
          contentContainerStyle={tw(spacing.p(4), spacing.pb(20))}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Section */}
          <View style={tw(layout.itemsCenter, spacing.mb(6))}>
            <View
              style={[
                tw(
                  layout.itemsCenter,
                  layout.justifyCenter,
                  border.roundedFull
                ),
                {
                  width: 100,
                  height: 100,
                  backgroundColor: colors.primary,
                }
              ]}
            >
              <Text style={[tw(text['2xl'], text.bold), { color: colors.primaryForeground }]}>
                {userInitials || 'U'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                tw(spacing.px(4), spacing.py(2), border.rounded, spacing.mt(3)),
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
              ]}
            >
              <Text style={tw(text.sm, text.primary)}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Personal Information */}
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(4))}>
              <Ionicons name="person" size={16} color={colors.primary} />
              <Text style={tw(text.base, text.semibold, text.foreground(theme))}>
                Personal Details
              </Text>
            </View>

            <View style={tw(spacing.mb(4))}>
              <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
                Username
              </Text>
              <TextInput
                style={[
                  tw(spacing.p(3), border.rounded),
                  { 
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }
                ]}
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                placeholder="@username"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(4))}>
              <View style={tw(layout.flex1)}>
                <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
                  First Name
                </Text>
                <TextInput
                  style={[
                    tw(spacing.p(3), border.rounded),
                    { 
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.foreground,
                    }
                  ]}
                  value={formData.first_name}
                  onChangeText={(value) => handleInputChange('first_name', value)}
                  placeholder="First name"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={tw(layout.flex1)}>
                <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
                  Last Name
                </Text>
                <TextInput
                  style={[
                    tw(spacing.p(3), border.rounded),
                    { 
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.foreground,
                    }
                  ]}
                  value={formData.last_name}
                  onChangeText={(value) => handleInputChange('last_name', value)}
                  placeholder="Last name"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={tw(layout.flexRow, spacing.gap(3), spacing.mb(4))}>
              <View style={tw(layout.flex1)}>
                <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
                  Age
                </Text>
                <TextInput
                  style={[
                    tw(spacing.p(3), border.rounded),
                    { 
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.foreground,
                    }
                  ]}
                  value={formData.age}
                  onChangeText={(value) => handleInputChange('age', value)}
                  placeholder="Age"
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={tw(layout.flex1)}>
                <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
                  Gender
                </Text>
                <TextInput
                  style={[
                    tw(spacing.p(3), border.rounded),
                    { 
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.foreground,
                    }
                  ]}
                  value={formData.gender}
                  onChangeText={(value) => handleInputChange('gender', value)}
                  placeholder="Gender"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          </View>

          {/* Contact & Location */}
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(4))}>
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text style={tw(text.base, text.semibold, text.foreground(theme))}>
                Contact & Location
              </Text>
            </View>

            <View style={tw(spacing.mb(4))}>
              <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  tw(spacing.p(3), border.rounded),
                  { 
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }
                ]}
                value={formData.phone_number}
                onChangeText={(value) => handleInputChange('phone_number', value)}
                placeholder="Phone number"
                keyboardType="phone-pad"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={tw(layout.flexRow, spacing.gap(3))}>
              <View style={tw(layout.flex1)}>
                <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
                  City
                </Text>
                <TextInput
                  style={[
                    tw(spacing.p(3), border.rounded),
                    { 
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.foreground,
                    }
                  ]}
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  placeholder="City"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={tw(layout.flex1)}>
                <Text style={tw(text.sm, text.foreground(theme), spacing.mb(2))}>
                  State
                </Text>
                <TextInput
                  style={[
                    tw(spacing.p(3), border.rounded),
                    { 
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.foreground,
                    }
                  ]}
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                  placeholder="State"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          </View>

          {/* Interests */}
          <View style={tw(spacing.mb(6))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2), spacing.mb(4))}>
              <Ionicons name="heart" size={16} color={colors.accent} />
              <Text style={tw(text.base, text.semibold, text.foreground(theme))}>
                Your Interests
              </Text>
            </View>
            
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
              {mockHobbies.map((hobby) => (
                <TouchableOpacity
                  key={hobby.id}
                  style={[
                    tw(spacing.px(3), spacing.py(2), border.rounded),
                    {
                      backgroundColor: selectedHobbies.includes(hobby.name) 
                        ? colors.primary 
                        : colors.card,
                      borderWidth: 1,
                      borderColor: selectedHobbies.includes(hobby.name) 
                        ? colors.primary 
                        : colors.border,
                    }
                  ]}
                  onPress={() => toggleHobby(hobby.name)}
                >
                  <Text
                    style={[
                      tw(text.sm),
                      { 
                        color: selectedHobbies.includes(hobby.name) 
                          ? colors.primaryForeground 
                          : colors.foreground 
                      }
                    ]}
                  >
                    {hobby.icon} {hobby.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <Button
            onPress={handleSave}
            disabled={isUpdatingProfile}
            style={tw(spacing.mt(4))}
          >
            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </ScrollView>
      </View>
    </Modal>
  );
};