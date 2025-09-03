import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tw, spacing, layout, text, border } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';
import { Button } from '@/components/ui/Button';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeIconProps {
  onPress?: () => void;
}

export const QRCodeIcon: React.FC<QRCodeIconProps> = ({ onPress }) => {
  const { theme, colors } = useTheme();
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
  const [qrValue, setQrValue] = useState('');

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      generateQRCode();
      setShowQRModal(true);
    }
  };

  const generateQRCode = () => {
    // Generate a unique QR code value for friend invites
    // In a real implementation, this would call a service to generate a token
    const timestamp = Date.now();
    const friendInviteUrl = `moai://friend-invite?token=${timestamp}`;
    setQrValue(friendInviteUrl);
  };

  const handleScan = () => {
    // In a real implementation, this would open camera for QR scanning
    Alert.alert(
      'QR Scanner',
      'QR code scanning functionality requires camera permissions and will be implemented with expo-camera.',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[
          tw(spacing.p(2), border.rounded),
          {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.primary,
            width: 32,
            height: 32,
          }
        ]}
        onPress={handlePress}
      >
        <Ionicons name="qr-code" size={16} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={showQRModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
          {/* Header */}
          <View 
            style={[
              tw(layout.flexRow, layout.itemsCenter, layout.justifyBetween, spacing.p(4), spacing.pt(12)),
              { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }
            ]}
          >
            <Text style={tw(text.lg, text.bold, text.foreground(theme))}>
              QR Code Friend Invite
            </Text>
            <TouchableOpacity onPress={() => setShowQRModal(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={tw(layout.flexRow, spacing.p(4))}>
            <TouchableOpacity
              style={[
                tw(
                  spacing.px(4),
                  spacing.py(2),
                  border.rounded,
                  layout.flex1,
                  layout.itemsCenter,
                  spacing.mr(2)
                ),
                {
                  backgroundColor: activeTab === 'generate' ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: activeTab === 'generate' ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setActiveTab('generate')}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Ionicons 
                  name="qr-code" 
                  size={16} 
                  color={activeTab === 'generate' ? colors.primaryForeground : colors.foreground} 
                />
                <Text
                  style={[
                    tw(text.sm, text.medium),
                    { 
                      color: activeTab === 'generate' 
                        ? colors.primaryForeground 
                        : colors.foreground 
                    }
                  ]}
                >
                  My QR Code
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw(
                  spacing.px(4),
                  spacing.py(2),
                  border.rounded,
                  layout.flex1,
                  layout.itemsCenter,
                  spacing.ml(2)
                ),
                {
                  backgroundColor: activeTab === 'scan' ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: activeTab === 'scan' ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setActiveTab('scan')}
            >
              <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                <Ionicons 
                  name="camera" 
                  size={16} 
                  color={activeTab === 'scan' ? colors.primaryForeground : colors.foreground} 
                />
                <Text
                  style={[
                    tw(text.sm, text.medium),
                    { 
                      color: activeTab === 'scan' 
                        ? colors.primaryForeground 
                        : colors.foreground 
                    }
                  ]}
                >
                  Scan QR Code
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={tw(layout.flex1, spacing.p(4))}>
            {activeTab === 'generate' ? (
              <View style={tw(layout.itemsCenter, layout.justifyCenter, layout.flex1)}>
                <Text style={tw(text.sm, text.muted(theme), text.center, spacing.mb(6))}>
                  Share this QR code with friends to let them send you a friend request
                </Text>

                {qrValue ? (
                  <View style={tw(layout.itemsCenter, spacing.mb(6))}>
                    <View
                      style={[
                        tw(spacing.p(4), border.rounded),
                        { 
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }
                      ]}
                    >
                      <QRCode
                        value={qrValue}
                        size={200}
                        backgroundColor="white"
                        color="black"
                      />
                    </View>
                  </View>
                ) : (
                  <View style={tw(spacing.mb(6))}>
                    <Text style={tw(text.sm, text.muted(theme))}>
                      Generating QR code...
                    </Text>
                  </View>
                )}

                <Button
                  onPress={generateQRCode}
                  style={tw(spacing.mb(4))}
                >
                  Generate New QR Code
                </Button>
              </View>
            ) : (
              <View style={tw(layout.itemsCenter, layout.justifyCenter, layout.flex1)}>
                <Text style={tw(text.sm, text.muted(theme), text.center, spacing.mb(6))}>
                  Scan someone's QR code to send them a friend request
                </Text>

                <View 
                  style={[
                    tw(layout.itemsCenter, layout.justifyCenter, border.rounded, spacing.mb(6)),
                    {
                      backgroundColor: colors.muted,
                      width: 200,
                      height: 200,
                      opacity: 0.3,
                    }
                  ]}
                >
                  <Ionicons name="camera" size={48} color={colors.muted} />
                  <Text style={tw(text.sm, text.muted(theme), spacing.mt(2))}>
                    Camera Preview
                  </Text>
                </View>

                <Button
                  onPress={handleScan}
                  style={tw(spacing.mb(4))}
                >
                  <View style={tw(layout.flexRow, layout.itemsCenter, spacing.gap(2))}>
                    <Ionicons name="camera" size={16} color={colors.primaryForeground} />
                    <Text style={[tw(text.base), { color: colors.primaryForeground }]}>
                      Start Scanning
                    </Text>
                  </View>
                </Button>

                <Text style={tw(text.xs, text.muted(theme), text.center)}>
                  Camera functionality requires additional setup with expo-camera
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};