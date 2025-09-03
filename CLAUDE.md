# Claude Development Guidelines for Moai Native

## Project Overview
Moai Native is a React Native fitness and community app built with Expo, TypeScript, and Supabase. This document contains essential guidelines to prevent common mistakes and maintain code quality.

### Migration Context
This is a React Native (Expo) migration of the web-based MOAI Circles Connect platform located at `../moai-circles-connect/`. The web app is a social fitness platform built with React/TypeScript and Supabase that enables users to create and join fitness groups called "MOAIs", track workouts collaboratively, and build fitness communities.

#### Key Reference Points from Web App:
- **Architecture**: Service layer pattern with modular services (`/src/services/`)
- **Data Fetching**: React Query (TanStack Query) for server state management
- **Database**: Supabase with PostgreSQL, Auth, Storage, Edge Functions
- **Authentication**: JWT-based auth with role-based access control (user, coach, admin)
- **Key Entities**: profiles, moais, moai_members, workouts, activities, posts
- **Testing**: Comprehensive E2E testing with Playwright (web equivalent for mobile will use Maestro)

## TypeScript & Styling Best Practices

### 🎨 Styling System Guidelines

#### 1. **Always Use Proper `tw()` Function Syntax**
```typescript
// ✅ CORRECT - Always close tw() function properly
style={tw(spacing.p(4), layout.flex1)}

// ❌ INCORRECT - Missing closing parenthesis
style={tw(spacing.p(4), layout.flex1}

// ❌ INCORRECT - Missing closing parenthesis (common JSX syntax error)
<Text style={tw(text.lg, spacing.mb(2)}>

// ✅ CORRECT - Properly closed tw() function
<Text style={tw(text.lg, spacing.mb(2))}>
```

#### 1a. **JSX Syntax Best Practices**
```typescript
// ✅ CORRECT - Use React Native components, not HTML elements
<View style={tw(layout.flex1)}>
  <Text style={tw(text.lg)}>Content</Text>
</View>

// ❌ INCORRECT - HTML elements in React Native
<div style={tw(layout.flex1)}>
  <span style={tw(text.lg)}>Content</span>
</div>

// ✅ CORRECT - Proper JSX tag closing
<View style={tw(layout.flex1)}>
  <Text>Content</Text>
</View>

// ❌ INCORRECT - Mismatched JSX tags
<View style={tw(layout.flex1)}>
  <Text>Content</Text>
</div>
```

#### 2. **LinearGradient Color Types**
```typescript
// ✅ CORRECT - Properly typed gradient colors
const getGradientColors = (): [string, string, ...string[]] => {
  return ['#06B6D4', '#3B82F6'];
};

// ✅ CORRECT - Type assertion for inline gradients
gradient: ['#06B6D4', '#3B82F6'] as [string, string, ...string[]]

// ❌ INCORRECT - Will cause TypeScript errors
gradient: ['#06B6D4', '#3B82F6']
```

#### 3. **Component Size Props**
```typescript
// ✅ CORRECT - Include all size variants used in components
type AvatarSize = 'sm' | 'default' | 'md' | 'lg' | 'xl' | number;

// ✅ CORRECT - Include all elevation variants used in components  
type CardElevation = 'sm' | 'md' | 'lg' | 'xl';
```

#### 4. **Service Response Types**
```typescript
// ✅ CORRECT - Use discriminated union for ServiceResponse
export type ServiceResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

// ❌ INCORRECT - Don't use interfaces with nullable fields
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
```

### 🔧 Code Quality Checklist

Before committing code, ensure:

1. **Run TypeScript Check**: `npm run type-check`
2. **Run Linting**: `npm run lint`
3. **Test Key User Flows**: Navigation, authentication, core features

### 🎯 Component Development Standards

