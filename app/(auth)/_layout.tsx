import { Stack } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { AuthGuard } from '@/components/guards';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <AuthGuard requireAuth={false}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </AuthGuard>
  );
}