# Moai Native Design System

## Overview
This document outlines the design system implemented for Moai Native, focusing on clean, modern UI with consistent spacing, typography, and user-friendly interactions.

## Core Design Principles

### 1. User-Friendly Spacing
- **Screen Padding**: 16px (consistent edge spacing)
- **Component Padding**: 16px internal spacing for most components
- **Section Gaps**: 24px between major sections
- **Element Gaps**: 16px between related elements
- **Touch Targets**: Minimum 44px for all interactive elements

### 2. Typography Scale
```typescript
// Mobile-optimized font sizes
xs: 12px   // Captions, fine print
sm: 14px   // Secondary text, labels
base: 16px // Body text - optimal readability
lg: 18px   // Emphasized body text
xl: 20px   // Small headings
2xl: 24px  // Medium headings
3xl: 30px  // Large headings
4xl: 36px  // Extra large headings
```

### 3. Color System
#### Brand Colors
- **Teal**: #14B8A6 (Primary actions, branding)
- **Coral**: #F97316 (Secondary actions, highlights)
- **Purple**: #8B5CF6 (Accent color, special features)
- **Light**: #FAFAFA (Clean light background)
- **Dark**: #1A1A1A (Pure dark background)

#### Semantic Colors
- Uses HSL values for consistent lightness and saturation
- Separate light and dark theme variants
- Status colors: success (#10B981), warning (#F59E0B), error (#EF4444)

## Component Guidelines

### Authentication Screens
- Clean, centered layout with generous white space
- Consistent form field styling with 48px minimum height
- Password visibility toggles with proper icon placement
- Subtle focus states and validation feedback

### Onboarding Flow
- Progress indicators with clear visual hierarchy
- Card-based content with subtle shadows
- Consistent button styling across all steps
- Mobile-optimized touch targets

### Tab Navigation
- Clean tab bar with proper spacing
- Enhanced shadow and border styling
- Platform-specific height adjustments
- Consistent icon sizing (28px)

### Loading States
- Centered loading indicators with descriptive text
- Emergency reset options for stuck states
- Consistent spacing around loading content

## Implementation Details

### Spacing System
```typescript
// ContentSpacing patterns for consistent layout
screenPadding: 16px        // Screen edge padding
componentPadding: 16px     // Internal component spacing
sectionGap: 24px          // Between major sections
elementGap: 16px          // Between related elements
minTouchTarget: 44px      // Minimum interactive area
```

### Typography Patterns
```typescript
// Pre-defined typography combinations
h1: { fontSize: 36px, fontWeight: 'bold', lineHeight: 1.25 }
h2: { fontSize: 30px, fontWeight: 'bold', lineHeight: 1.25 }
body: { fontSize: 16px, fontWeight: 'normal', lineHeight: 1.5 }
button: { fontSize: 16px, fontWeight: 'medium', lineHeight: 1 }
```

### Shadow System
- Subtle elevation with consistent shadow patterns
- Platform-appropriate shadow implementation
- Multiple elevation levels (sm, md, lg, xl, 2xl)

## Mobile Optimizations

### Touch Interactions
- Minimum 44px touch targets for all interactive elements
- Appropriate padding around touchable areas
- Visual feedback on press states

### Keyboard Handling
- KeyboardAvoidingView for forms
- Proper text input configuration
- Auto-dismiss keyboard behaviors

### Platform Considerations
- iOS vs Android specific adjustments
- Safe area handling
- Platform-appropriate font families

## Accessibility

### Text Contrast
- Meets WCAG AA standards for text contrast
- Proper color combinations in both light and dark themes

### Interactive Elements
- Minimum touch target sizes
- Clear visual hierarchy
- Descriptive text for screen readers

### Visual Feedback
- Loading states with text descriptions
- Error messages with clear guidance
- Progress indicators for multi-step flows

## Usage Guidelines

### When to Use Custom Styling
- Use design tokens from `constants/Tokens.ts`
- Leverage `tw()` utility function for consistent styling
- Follow ContentSpacing patterns for layout

### Consistent Patterns
- Form inputs: 48px minimum height with 16px padding
- Buttons: Consistent padding and minimum touch targets
- Cards: Subtle shadows with rounded corners
- Loading states: Centered with descriptive text

### Theme Integration
- Always use theme colors from `useTheme()` hook
- Support both light and dark themes
- Test across different color schemes

## Implementation Examples

### Form Input
```typescript
<TextInput
  style={tw(spacing.p(4), border.rounded, text.textBase, {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.foreground,
    minHeight: 48,
  })}
/>
```

### Button
```typescript
<TouchableOpacity
  style={tw(spacing.p(4), border.rounded, {
    backgroundColor: colors.primary,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  })}
>
  <Text style={tw(text.textBase, text.fontMedium, { color: colors.primaryForeground })}>
    Button Text
  </Text>
</TouchableOpacity>
```

### Card Layout
```typescript
<Card style={tw(spacing.m(4), spacing.p(4), border.rounded, {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
})}>
  <Text style={tw(text.textLg, text.fontSemibold, { color: colors.foreground })}>
    Card Title
  </Text>
</Card>
```

This design system ensures a consistent, clean, and user-friendly interface across the entire Moai Native application.