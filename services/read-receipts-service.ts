import { supabase } from '@/lib/supabase';
import { ServiceResponse } from './types';

export interface ReadReceipt {
  id: string;
  message_id: string;
  profile_id: string;
  read_at: string;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

export interface MessageReadStatus {
  message_id: string;
  is_read: boolean;
  read_at?: string;
  read_by: ReadReceipt[];
  unread_count: number;
  total_recipients: number;
}

export class ReadReceiptsService {
  // Cache for read receipts with optimistic updates
  private static readReceiptCache = new Map<string, ReadReceipt[]>();
  
  // Track which messages current user has read (for quick lookups)
  private static userReadMessages = new Set<string>();
  
  /**
   * Initialize user's read messages from database
   */
  static async initializeUserReadMessages(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('message_read_receipts')
        .select('message_id')
        .eq('profile_id', userId);
      
      if (!error && data) {
        this.userReadMessages.clear();
        data.forEach(receipt => this.userReadMessages.add(receipt.message_id));
      }
    } catch (error) {
      console.error('Error initializing user read messages:', error);
    }
  }
  
  /**
   * Check if current user has read a message
   */
  static hasUserReadMessage(messageId: string): boolean {
    return this.userReadMessages.has(messageId);
  }
  
  /**
   * Get cached read receipts for a message
   */
  static getCachedReadReceipts(messageId: string): ReadReceipt[] {
    return this.readReceiptCache.get(messageId) || [];
  }
  
  /**
   * Set cached read receipts for a message
   */
  static setCachedReadReceipts(messageId: string, receipts: ReadReceipt[]) {
    this.readReceiptCache.set(messageId, receipts);
  }
  
  /**
   * Clear cached read receipts for a message
   */
  static clearCachedReadReceipts(messageId: string) {
    this.readReceiptCache.delete(messageId);
  }
  /**
   * Mark a message as read by the current user
   */
  static async markMessageAsRead(messageId: string): Promise<ServiceResponse<ReadReceipt>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Insert or update read receipt (upsert)
      const { data, error } = await supabase
        .from('message_read_receipts')
        .upsert(
          {
            message_id: messageId,
            profile_id: user.id,
            read_at: new Date().toISOString(),
          },
          {
            onConflict: 'message_id,profile_id',
          }
        )
        .select(`
          *,
          profiles:profile_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .single();

      if (error) {
        // Don't treat "already exists" as an error
        if (error.code === '23505') {
          this.userReadMessages.add(messageId);
          return { success: true, data: {} as ReadReceipt };
        }
        
        console.error('Error marking message as read:', error);
        return { success: false, error: error.message };
      }
      
      // Ensure user read messages is updated
      this.userReadMessages.add(messageId);

      return { success: true, data };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: 'Failed to mark message as read' };
    }
  }

  /**
   * Mark multiple messages as read (bulk operation)
   */
  static async markMessagesAsRead(messageIds: string[]): Promise<ServiceResponse<ReadReceipt[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      if (messageIds.length === 0) {
        return { success: true, data: [] };
      }

      const receipts = messageIds.map(messageId => ({
        message_id: messageId,
        profile_id: user.id,
        read_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('message_read_receipts')
        .upsert(receipts, {
          onConflict: 'message_id,profile_id',
        })
        .select(`
          *,
          profiles:profile_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `);

      if (error) {
        console.error('Error marking messages as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: 'Failed to mark messages as read' };
    }
  }

  /**
   * Get read receipts for a specific message
   */
  static async getMessageReadReceipts(messageId: string): Promise<ServiceResponse<ReadReceipt[]>> {
    try {
      const { data, error } = await supabase
        .from('message_read_receipts')
        .select(`
          *,
          profiles:profile_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('message_id', messageId)
        .order('read_at', { ascending: false });

      if (error) {
        console.error('Error fetching read receipts:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching read receipts:', error);
      return { success: false, error: 'Failed to fetch read receipts' };
    }
  }

  /**
   * Get read status for multiple messages (optimized for message lists)
   */
  static async getBatchMessageReadStatus(
    messageIds: string[],
    channelParticipants: string[]
  ): Promise<ServiceResponse<Record<string, MessageReadStatus>>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      if (messageIds.length === 0) {
        return { success: true, data: {} };
      }

