import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Avatar } from '@/components/ui/Avatar';
import { type MoaiMoment } from '@/hooks/use-moai';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MoaiMomentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  moments: MoaiMoment[];
  moaiName: string;
  moaiId?: string;
  onStoryViewed?: (moaiId: string) => void;
}

export const MoaiMomentsModal: React.FC<MoaiMomentsModalProps> = ({
  isOpen,
  onClose,
  moments,
  moaiName,
  moaiId,
  onStoryViewed,
}) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-progress timer
  useEffect(() => {
    if (!isOpen || isPaused || moments.length === 0) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update every 50ms

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (interval / duration) * 100;
        
        if (newProgress >= 100) {
          // Move to next story
          if (currentIndex < moments.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            // Finished all stories
            onClose();
            return 0;
          }
        }
        
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex, moments.length, isPaused, onClose]);

  // Reset progress when modal opens or index changes
  useEffect(() => {
    setProgress(0);
  }, [isOpen, currentIndex]);

  // Mark story as viewed when modal closes
  useEffect(() => {
    if (!isOpen && moaiId && onStoryViewed) {
      onStoryViewed(moaiId);
    }
  }, [isOpen, moaiId, onStoryViewed]);

  const currentMoment = moments[currentIndex];
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  if (!isOpen || moments.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={tw(layout.flex1)} onTouchStart={() => setIsPaused(false)}>
        {/* Background */}
        <LinearGradient
          colors={['#000000', '#1a1a1a'] as [string, string, ...string[]]}
          style={tw(layout.flex1)}
        >
          {/* Progress Indicators */}
          <View style={tw(layout.flexRow, spacing.gap(1), spacing.px(4), spacing.pt(12))}>
            {moments.map((_, index) => (
              <View
                key={index}
                style={[
                  tw(layout.flex1, spacing.h(1), border.rounded),
                  { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
                ]}
              >
                <View
                  style={[
                    {
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: index < currentIndex ? '#FFFFFF' : 
                                    index === currentIndex ? '#FFFFFF' : 'transparent',
                      width: index === currentIndex ? `${progress}%` : 
                            index < currentIndex ? '100%' : '0%',
                    }
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.px(4), spacing.py(3))}>
            <View style={tw(layout.flexRow, layout.itemsCenter, layout.flex1)}>
              <Avatar
                size="sm"
                source={currentMoment.profile?.profile_image ? { uri: currentMoment.profile.profile_image } : undefined}
                fallback={`${currentMoment.profile?.first_name?.[0] || ''}${currentMoment.profile?.last_name?.[0] || ''}`}
                style={tw(spacing.mr(3))}
              />
              <View style={tw(layout.flex1)}>
                <Text style={[tw(text.sm, text.semibold), { color: '#FFFFFF' }]}>
                  {currentMoment.profile?.first_name} {currentMoment.profile?.last_name}
                </Text>
                <Text style={[tw(text.xs), { color: 'rgba(255, 255, 255, 0.7)' }]}>
                  {moaiName} • {new Date(currentMoment.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(3))}>
              <TouchableOpacity onPress={handleTogglePause}>
                {isPaused ? (
                  <Play size={20} color="#FFFFFF" />
                ) : (
                  <Pause size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Area */}
          <View style={tw(layout.flex1, layout.itemsCenter, layout.justifyCenter)}>
            {/* Navigation Areas */}
            <TouchableOpacity
              style={[
                tw(spacing.absolute, layout.itemsCenter, layout.justifyCenter),
                { left: 0, top: 0, bottom: 0, width: screenWidth / 3 }
              ]}
              onPress={handlePrevious}
              activeOpacity={1}
            >
              <View style={{ opacity: 0 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw(spacing.absolute, layout.itemsCenter, layout.justifyCenter),
                { right: 0, top: 0, bottom: 0, width: screenWidth / 3 }
              ]}
              onPress={handleNext}
              activeOpacity={1}
            >
              <View style={{ opacity: 0 }} />
            </TouchableOpacity>

            {/* Story Content */}
            <View style={tw(layout.itemsCenter, layout.justifyCenter)}>
              {currentMoment.image_url && (
                <Image
                  source={{ uri: currentMoment.image_url }}
                  style={{
                    width: screenWidth * 0.9,
                    height: screenHeight * 0.6,
                    borderRadius: 12,
                  }}
                  resizeMode="cover"
                />
              )}

              {/* TODO: Add video support */}
              {currentMoment.video_url && (
                <View
                  style={[
                    {
                      width: screenWidth * 0.9,
                      height: screenHeight * 0.6,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    tw(layout.itemsCenter, layout.justifyCenter),
                  ]}
                >
                  <Play size={64} color="#FFFFFF" />
                  <Text style={[tw(text.sm, spacing.mt(2)), { color: '#FFFFFF' }]}>
                    Video story (feature coming soon)
                  </Text>
                </View>
              )}

              {/* Text-only story */}
              {!currentMoment.image_url && !currentMoment.video_url && currentMoment.content && (
                <View
                  style={[
                    tw(spacing.p(8), border.rounded),
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      maxWidth: screenWidth * 0.9,
                    }
                  ]}
                >
                  <Text 
                    style={[
                      tw(text.lg, text.center),
                      { color: '#FFFFFF', lineHeight: 28 }
                    ]}
                  >
                    {currentMoment.content}
                  </Text>
                </View>
              )}
            </View>

            {/* Content Text Overlay */}
            {currentMoment.content && (currentMoment.image_url || currentMoment.video_url) && (
              <View
                style={[
                  tw(spacing.absolute, spacing.px(6)), { bottom: 20 },
                  { width: screenWidth }
                ]}
              >
                <View
                  style={[
                    tw(spacing.p(4), border.rounded),
                    { backgroundColor: 'rgba(0, 0, 0, 0.6)' }
                  ]}
                >
                  <Text 
                    style={[
                      tw(text.base, text.center),
                      { color: '#FFFFFF', lineHeight: 22 }
                    ]}
                  >
                    {currentMoment.content}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Bottom Navigation Hints */}
          <View style={tw(layout.flexRow, layout.justifyBetween, spacing.px(8), spacing.pb(8))}>
            {currentIndex > 0 && (
              <View style={tw(layout.flexRow, layout.itemsCenter)}>
                <ChevronLeft size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={[tw(text.xs), { color: 'rgba(255, 255, 255, 0.7)' }]}>
                  Tap left side
                </Text>
              </View>
            )}
            
            {currentIndex < moments.length - 1 && (
              <View style={tw(layout.flexRow, layout.itemsCenter)}>
                <Text style={[tw(text.xs), { color: 'rgba(255, 255, 255, 0.7)' }]}>
                  Tap right side
                </Text>
                <ChevronRight size={16} color="rgba(255, 255, 255, 0.7)" />
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};