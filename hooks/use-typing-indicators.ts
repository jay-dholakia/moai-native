import { useState, useEffect, useCallback, useRef } from 'react';
import { TypingIndicatorService, TypingUser } from '@/services/typing-indicator-service';
import { useAuth } from '@/hooks/useAuth';

export function useTypingIndicators(channelId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isCurrentUserTyping, setIsCurrentUserTyping] = useState(false);
  const { user } = useAuth();
  const typingTimeoutRef = useRef<number | null>(null);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!channelId || !user) return;

    const channel = TypingIndicatorService.subscribeToTyping(
      channelId,
      (users) => {
        setTypingUsers(users);
      }
    );

    return () => {
      TypingIndicatorService.cleanup(channelId);
    };
  }, [channelId, user]);

  // Start typing indicator
  const startTyping = useCallback(async () => {
    if (!channelId || !user || isCurrentUserTyping) return;

    setIsCurrentUserTyping(true);
    await TypingIndicatorService.startTyping(channelId);

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [channelId, user, isCurrentUserTyping]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!channelId || !user || !isCurrentUserTyping) return;

    setIsCurrentUserTyping(false);
    await TypingIndicatorService.stopTyping(channelId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [channelId, user, isCurrentUserTyping]);

  // Debounced typing function (call this on text input change)
  const handleTyping = useCallback(() => {
    if (!channelId || !user) return;

    // If not already typing, start typing
    if (!isCurrentUserTyping) {
      startTyping();
    } else {
      // If already typing, reset the timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    }
  }, [channelId, user, isCurrentUserTyping, startTyping, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelId && isCurrentUserTyping) {
        TypingIndicatorService.stopTyping(channelId);
      }
    };
  }, [channelId, isCurrentUserTyping]);

  return {
    typingUsers,
    isCurrentUserTyping,
    handleTyping,
    startTyping,
    stopTyping,
  };
}

// Utility hook for managing typing state during message composition
export function useMessageComposition(channelId: string | undefined) {
  const [message, setMessage] = useState('');
  const { handleTyping, stopTyping, typingUsers } = useTypingIndicators(channelId);
  const previousMessageRef = useRef('');

  const handleMessageChange = useCallback((text: string) => {
    setMessage(text);
    
    // Only trigger typing if user is actually typing (text is being added)
    if (text.length > previousMessageRef.current.length) {
      handleTyping();
    }
    
    // If message is cleared, stop typing
    if (text.length === 0) {
      stopTyping();
    }
    
    previousMessageRef.current = text;
  }, [handleTyping, stopTyping]);

  const handleSendMessage = useCallback(async (onSend: (message: string) => Promise<void>) => {
    if (message.trim()) {
      // Stop typing before sending
      await stopTyping();
      
      // Send the message
      await onSend(message.trim());
      
      // Clear the input
      setMessage('');
      previousMessageRef.current = '';
    }
  }, [message, stopTyping]);

  return {
    message,
    setMessage: handleMessageChange,
    handleSendMessage,
    typingUsers,
  };
}