      // Get all read receipts for these messages
      const { data: receipts, error } = await supabase
        .from('message_read_receipts')
        .select(`
          *,
          profiles:profile_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .in('message_id', messageIds);

      if (error) {
        console.error('Error fetching batch read receipts:', error);
        return { success: false, error: error.message };
      }

      // Group receipts by message ID
      const receiptsByMessage: Record<string, ReadReceipt[]> = {};
      (receipts || []).forEach((receipt) => {
        if (!receiptsByMessage[receipt.message_id]) {
          receiptsByMessage[receipt.message_id] = [];
        }
        receiptsByMessage[receipt.message_id].push(receipt);
      });

      // Calculate read status for each message
      const result: Record<string, MessageReadStatus> = {};
      messageIds.forEach((messageId) => {
        const messageReceipts = receiptsByMessage[messageId] || [];
        const currentUserReceipt = messageReceipts.find(r => r.profile_id === user.id);
        
        result[messageId] = {
          message_id: messageId,
          is_read: !!currentUserReceipt,
          read_at: currentUserReceipt?.read_at,
          read_by: messageReceipts,
          unread_count: Math.max(0, channelParticipants.length - messageReceipts.length),
          total_recipients: channelParticipants.length,
        };
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching batch read status:', error);
      return { success: false, error: 'Failed to fetch read status' };
    }
  }

  /**
   * Get unread message count for a channel
   */
  static async getUnreadMessageCount(
    channelId: string,
    since?: string
  ): Promise<ServiceResponse<number>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Validate channelId
      if (!channelId || channelId.trim() === '') {
        return { success: false, error: 'Channel ID is required' };
      }

      // Parse channel ID to extract moai ID (remove 'moai-' prefix if present)
      const moaiId = channelId.startsWith('moai-') ? channelId.replace('moai-', '') : channelId;

      // Get all messages in the channel that haven't been read by the user
      let query = supabase
        .from('messages')
        .select('id')
        .eq('moai_id', moaiId)
        .neq('profile_id', user.id); // Don't count own messages

      if (since) {
        query = query.gt('created_at', since);
      }

      const { data: messages, error: messagesError } = await query;

      if (messagesError) {
        console.error('Error fetching messages for unread count:', messagesError);
        
        // Handle specific database errors
        if (messagesError.code === '42P01') {
          return { success: false, error: 'Messages table not found' };
        }
        
        return { success: false, error: `Failed to fetch messages: ${messagesError.message}` };
      }

      if (!messages || messages.length === 0) {
        return { success: true, data: 0 };
      }

      const messageIds = messages.map(m => m.id);

      // Get read receipts for these messages by the current user
      const { data: readReceipts, error: receiptsError } = await supabase
        .from('message_read_receipts')
        .select('message_id')
        .in('message_id', messageIds)
        .eq('profile_id', user.id);

      if (receiptsError) {
        console.error('Error fetching read receipts for unread count:', receiptsError);
        
        // Handle specific database errors
        if (receiptsError.code === '42P01') {
          return { success: false, error: 'Read receipts table not found' };
        }
        
        return { success: false, error: `Failed to fetch read receipts: ${receiptsError.message}` };
      }

      const readMessageIds = new Set((readReceipts || []).map(r => r.message_id));
      const unreadCount = messageIds.filter(id => !readMessageIds.has(id)).length;

      console.log(`Unread count for channel ${channelId}: ${unreadCount}/${messageIds.length}`);
      return { success: true, data: unreadCount };
      
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      
      // Handle network errors
      if (error?.message?.includes('fetch')) {
        return { success: false, error: 'Network error - please check your connection' };
      }
      
      return { success: false, error: 'Failed to get unread count' };
    }
  }

  /**
   * Handle read receipt update from realtime event (called by ChatService)
   */
  static async handleReadReceiptUpdate(readReceiptUpdate: ReadReceipt) {
    const messageId = readReceiptUpdate.message_id;
    const currentReceipts = this.getCachedReadReceipts(messageId);
    
    // Add new read receipt (avoid duplicates)
    const existingIndex = currentReceipts.findIndex(
      r => r.profile_id === readReceiptUpdate.profile_id
    );
    
    if (existingIndex === -1) {
      this.setCachedReadReceipts(messageId, [...currentReceipts, readReceiptUpdate]);
    } else {
      // Update existing receipt with newer read_at time if applicable
      const updatedReceipts = [...currentReceipts];
      updatedReceipts[existingIndex] = readReceiptUpdate;
      this.setCachedReadReceipts(messageId, updatedReceipts);
    }
    
    // Update user read messages set
    const { data: { user } } = await supabase.auth.getUser();
    if (user && readReceiptUpdate.profile_id === user.id) {
      this.userReadMessages.add(messageId);
    }
  }
  
  /**
   * Subscribe to read receipt changes for a message (deprecated - use ChatService instead)
   * @deprecated Use ChatService.subscribeToChannelMessages with onReadReceipt callback
   */
  static subscribeToMessageReadReceipts(
    messageId: string,
    onUpdate: (receipts: ReadReceipt[]) => void
  ) {
    console.warn('ReadReceiptsService.subscribeToMessageReadReceipts is deprecated. Use ChatService.subscribeToChannelMessages instead.');
    
    const subscription = supabase
      .channel(`read_receipts:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_read_receipts',
          filter: `message_id=eq.${messageId}`,
        },
        async () => {
          // Fetch updated read receipts
          const result = await this.getMessageReadReceipts(messageId);
          if (result.success) {
            this.setCachedReadReceipts(messageId, result.data);
            onUpdate(result.data);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Auto-mark message as read when it comes into view (presence-based)
   */
  static async autoMarkAsReadSingle(messageId: string, authorId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === authorId) {
        return; // Don't mark own messages as read
      }
      
      if (this.hasUserReadMessage(messageId)) {
        return; // Already marked as read
      }
      
      // Mark as read silently
      await this.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Error auto-marking message as read:', error);
    }
  }
  
