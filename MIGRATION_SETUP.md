# Moai React Native Migration Setup

This document outlines the foundational setup completed for migrating the Moai web app to React Native.

## ✅ Phase 1: Foundation Setup - COMPLETED

### 1. Project Structure
- ✅ **Feature-based folder structure** that mirrors the web app organization
- ✅ **Component directories**: `/components/{auth,moai,chat,coach,profile,etc.}`
- ✅ **Services layer**: `/services/` with React Native-compatible implementations
- ✅ **Hooks directory**: `/hooks/` for React Query integration
- ✅ **Utilities**: `/utils/` for styling and helper functions

### 2. TypeScript Configuration
- ✅ **Path aliases**: `@/*` configured for clean imports
- ✅ **Metro config**: Updated to support path resolution
- ✅ **Type safety**: All services and hooks are fully typed

### 3. Design System & Styling
- ✅ **Design tokens**: Replicated Tailwind CSS tokens in `/constants/Tokens.ts`
- ✅ **Style utilities**: Tailwind-like utility functions in `/utils/styles.ts`
- ✅ **Theme provider**: Light/dark mode support with persistence
- ✅ **Brand colors**: Moai teal, coral, and purple integrated throughout

### 4. Authentication & Backend
- ✅ **Supabase client**: Configured for React Native with proper auth flow
- ✅ **Auth provider**: Comprehensive authentication with error handling
- ✅ **Session management**: Automatic token refresh and persistence
- ✅ **Error handling**: User-friendly error messages and alerts

### 5. State Management
- ✅ **React Query**: Configured with React Native optimizations
- ✅ **Query provider**: Cache management and offline support
- ✅ **Custom hooks**: Profile and Moai management hooks created
- ✅ **Cache persistence**: Query cache survives app restarts

## 🏗️ Architecture Overview

### Provider Hierarchy
```
AppProviders
├── GestureHandlerRootView
├── SafeAreaProvider
├── ThemeProvider (Custom theme management)
├── QueryProvider (TanStack React Query)
└── SupabaseProvider (Authentication & backend)
```

### Service Layer
```
services/
├── types.ts              # Shared TypeScript interfaces
├── base-service.ts       # Common service utilities
├── profile-service.ts    # User profile operations
├── moai-service.ts       # Moai CRUD operations
└── index.ts              # Service exports
```

### Custom Hook System
```
hooks/
├── use-profile.ts        # Profile management
├── use-moai.ts          # Moai operations
├── useAuth.ts           # Authentication (existing)
└── index.ts             # Hook exports
```

### Design System
```
constants/
├── Tokens.ts            # Design tokens (colors, spacing, etc.)
└── Colors.ts            # Legacy color integration

utils/
└── styles.ts            # Tailwind-like utility functions
```

## 🔧 Configuration Files

### Environment Variables
Copy `env.example` to `.env` and configure:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Key Dependencies Added
- `@tanstack/react-query`: State management
- `@react-native-async-storage/async-storage`: Persistence
- `@supabase/supabase-js`: Backend integration
- `expo-constants`: Environment management

## 🎨 Design System Usage

### Using Style Utilities
```typescript
import { tw, spacing, text, bg, layout } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <View style={tw(
      layout.flexRow,
      layout.itemsCenter,
      spacing.p(4),
      bg.card(theme)
    )}>
      <Text style={tw(
        text.lg,
        text.semibold,
        text.foreground(theme)
      )}>
        Hello Moai!
      </Text>
    </View>
  );
}
```

### Using Custom Hooks
```typescript
import { useProfile, useMoais } from '@/hooks';

function ProfileScreen() {
  const { userProfile, updateProfile, isUpdatingProfile } = useProfile();
  const { moais, isLoading, fetchNextPage } = useMoais();
  
  // Component logic here
}
```

## 🔒 Authentication Flow

### Sign In
```typescript
import { useAuth } from '@/hooks/useAuth';

function SignInScreen() {
  const { signIn, isLoading } = useAuth();
  
  const handleSignIn = async () => {
    const result = await signIn(email, password);
    if (result.success) {
      // Navigate to app
    }
  };
}
```

### Protected Routes
```typescript
import { useAuth } from '@/hooks/useAuth';

function ProtectedScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <SignInPrompt />;
  
  return <AuthenticatedContent />;
}
```

## 📱 React Native Specific Features

### Offline Support
- Query cache persists across app restarts
- Automatic retry logic for network failures
- Graceful degradation when offline

### Performance Optimizations
- Reduced retry attempts for mobile
- Optimized query stale times
- Proper memory management

### Platform Integration
- AsyncStorage for secure data persistence
- Proper safe area handling
- Native gestures and haptics ready

## 🎯 Next Steps

### Phase 2: Core UI Components (Week 3-4)
1. **Create base UI components**: Button, Card, Input, Badge, Avatar
2. **Layout components**: Container, Grid, Separator
3. **Complex components**: Modal, Sheet, Tabs, Accordion

### Phase 3: Feature Migration (Week 5-8)
1. **Authentication screens**: Login, signup, onboarding
2. **Core Moai features**: List, detail, creation, management
3. **Activity system**: Logging, tracking, progress visualization
4. **Chat & social features**: Real-time messaging, image sharing

### Phase 4: Advanced Features (Week 9-12)
1. **Coaching platform**: Dashboard, program management
2. **Mobile-specific features**: Camera, notifications, offline sync
3. **Performance optimization**: Image handling, list virtualization

### Phase 5: Testing & Polish (Week 13-15)
1. **Testing implementation**: Unit, integration, E2E tests
2. **Platform optimization**: iOS/Android specific features
3. **App store preparation**: Icons, metadata, builds

## 📝 Development Guidelines

### Code Style
- Use path aliases for all imports (`@/` prefix)
- Follow existing TypeScript patterns
- Prefer composition over inheritance
- Use custom hooks for complex logic

### Error Handling
- All service calls return `ServiceResponse<T>` type
- User-friendly error messages via React Native alerts
- Graceful fallbacks for network issues

### Performance
- Use React Query for server state management
- Implement proper loading and error states
- Optimize re-renders with proper memoization

## 🚀 Getting Started

1. **Install dependencies**: `npm install`
2. **Configure environment**: Copy and update `env.example`
3. **Start development**: `npm run dev`
4. **Run on device**: `npm run ios` or `npm run android`

The foundation is now in place for a seamless migration from the web app to React Native while maintaining the same design system and user experience patterns.