#### 1. **Import Organization**
```typescript
// React imports first
import React, { useState, useEffect } from 'react';

// React Native imports
import { View, Text, TouchableOpacity } from 'react-native';

// Third-party libraries
import { LinearGradient } from 'expo-linear-gradient';

// Local utilities and hooks
import { useTheme } from '@/providers/theme-provider';
import { tw, spacing, layout } from '@/utils/styles';

// Local components
import { Button } from '@/components/ui/Button';
```

#### 2. **Props Interface Patterns**
```typescript
// ✅ CORRECT - Comprehensive interface with proper types
export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  testID?: string;
}
```

#### 3. **Styled Component Patterns**
```typescript
// ✅ CORRECT - Use theme colors and proper styling utilities
const { theme, colors } = useTheme();

const containerStyles = [
  tw(layout.flex1, spacing.p(4)),
  { backgroundColor: colors.background }
];
```

### 🚀 Performance Guidelines

#### 1. **Optimize Heavy Components**
```typescript
// ✅ Use React.memo for expensive renders
export const ChatMessage = React.memo(({ message, ...props }) => {
  // Component logic
});

// ✅ Use useCallback for event handlers
const handlePress = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

#### 2. **Image Optimization**
```typescript
// ✅ CORRECT - Always handle image errors and use proper resize modes
<Image
  source={{ uri: imageUrl }}
  style={imageStyles}
  onError={() => setImageError(true)}
  resizeMode="cover"
/>
```

### 🔄 State Management Patterns

#### 1. **React Query Usage**
```typescript
// ✅ CORRECT - Proper error handling and typing
export function useUserChannels() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['chat-channels', user?.id],
    queryFn: () => user ? ChatService.getUserChannels(user.id) : Promise.resolve({ success: false, error: 'No user' }),
    enabled: !!user,
    staleTime: 30000,
  });
}
```

#### 2. **Loading States**
```typescript
// ✅ CORRECT - Always provide loading states
if (isLoading) {
  return <LoadingComponent />;
}

if (error) {
  return <ErrorComponent error={error} />;
}

return <SuccessComponent data={data} />;
```

### 📱 Mobile-Specific Guidelines

#### 1. **Touch Targets**
```typescript
// ✅ CORRECT - Minimum 44pt touch targets
const buttonStyles = {
  minHeight: 44,
  minWidth: 44,
};
```

#### 2. **Safe Areas**
```typescript
// ✅ CORRECT - Always consider safe areas
<MobileLayout safeArea={true} padding={false}>
  {/* Content */}
</MobileLayout>
```

#### 3. **Keyboard Handling**
```typescript
// ✅ CORRECT - Handle keyboard properly for input components
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  {/* Input components */}
</KeyboardAvoidingView>
```

### 🎨 Animation Guidelines

#### 1. **Use Native Driver When Possible**
```typescript
// ✅ CORRECT - Use native driver for transform and opacity
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ Performance boost
}).start();
```

#### 2. **Cleanup Animations**
```typescript
// ✅ CORRECT - Always cleanup in useEffect
useEffect(() => {
  const animation = Animated.timing(/* ... */);
  animation.start();
  
  return () => {
    animation.stop(); // ✅ Cleanup
  };
}, []);
```

### 🔗 Navigation Patterns

#### 1. **Modal Presentations**
```typescript
// ✅ CORRECT - Use proper modal patterns
<Modal
  visible={isVisible}
  animationType="slide"
  presentationStyle="fullScreen"
  onRequestClose={onClose}
>
  {/* Modal content */}