  /**
   * Auto-mark messages as read when they come into view (batch operation)
   */
  static async autoMarkAsRead(
    messageIds: string[],
    delay: number = 1000
  ): Promise<void> {
    // Debounce the read marking to avoid excessive API calls
    setTimeout(async () => {
      const result = await this.markMessagesAsRead(messageIds);
      if (!result.success) {
        console.warn('Failed to auto-mark messages as read:', result.error);
      }
    }, delay);
  }

  /**
   * Get last read message ID for a channel (for scroll position restoration)
   */
  static async getLastReadMessageId(channelId: string): Promise<ServiceResponse<string | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Validate channelId
      if (!channelId || channelId.trim() === '') {
        return { success: false, error: 'Channel ID is required' };
      }

      // Parse channel ID to extract moai ID (remove 'moai-' prefix if present)
      const moaiId = channelId.startsWith('moai-') ? channelId.replace('moai-', '') : channelId;

      // First, get all messages in the channel
      const { data: channelMessages, error: channelError } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('moai_id', moaiId)
        .order('created_at', { ascending: false });

      if (channelError) {
        console.error('Error fetching channel messages:', channelError);
        
        // Handle specific database errors
        if (channelError.code === '42P01') {
          return { success: false, error: 'Messages table not found' };
        }
        if (channelError.code === '42703') {
          return { success: false, error: 'Column not found in messages table' };
        }
        
        return { success: false, error: `Failed to fetch channel messages: ${channelError.message}` };
      }

      if (!channelMessages || channelMessages.length === 0) {
        // No messages in channel - this is valid
        return { success: true, data: null };
      }

      const messageIds = channelMessages.map(m => m.id);

      // Get the most recent read receipt for this user in this channel
      const { data: readReceipts, error: receiptError } = await supabase
        .from('message_read_receipts')
        .select('message_id, read_at')
        .eq('profile_id', user.id)
        .in('message_id', messageIds)
        .order('read_at', { ascending: false })
        .limit(1);

      if (receiptError) {
        console.error('Error fetching read receipts:', receiptError);
        
        // Handle specific database errors
        if (receiptError.code === '42P01') {
          return { success: false, error: 'Read receipts table not found' };
        }
        if (receiptError.code === '42703') {
          return { success: false, error: 'Column not found in read receipts table' };
        }
        
        return { success: false, error: `Failed to fetch read receipts: ${receiptError.message}` };
      }

      if (!readReceipts || readReceipts.length === 0) {
        // No read receipts found for this user in this channel - this is valid
        console.log(`No read receipts found for user ${user.id} in channel ${channelId}`);
        return { success: true, data: null };
      }

      console.log(`Found last read message: ${readReceipts[0].message_id} for channel ${channelId}`);
      return { success: true, data: readReceipts[0].message_id };
      
    } catch (error: any) {
      console.error('Error fetching last read message:', error);
      
      // Handle network errors
      if (error?.message?.includes('fetch')) {
        return { success: false, error: 'Network error - please check your connection' };
      }
      
      return { success: false, error: 'Failed to fetch last read message' };
    }
  }
}