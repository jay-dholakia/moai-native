import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { tw, spacing, text, bg, border, layout } from '@/utils/styles';
import { useTheme } from '@/providers/theme-provider';

export interface InputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  style?: any;
  error?: string;
  label?: string;
  testID?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ 
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    autoCorrect = true,
    editable = true,
    multiline = false,
    numberOfLines = 1,
    maxLength,
    onFocus,
    onBlur,
    onSubmitEditing,
    returnKeyType = 'done',
    style,
    error,
    label,
    testID,
    ...props 
  }, ref) => {
    const { theme, colors } = useTheme();
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    const borderColor = error 
      ? colors.destructive 
      : isFocused 
        ? colors.primary 
        : colors.border;

    return (
      <View style={style}>
        {label && (
          <Text 
            style={[
              tw(text.sm, text.medium, spacing.mb(2)),
              { color: colors.foreground }
            ]}
          >
            {label}
          </Text>
        )}
        
        <TextInput
          ref={ref}
          style={[
            tw(
              spacing.px(3),
              spacing.py(3),
              border.rounded,
              text.base
            ),
            {
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor,
              color: colors.foreground,
              minHeight: multiline ? 80 : 44,
              textAlignVertical: multiline ? 'top' : 'center',
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          testID={testID}
          {...props}
        />
        
        {error && (
          <Text 
            style={[
              tw(text.sm, spacing.mt(1)),
              { color: colors.destructive }
            ]}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };