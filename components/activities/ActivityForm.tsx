import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { 
  X, 
  Clock, 
  Zap, 
  MapPin, 
  Target, 
  Weight, 
  TrendingUp,
  Calendar,
  Plus
} from 'lucide-react-native';

import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, bg, layout, border } from '@/utils/styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useCreateActivity, useActivityTypes } from '@/hooks/use-activities';
import { useUserMoais } from '@/hooks/use-moai';
import { CreateActivityData } from '@/services/activity-service';

interface ActivityFormProps {
  visible: boolean;
  onClose: () => void;
  preselectedMoaiId?: string;
  preselectedActivityType?: string;
}

interface FormData {
  activity_type: string;
  name: string;
  description: string;
  duration_minutes: string;
  calories_burned: string;
  distance: string;
  steps: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
  moai_id: string;
}

export const ActivityForm = ({
  visible,
  onClose,
  preselectedMoaiId,
  preselectedActivityType,
}: ActivityFormProps) => {
  const { theme, colors } = useTheme();
  const { types: activityTypes, getEmoji } = useActivityTypes();
  const { userMoais } = useUserMoais();
  const createActivity = useCreateActivity();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [formData, setFormData] = useState<FormData>({
    activity_type: preselectedActivityType || '',
    name: '',
    description: '',
    duration_minutes: '',
    calories_burned: '',
    distance: '',
    steps: '',
    sets: '',
    reps: '',
    weight: '',
    notes: '',
    moai_id: preselectedMoaiId || '',
  });

  const [showActivityTypePicker, setShowActivityTypePicker] = useState(false);
  const [showMoaiPicker, setShowMoaiPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill name if activity type is selected and name is empty
    if (field === 'activity_type' && !formData.name.trim()) {
      setFormData(prev => ({ ...prev, name: value }));
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.activity_type.trim()) {
      Alert.alert('Validation Error', 'Please select an activity type');
      return;
    }
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter an activity name');
      return;
    }

    const activityData: CreateActivityData = {
      activity_type: formData.activity_type,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
      calories_burned: formData.calories_burned ? parseInt(formData.calories_burned) : undefined,
      distance: formData.distance ? parseFloat(formData.distance) : undefined,
      steps: formData.steps ? parseInt(formData.steps) : undefined,
      sets: formData.sets ? parseInt(formData.sets) : undefined,
      reps: formData.reps ? parseInt(formData.reps) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      notes: formData.notes.trim() || undefined,
      moai_id: formData.moai_id || undefined,
    };

    try {
      const response = await createActivity.mutateAsync(activityData);
      
      if (response.success) {
        Alert.alert('Success', 'Activity logged successfully!', [
          { text: 'OK', onPress: handleClose }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to log activity');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log activity');
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      activity_type: preselectedActivityType || '',
      name: '',
      description: '',
      duration_minutes: '',
      calories_burned: '',
      distance: '',
      steps: '',
      sets: '',
      reps: '',
      weight: '',
      notes: '',
      moai_id: preselectedMoaiId || '',
    });
    onClose();
  };

  const renderMoaiPicker = () => {
    const moais = userMoais?.pages?.flatMap(page => page.data) || [];
    
    return (
      <Modal visible={showMoaiPicker} transparent animationType="slide">
        <View style={tw(layout.flex1, layout.justifyEnd)}>
          <View style={[
            tw(spacing.p(6), border.rounded),
            { backgroundColor: colors.card, maxHeight: '60%' }
          ]}>
            <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
              <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
                Select Moai
              </Text>
              <TouchableOpacity onPress={() => setShowMoaiPicker(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  tw(spacing.p(4), border.rounded, spacing.mb(2)),
                  { backgroundColor: !formData.moai_id ? colors.primary + '20' : colors.muted }
                ]}
                onPress={() => {
                  handleInputChange('moai_id', '');
                  setShowMoaiPicker(false);
                }}
              >
                <Text style={[tw(text.base), { color: colors.foreground }]}>
                  Personal Activity (No Moai)
                </Text>
              </TouchableOpacity>
              
              {moais.map((moai) => (
                <TouchableOpacity
                  key={moai.id}
                  style={[
                    tw(spacing.p(4), border.rounded, spacing.mb(2)),
                    { backgroundColor: formData.moai_id === moai.id ? colors.primary + '20' : colors.muted }
                  ]}
                  onPress={() => {
                    handleInputChange('moai_id', moai.id);
                    setShowMoaiPicker(false);
                  }}
                >
                  <Text style={[tw(text.base, text.semibold), { color: colors.foreground }]}>
                    {moai.name}
                  </Text>
                  <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
                    {moai.description || 'No description'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderActivityTypePicker = () => (
    <Modal visible={showActivityTypePicker} transparent animationType="slide">
      <View style={tw(layout.flex1, layout.justifyEnd)}>
        <View style={[
          tw(spacing.p(6), border.rounded),
          { backgroundColor: colors.card, maxHeight: '70%' }
        ]}>
          <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(4))}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Select Activity Type
            </Text>
            <TouchableOpacity onPress={() => setShowActivityTypePicker(false)}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(2))}>
              {activityTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    tw(spacing.p(3), border.rounded, layout.flexRow, layout.itemsCenter),
                    { 
                      backgroundColor: formData.activity_type === type ? colors.primary + '20' : colors.muted,
                      marginBottom: 8,
                    }
                  ]}
                  onPress={() => {
                    handleInputChange('activity_type', type);
                    setShowActivityTypePicker(false);
                  }}
                >
                  <Text style={tw(text.base, spacing.mr(2))}>{getEmoji(type)}</Text>
                  <Text style={[tw(text.sm), { color: colors.foreground }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const getSelectedMoaiName = () => {
    if (!formData.moai_id) return 'Personal Activity';
    const moais = userMoais?.pages?.flatMap(page => page.data) || [];
    const selectedMoai = moais.find(m => m.id === formData.moai_id);
    return selectedMoai?.name || 'Unknown Moai';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView 
        style={tw(layout.flex1)} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          style={[
            tw(layout.flex1),
            { backgroundColor: colors.background, opacity: fadeAnim }
          ]}
        >
          {/* Header */}
          <View style={[
            tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(6), spacing.pt(12)),
            { 
              backgroundColor: colors.background,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }
          ]}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
            
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Log Activity
            </Text>
            
            <Button
              variant="gradient"
              size="sm"
              onPress={handleSubmit}
              loading={createActivity.isPending}
              disabled={!formData.activity_type || !formData.name.trim()}
            >
              Save
            </Button>
          </View>

          <Animated.ScrollView 
            style={[tw(layout.flex1), { transform: [{ translateY: slideAnim }] }]}
            contentContainerStyle={tw(spacing.p(6))}
            showsVerticalScrollIndicator={false}
          >
            {/* Activity Type Selection */}
            <Card style={tw(spacing.mb(6))}>
              <CardHeader>
                <CardTitle>Activity Details</CardTitle>
              </CardHeader>
              <CardContent>
                <TouchableOpacity
                  style={[
                    tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter, layout.justifyBetween),
                    { backgroundColor: colors.muted }
                  ]}
                  onPress={() => setShowActivityTypePicker(true)}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter)}>
                    {formData.activity_type && (
                      <Text style={tw(text.lg, spacing.mr(3))}>
                        {getEmoji(formData.activity_type)}
                      </Text>
                    )}
                    <Text style={[tw(text.base), { color: colors.foreground }]}>
                      {formData.activity_type || 'Select Activity Type'}
                    </Text>
                  </View>
                  <Plus size={20} color={colors.mutedForeground} />
                </TouchableOpacity>

                <View style={tw(spacing.mt(4))}>
                  <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                    Activity Name
                  </Text>
                  <Input
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    placeholder="e.g., Morning Run, Chest & Triceps"
                    style={tw(spacing.mb(4))}
                  />
                </View>

                <View>
                  <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                    Description (Optional)
                  </Text>
                  <Input
                    value={formData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    placeholder="Add details about your workout..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card style={tw(spacing.mb(6))}>
              <CardHeader>
                <CardTitle>Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(4))}>
                  <View style={[tw(layout.flex1), { minWidth: '45%' }]}>
                    <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                      <Clock size={14} color={colors.primary} /> Duration (min)
                    </Text>
                    <Input
                      value={formData.duration_minutes}
                      onChangeText={(value) => handleInputChange('duration_minutes', value)}
                      placeholder="30"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[tw(layout.flex1), { minWidth: '45%' }]}>
                    <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                      <Zap size={14} color={colors.primary} /> Calories
                    </Text>
                    <Input
                      value={formData.calories_burned}
                      onChangeText={(value) => handleInputChange('calories_burned', value)}
                      placeholder="250"
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Show distance for cardio activities */}
                  {['Running', 'Walking', 'Cycling', 'Swimming'].includes(formData.activity_type) && (
                    <View style={[tw(layout.flex1), { minWidth: '45%' }]}>
                      <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                        <MapPin size={14} color={colors.primary} /> Distance (km)
                      </Text>
                      <Input
                        value={formData.distance}
                        onChangeText={(value) => handleInputChange('distance', value)}
                        placeholder="5.2"
                        keyboardType="numeric"
                      />
                    </View>
                  )}

                  {/* Show steps for walking/running */}
                  {['Running', 'Walking'].includes(formData.activity_type) && (
                    <View style={[tw(layout.flex1), { minWidth: '45%' }]}>
                      <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                        <TrendingUp size={14} color={colors.primary} /> Steps
                      </Text>
                      <Input
                        value={formData.steps}
                        onChangeText={(value) => handleInputChange('steps', value)}
                        placeholder="8500"
                        keyboardType="numeric"
                      />
                    </View>
                  )}

                  {/* Show sets/reps/weight for strength training */}
                  {['Strength Training', 'CrossFit', 'Boxing'].includes(formData.activity_type) && (
                    <>
                      <View style={[tw(layout.flex1), { minWidth: '30%' }]}>
                        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                          <Target size={14} color={colors.primary} /> Sets
                        </Text>
                        <Input
                          value={formData.sets}
                          onChangeText={(value) => handleInputChange('sets', value)}
                          placeholder="3"
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={[tw(layout.flex1), { minWidth: '30%' }]}>
                        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                          Reps
                        </Text>
                        <Input
                          value={formData.reps}
                          onChangeText={(value) => handleInputChange('reps', value)}
                          placeholder="12"
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={[tw(layout.flex1), { minWidth: '30%' }]}>
                        <Text style={[tw(text.sm, text.semibold, spacing.mb(2)), { color: colors.foreground }]}>
                          <Weight size={14} color={colors.primary} /> Weight (lbs)
                        </Text>
                        <Input
                          value={formData.weight}
                          onChangeText={(value) => handleInputChange('weight', value)}
                          placeholder="135"
                          keyboardType="numeric"
                        />
                      </View>
                    </>
                  )}
                </View>
              </CardContent>
            </Card>

            {/* Moai Selection */}
            <Card style={tw(spacing.mb(6))}>
              <CardHeader>
                <CardTitle>Moai Context</CardTitle>
              </CardHeader>
              <CardContent>
                <TouchableOpacity
                  style={[
                    tw(spacing.p(4), border.rounded, layout.flexRow, layout.itemsCenter, layout.justifyBetween),
                    { backgroundColor: colors.muted }
                  ]}
                  onPress={() => setShowMoaiPicker(true)}
                >
                  <Text style={[tw(text.base), { color: colors.foreground }]}>
                    {getSelectedMoaiName()}
                  </Text>
                  <Plus size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card style={tw(spacing.mb(6))}>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.notes}
                  onChangeText={(value) => handleInputChange('notes', value)}
                  placeholder="How did it feel? Any observations..."
                  multiline
                  numberOfLines={4}
                />
              </CardContent>
            </Card>

            {/* Bottom spacing */}
            <View style={tw(spacing.h(8))} />
          </Animated.ScrollView>
        </Animated.View>

        {renderActivityTypePicker()}
        {renderMoaiPicker()}
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ActivityForm;