import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, text, layout, border } from '@/utils/styles';

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

interface CommitmentTimerProps {
  windowCloseTime: Date | null;
  style?: any;
}

/**
 * Hook for countdown functionality (mobile version of web app's useCommitmentCountdown)
 */
function useCommitmentCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<CountdownTime>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeRemaining = (): CountdownTime => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday
      const currentHour = now.getHours();
      
      // Find next Monday 12PM
      let targetDate = new Date(now);
      
      if (currentDay === 0 && currentHour >= 12) {
        // Sunday after 12PM - target is next Monday 12PM
        targetDate.setDate(now.getDate() + 1);
        targetDate.setHours(12, 0, 0, 0);
      } else if (currentDay === 1 && currentHour < 12) {
        // Monday before 12PM - target is today 12PM
        targetDate.setHours(12, 0, 0, 0);
      } else {
        // Window is closed - next opening is next Sunday 12PM
        const daysUntilSunday = (7 - currentDay) % 7;
        const targetDays = daysUntilSunday === 0 ? 7 : daysUntilSunday;
        targetDate.setDate(now.getDate() + targetDays);
        targetDate.setHours(12, 0, 0, 0);
      }

      const timeDiff = targetDate.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const totalSeconds = Math.floor(timeDiff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { hours, minutes, seconds, isExpired: false };
    };

    const updateCountdown = () => {
      setTimeRemaining(calculateTimeRemaining());
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time: number): string => {
    return time.toString().padStart(2, '0');
  };

  const formattedTime = `${formatTime(timeRemaining.hours)}:${formatTime(timeRemaining.minutes)}:${formatTime(timeRemaining.seconds)}`;

  return {
    timeRemaining,
    formattedTime,
    isExpired: timeRemaining.isExpired
  };
}

/**
 * Hook for specific window close time countdown
 */
function useCountdown(targetDate: Date | null) {
  const [timeRemaining, setTimeRemaining] = useState<CountdownTime>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeRemaining = (): CountdownTime => {
      const now = new Date();
      const timeDiff = targetDate.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const totalSeconds = Math.floor(timeDiff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { hours, minutes, seconds, isExpired: false };
    };

    const updateCountdown = () => {
      setTimeRemaining(calculateTimeRemaining());
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatTime = (time: number): string => {
    return time.toString().padStart(2, '0');
  };

  const formattedTime = `${formatTime(timeRemaining.hours)}:${formatTime(timeRemaining.minutes)}:${formatTime(timeRemaining.seconds)}`;

  return {
    timeRemaining,
    formattedTime,
    isExpired: timeRemaining.isExpired
  };
}

/**
 * CommitmentTimer component for React Native
 * Displays countdown timer for commitment window closing
 */
export const CommitmentTimer: React.FC<CommitmentTimerProps> = ({ 
  windowCloseTime, 
  style 
}) => {
  const { colors } = useTheme();
  const { formattedTime, isExpired } = useCountdown(windowCloseTime);

  if (!windowCloseTime || isExpired) {
    return null;
  }

  return (
    <View 
      style={[
        tw(layout.flexRow, layout.itemsCenter, layout.justifyCenter, spacing.gap(2), spacing.px(3), spacing.py(2), border.rounded),
        {
          backgroundColor: '#FFF7ED', // orange-50
          borderWidth: 1,
          borderColor: '#FED7AA', // orange-200
        },
        style
      ]}
    >
      <Clock size={12} color="#EA580C" />
      <Text style={[tw(text.xs), { color: '#EA580C' }]}>
        This week&apos;s commitment locks in{' '}
      </Text>
      <Text style={[tw(text.xs, text.bold), { color: '#C2410C', fontFamily: 'monospace' }]}>
        {formattedTime}
      </Text>
    </View>
  );
};

export default CommitmentTimer;