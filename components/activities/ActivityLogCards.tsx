import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { Heart, Dumbbell, Waves, Coffee, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActivityForm } from './ActivityForm';

interface ActivityLogCard {
  title: string;
  type: 'move' | 'lift' | 'flow' | 'rest';
  icon: React.ComponentType<any>;
  bgColor: string;
  textColor: string;
  description: string;
}

interface ActivityLogCardsProps {
  onActivityLogged?: () => void;
}

export const ActivityLogCards: React.FC<ActivityLogCardsProps> = ({
  onActivityLogged
}) => {
  const { colors } = useTheme();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showLiftModal, setShowLiftModal] = useState(false);
  const [showLiftOptionsModal, setShowLiftOptionsModal] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);

  const logCards: ActivityLogCard[] = [
    {
      title: 'Move',
      type: 'move',
      icon: Heart,
      bgColor: '#EC4899', // pink-500
      textColor: '#FFFFFF',
      description: 'Cardio, walking, running, or any movement activity'
    },
    {
      title: 'Lift', 
      type: 'lift',
      icon: Dumbbell,
      bgColor: '#F97316', // orange-500
      textColor: '#FFFFFF',
      description: 'Weight training, resistance exercises, or strength work'
    },
    {
      title: 'Flow',
      type: 'flow', 
      icon: Waves,
      bgColor: '#3B82F6', // blue-500
      textColor: '#FFFFFF',
      description: 'Yoga, stretching, mobility, or flexibility work'
    },
    {
      title: 'Rest',
      type: 'rest',
      icon: Coffee,
      bgColor: '#F59E0B', // amber-500
      textColor: '#FFFFFF',
      description: 'Recovery day, rest, or active recovery'
    }
  ];

  const handleMoveClick = () => {
    setShowMoveModal(true);
  };

  const handleLiftClick = () => {
    setShowLiftOptionsModal(true);
  };

  const handleFlowClick = () => {
    setShowFlowModal(true);
  };

  const handleRestClick = () => {
    setShowRestModal(true);
  };

  const handleLogCompletedWorkout = () => {
    setShowLiftOptionsModal(false);
    setShowLiftModal(true);
  };

  const handleLogLiveWorkout = () => {
    setShowLiftOptionsModal(false);
    // Navigate to workout templates - placeholder for future implementation
    Alert.alert('Live Workout', 'Workout templates and live tracking coming soon!');
  };

  const handleActivitySuccess = () => {
    onActivityLogged?.();
    // Close all modals
    setShowMoveModal(false);
    setShowLiftModal(false);
    setShowFlowModal(false);
    setShowRestModal(false);
  };

  const getCardHandlers = (type: string) => {
    switch (type) {
      case 'move': return handleMoveClick;
      case 'lift': return handleLiftClick;
      case 'flow': return handleFlowClick;
      case 'rest': return handleRestClick;
      default: return () => {};
    }
  };

  return (
    <>
      <View style={tw(spacing.gap(3))}>
        <View style={tw(layout.flexRow, layout.justifyBetween, layout.itemsCenter, spacing.mb(2))}>
          <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
            Log Activity
          </Text>
          <Text style={[tw(text.sm), { color: colors.mutedForeground }]}>
            What did you do today?
          </Text>
        </View>

        <View style={tw(layout.flexRow, layout.flexWrap, spacing.gap(3))}>
          {logCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <TouchableOpacity
                key={card.type}
                onPress={getCardHandlers(card.type)}
                style={tw(layout.flex1, layout.minW(32))} // Minimum width to prevent too narrow cards
                activeOpacity={0.8}
              >
                <Card elevation="sm" style={tw(spacing.h(24))}>
                  <CardContent style={[tw(spacing.p(4), layout.flex1, layout.justifyCenter, layout.itemsCenter), { backgroundColor: card.bgColor }]}>
                    <IconComponent size={28} color={card.textColor} />
                    <Text style={[tw(text.base, text.semibold, spacing.mt(2)), { color: card.textColor }]}>
                      {card.title}
                    </Text>
                    <Text style={[tw(text.xs, text.center, spacing.mt(1)), { color: card.textColor, opacity: 0.9 }]}>
                      {card.description}
                    </Text>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Move Activity Modal */}
      <Modal
        visible={showMoveModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
          <View style={tw(spacing.p(4), layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Log Move Activity
            </Text>
            <TouchableOpacity onPress={() => setShowMoveModal(false)}>
              <Text style={[tw(text.base), { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ActivityForm
            visible={true}
            onClose={() => setShowMoveModal(false)}
            preselectedActivityType="move"
          />
        </View>
      </Modal>

      {/* Lift Options Modal */}
      <Modal
        visible={showLiftOptionsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLiftOptionsModal(false)}
      >
        <View style={[tw(layout.flex1, layout.justifyCenter, layout.itemsCenter), { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Card style={tw(spacing.m(6))}>
            <CardContent style={tw(spacing.p(6))}>
              <Text style={[tw(text.lg, text.semibold, spacing.mb(4), text.center), { color: colors.foreground }]}>
                How do you want to log your lift?
              </Text>
              
              <View style={tw(spacing.gap(3))}>
                <Button
                  onPress={handleLogCompletedWorkout}
                  style={tw(layout.w('full'))}
                >
                  <Text style={tw(text.base)}>Log Completed Workout</Text>
                </Button>
                
                <Button
                  variant="outline"
                  onPress={handleLogLiveWorkout}
                  style={tw(layout.w('full'))}
                >
                  <Text style={tw(text.base)}>Start Live Workout</Text>
                </Button>
                
                <Button
                  variant="ghost"
                  onPress={() => setShowLiftOptionsModal(false)}
                  style={tw(layout.w('full'))}
                >
                  <Text style={tw(text.base)}>Cancel</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      </Modal>

      {/* Lift Activity Modal */}
      <Modal
        visible={showLiftModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLiftModal(false)}
      >
        <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
          <View style={tw(spacing.p(4), layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Log Lift Activity
            </Text>
            <TouchableOpacity onPress={() => setShowLiftModal(false)}>
              <Text style={[tw(text.base), { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ActivityForm
            visible={true}
            onClose={() => setShowLiftModal(false)}
            preselectedActivityType="lift"
          />
        </View>
      </Modal>

      {/* Flow Activity Modal */}
      <Modal
        visible={showFlowModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFlowModal(false)}
      >
        <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
          <View style={tw(spacing.p(4), layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Log Flow Activity
            </Text>
            <TouchableOpacity onPress={() => setShowFlowModal(false)}>
              <Text style={[tw(text.base), { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ActivityForm
            visible={true}
            onClose={() => setShowFlowModal(false)}
            preselectedActivityType="flow"
          />
        </View>
      </Modal>

      {/* Rest Activity Modal */}
      <Modal
        visible={showRestModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRestModal(false)}
      >
        <View style={[tw(layout.flex1), { backgroundColor: colors.background }]}>
          <View style={tw(spacing.p(4), layout.flexRow, layout.justifyBetween, layout.itemsCenter)}>
            <Text style={[tw(text.lg, text.semibold), { color: colors.foreground }]}>
              Log Rest Day
            </Text>
            <TouchableOpacity onPress={() => setShowRestModal(false)}>
              <Text style={[tw(text.base), { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ActivityForm
            visible={true}
            onClose={() => setShowRestModal(false)}
            preselectedActivityType="rest"
          />
        </View>
      </Modal>
    </>
  );
};

export default ActivityLogCards;