</Modal>
```

### 🐛 Common Pitfalls to Avoid

#### JSX & Styling Errors:
1. **Missing closing parentheses in `tw()` calls** - Always verify `tw()` functions are properly closed
2. **Using HTML elements instead of React Native components** - Use `View` not `div`, `Text` not `span`, etc.
3. **Mismatched JSX opening/closing tags** - Ensure `<View>` closes with `</View>`, not `</div>`
4. **Missing imports for custom components** - Verify all `@/components/ui/*` imports exist
5. **Using non-existent style utilities** - Only use utilities defined in `@/utils/styles`

#### Component & Type Errors:
6. **Incorrect LinearGradient color typing**
7. **Missing size variants in component props** 
8. **Using wrong ref types for third-party components**
9. **Not handling loading and error states**
10. **Forgetting to cleanup subscriptions and animations**
11. **Missing TypeScript checks before commits**

#### React Query Errors:
12. **Missing `initialPageParam` in infinite queries**
13. **Improper generic types in `useQuery` calls**
14. **Not handling ServiceResponse types correctly**

### 🧪 Testing Approach

1. **Always test on both platforms** (iOS and Android)
2. **Test with different theme modes** (light and dark)
3. **Verify accessibility** (screen readers, touch targets)
4. **Test with slow network conditions**
5. **Verify keyboard interactions**

### 📋 Pre-Commit Checklist

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] All `tw()` functions have proper closing parentheses
- [ ] LinearGradient colors are properly typed
- [ ] Component size props include all used variants
- [ ] Service responses use proper discriminated unions
- [ ] Loading and error states are handled
- [ ] Animations use native driver where possible
- [ ] Touch targets meet minimum size requirements

## Command Reference

```bash
# Development
npm run dev                    # Start development server
npm run type-check            # Run TypeScript checking
npm run lint                  # Run ESLint

# Platform-specific
npm run ios                   # Run on iOS
npm run android              # Run on Android

# Testing
npm run test:e2e             # Run E2E tests with Maestro

# Web Reference Commands (from ../moai-circles-connect/)
npm run dev                   # Web app development server (port 8080)
npm run test:e2e             # Web app E2E tests with Playwright
supabase gen types typescript --local > src/integrations/supabase/types.ts  # Generate types from DB
supabase db reset            # Apply database migrations
supabase start               # Start local Supabase
```

## Architecture Notes

### Mobile-Specific Architecture
- **Theme System**: Use `useTheme()` hook for consistent theming
- **Styling**: Use custom `tw()` utility function, not Tailwind CSS directly
- **State Management**: 
  - **XState**: For complex UI flows, multi-step processes, and side effects
  - **React Query**: For server state, caching, and synchronization
  - **React State**: For simple UI state
- **Real-time**: Supabase real-time subscriptions for chat and live features
- **Navigation**: Expo Router with file-based routing
- **Icons**: Cross-platform IconSymbol component with MaterialIcons fallback

### State Management Patterns

#### When to Use XState
Use XState for:
- Multi-step forms (onboarding, workout logging)
- Complex UI states (chat interface, coach workflows)
- Processes with side effects (buddy matching, file uploads)
- Features with clear state transitions

Example pattern:
```typescript
const machine = createMachine({
  id: 'featureName',
  initial: 'idle',
  context: { /* shared data */ },
  states: {
    idle: { on: { START: 'active' } },
    active: { /* nested states */ },
    error: { on: { RETRY: 'active' } }
  }
});

// Hook usage
const [state, send] = useMachine(machine);
```

#### When to Use React Query
Use React Query for:
- All API data fetching
- Caching server responses
- Optimistic updates
- Background refetching

Example pattern:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => ServiceName.fetchResource(id),
  staleTime: 5 * 60 * 1000,
});
```

### Shared Architecture with Web App
- **Backend**: Same Supabase instance as web app (`../moai-circles-connect/`)
- **Database Schema**: Shared schema with web app - reference remote or local schema files
- **Services**: Mobile services should follow same patterns as web services in `/src/services/`
- **Authentication**: Same JWT-based auth flow and role-based access control
- **Data Models**: Same database entities (profiles, moais, moai_members, workouts, activities, posts)

### Migration Status
See `MIGRATION_PLAN.md` for detailed migration tracking and implementation roadmap.

### XState Syntax Guidelines
- Xstate syntax should be Xstate v5 syntax and the xstate/react is xstate v6

---

*Last updated: Current development session*
*Always run `npm run type-check` before committing changes*
- do not edit anything in moai-circles-connect