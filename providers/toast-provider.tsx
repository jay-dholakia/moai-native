import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Animated, PanResponder } from 'react-native';
import { useTheme } from './theme-provider';
import { tw, spacing, layout, text, border } from '@/utils/styles';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...options,
      id,
      createdAt: Date.now(),
      duration: options.duration ?? 4000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value = {
    toast,
    toasts,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;
  const { colors } = useTheme();

  return (
    <View 
      style={[
        tw(layout.absolute),
        { 
          top: 48,
          left: 16,
          right: 16,
          zIndex: 50,
          pointerEvents: 'box-none' 
        }
      ]}
    >
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
          index={index}
        />
      ))}
    </View>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
  index: number;
}

function ToastItem({ toast, onRemove, index }: ToastItemProps) {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  React.useEffect(() => {
    // Slide in and fade in
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
  }, []);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove();
    });
  }, [fadeAnim, slideAnim, onRemove]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dx > 0) {
        slideAnim.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 100) {
        handleDismiss();
      } else {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const getVariantStyles = () => {
    switch (toast.variant) {
      case 'destructive':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
        };
      default:
        return {
          backgroundColor: colors.card,
          borderColor: colors.border,
        };
    }
  };

  const getTextColor = () => {
    switch (toast.variant) {
      case 'destructive':
      case 'warning':
      case 'success':
        return '#FFFFFF';
      default:
        return colors.cardForeground;
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        tw(spacing.mb(2), spacing.mx(4), spacing.p(4), border.rounded),
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          marginTop: index * 8,
        },
        getVariantStyles(),
      ]}
    >
      <Text 
        style={[
          tw(text.semibold, text.base),
          { color: getTextColor() }
        ]}
      >
        {toast.title}
      </Text>
      {toast.description && (
        <Text 
          style={[
            tw(text.sm, spacing.mt(1)),
            { color: getTextColor(), opacity: 0.8 }
          ]}
        >
          {toast.description}
        </Text>
      )}
    </Animated.View>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}