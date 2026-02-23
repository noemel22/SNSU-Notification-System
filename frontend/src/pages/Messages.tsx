import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonItem,
  IonInput,
  IonAvatar,
  IonBadge,
  IonToast,
  IonActionSheet,
  IonSpinner,
  IonList
} from '@ionic/react';
import {
  sendOutline,
  refreshOutline,
  peopleOutline,
  arrowUndoOutline,
  closeOutline,
  trashOutline,
  ellipsisVerticalOutline,
  atOutline
} from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { messageService, userService, getMediaUrl } from '../services/api';
import socketService from '../services/socket';
import Sidebar from '../components/Sidebar';
import './Messages.css';

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderUsername: string;
  senderRole: string;
  senderProfilePicture?: string | null;
  createdAt: string;
}

// Memoized message component for better performance
const MessageBubble = memo(({
  message,
  isOwnMessage,
  onReply,
  onDelete,
  canDelete,
  getRoleBadgeColor,
  formatTime
}: {
  message: Message;
  isOwnMessage: boolean;
  onReply: (message: Message) => void;
  onDelete: (message: Message) => void;
  canDelete: boolean;
  getRoleBadgeColor: (role: string) => string;
  formatTime: (dateString: string) => string;
}) => {
  return (
    <div className={`message-wrapper ${isOwnMessage ? 'own-message' : 'other-message'}`}>
      {!isOwnMessage && (
        <IonAvatar className="message-avatar">
          {message.senderProfilePicture ? (
            <img
              src={message.senderProfilePicture.startsWith('http')
                ? message.senderProfilePicture
                : getMediaUrl(message.senderProfilePicture)
              }
              alt={message.senderUsername}
              onError={(e: any) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="avatar-placeholder-small"
            style={{ display: message.senderProfilePicture ? 'none' : 'flex' }}
          >
            {message.senderUsername?.[0]?.toUpperCase() || '?'}
          </div>
        </IonAvatar>
      )}
      <div className="message-bubble">
        {!isOwnMessage && (
          <div className="message-header">
            <span className="message-sender">{message.senderUsername}</span>
            <IonBadge color={getRoleBadgeColor(message.senderRole)} className="message-role-badge">
              {message.senderRole}
            </IonBadge>
          </div>
        )}
        <p className="message-content">{message.content}</p>
        <div className="message-footer">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          <div className="message-actions">
            <IonButton
              fill="clear"
              size="small"
              className="reply-button"
              onClick={() => onReply(message)}
            >
              <IonIcon icon={arrowUndoOutline} slot="icon-only" />
            </IonButton>
            {canDelete && (
              <IonButton
                fill="clear"
                size="small"
                className="delete-button"
                onClick={() => onDelete(message)}
              >
                <IonIcon icon={ellipsisVerticalOutline} slot="icon-only" />
              </IonButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Typing indicator component
const TypingIndicator = memo(({ typingUsers }: { typingUsers: string[] }) => {
  if (typingUsers.length === 0) return null;

  const displayText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">{displayText}</span>
    </div>
  );
});

const Messages: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLIonInputElement>(null);

  // Mention autocomplete state
  const [allUsers, setAllUsers] = useState<{ id: number; username: string; role: string; profilePicture?: string }[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<typeof allUsers>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  // Load all users for mention autocomplete
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await userService.getUsers();
        const users = [
          ...(response.data.students || []),
          ...(response.data.teachers || []),
          ...(response.data.admins || [])
        ];
        setAllUsers(users);
      } catch (error) {
        console.error('Error loading users for mentions:', error);
      }
    };
    loadUsers();
  }, []);

  // Handle mention from URL parameter (e.g., from Students page)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mentionUser = searchParams.get('mention');
    if (mentionUser) {
      setNewMessage(`@${mentionUser} `);
      // Focus the input
      setTimeout(() => inputRef.current?.setFocus(), 300);
    }
  }, [location.search]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, []);

  // Setup Socket.IO listeners
  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Auto-scroll if at bottom
      if (isAtBottom) {
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    // Listen for typing indicators
    const handleTyping = (data: { userId: number; username: string; isTyping: boolean }) => {
      if (data.userId === user?.id) return; // Ignore own typing

      setTypingUsers(prev => {
        if (data.isTyping) {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
        } else {
          return prev.filter(u => u !== data.username);
        }
        return prev;
      });
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.getSocket()?.on('user_typing', handleTyping);

    return () => {
      socketService.offNewMessage();
      socketService.getSocket()?.off('user_typing', handleTyping);
    };
  }, [user?.id, isAtBottom]);

  // Handle scroll position tracking
  const handleScroll = useCallback(async () => {
    if (!contentRef.current) return;

    const scrollElement = await contentRef.current.getScrollElement();
    const { scrollHeight, scrollTop, clientHeight } = scrollElement;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener('ionScroll', handleScroll);
      return () => content.removeEventListener('ionScroll', handleScroll);
    }
  }, [handleScroll]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await messageService.getMessages();
      setMessages(response.data);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setToast({ show: true, message: 'Error loading messages', color: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypingInput = useCallback(() => {
    // Emit typing start
    socketService.emitTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTyping(false);
    }, 2000);
  }, []);

  // Handle input change with @mention detection
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    handleTypingInput();

    // Detect @mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      // Check if there's no space after @ (still typing username)
      if (!afterAt.includes(' ') && afterAt.length > 0) {
        const searchTerm = afterAt.toLowerCase();
        setMentionSearch(searchTerm);
        const filtered = allUsers.filter(u =>
          u.username.toLowerCase().includes(searchTerm) && u.id !== user?.id
        ).slice(0, 5); // Limit to 5 suggestions
        setMentionSuggestions(filtered);
        setShowMentions(filtered.length > 0);
      } else if (afterAt.length === 0) {
        // Just typed @, show all users
        const filtered = allUsers.filter(u => u.id !== user?.id).slice(0, 5);
        setMentionSuggestions(filtered);
        setShowMentions(filtered.length > 0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Select a mention from suggestions
  const selectMention = (username: string) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const beforeAt = newMessage.slice(0, lastAtIndex);
    setNewMessage(`${beforeAt}@${username} `);
    setShowMentions(false);
    inputRef.current?.setFocus();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setIsSending(true);

    // Stop typing indicator
    socketService.emitTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      let messageContent = newMessage;

      // If replying, add reply indicator to message
      if (replyingTo) {
        messageContent = `@${replyingTo.senderUsername}: ${newMessage}`;
      }

      // Send via API for persistence - backend will broadcast via Socket.IO
      const response = await messageService.sendMessage({
        content: messageContent,
        isBroadcast: true
      });

      // Backend returns { message: string, data: fullMessage }
      // fullMessage has: id, senderId, content, timestamp, sender: { username, role, profilePicture }
      const msgData = response.data?.data;

      // Optimistically add message to state with correct database ID
      const newMsg: Message = {
        id: msgData?.id || Date.now(), // Use actual database ID
        content: messageContent,
        senderId: user?.id || 0,
        senderUsername: msgData?.sender?.username || user?.username || 'Unknown',
        senderRole: msgData?.sender?.role || user?.role || 'user',
        senderProfilePicture: msgData?.sender?.profilePicture || user?.profilePicture || null,
        createdAt: msgData?.timestamp || new Date().toISOString()
      };

      setMessages(prev => {
        // Check if message already exists (from socket)
        if (prev.some(m => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });

      setNewMessage('');
      setReplyingTo(null);
      scrollToBottom();
    } catch (error: any) {
      console.error('Send message error:', error);
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error sending message',
        color: 'danger'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
    inputRef.current?.setFocus();
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleDeleteClick = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowDeleteOptions(true);
  }, []);

  const handleDeleteForMe = async () => {
    if (!selectedMessage) return;

    try {
      await messageService.deleteMessageForMe(selectedMessage.id);
      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
      setToast({ show: true, message: 'Message deleted for you', color: 'success' });
    } catch (error: any) {
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error deleting message',
        color: 'danger'
      });
    } finally {
      setShowDeleteOptions(false);
      setSelectedMessage(null);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage) return;

    try {
      await messageService.deleteMessageForEveryone(selectedMessage.id);
      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
      setToast({ show: true, message: 'Message deleted for everyone', color: 'success' });
    } catch (error: any) {
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error deleting message',
        color: 'danger'
      });
    } finally {
      setShowDeleteOptions(false);
      setSelectedMessage(null);
    }
  };

  const scrollToBottom = useCallback(() => {
    contentRef.current?.scrollToBottom(300);
  }, []);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const getRoleBadgeColor = useCallback((role: string) => {
    const colors: Record<string, string> = {
      admin: 'danger',
      teacher: 'primary',
      student: 'success'
    };
    return colors[role] || 'medium';
  }, []);

  let lastDate = '';

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Messages</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={loadMessages} disabled={isLoading}>
                {isLoading ? <IonSpinner name="crescent" /> : <IonIcon icon={refreshOutline} />}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent ref={contentRef} className="messages-content" scrollEvents={true}>
          <div className="messages-container">
            {isLoading && messages.length === 0 ? (
              <div className="loading-state">
                <IonSpinner name="crescent" />
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={peopleOutline} size="large" />
                <h2>No messages yet</h2>
                <p>Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const messageDate = formatDate(message.createdAt);
                const showDateDivider = messageDate !== lastDate;
                lastDate = messageDate;
                const isOwnMessage = message.senderId === user?.id;
                const canDelete = isOwnMessage || user?.role === 'admin';

                return (
                  <React.Fragment key={message.id}>
                    {showDateDivider && (
                      <div className="date-divider">
                        <span>{messageDate}</span>
                      </div>
                    )}
                    <MessageBubble
                      message={message}
                      isOwnMessage={isOwnMessage}
                      onReply={handleReply}
                      onDelete={handleDeleteClick}
                      canDelete={canDelete}
                      getRoleBadgeColor={getRoleBadgeColor}
                      formatTime={formatTime}
                    />
                  </React.Fragment>
                );
              })
            )}

            <TypingIndicator typingUsers={typingUsers} />
          </div>

          <IonToast
            isOpen={toast.show}
            message={toast.message}
            duration={3000}
            color={toast.color}
            onDidDismiss={() => setToast({ ...toast, show: false })}
          />

          <IonActionSheet
            isOpen={showDeleteOptions}
            onDidDismiss={() => setShowDeleteOptions(false)}
            header="Delete Message"
            buttons={[
              {
                text: 'Delete for Me',
                icon: trashOutline,
                handler: handleDeleteForMe
              },
              ...(selectedMessage?.senderId === user?.id ? [{
                text: 'Delete for Everyone',
                icon: trashOutline,
                role: 'destructive' as const,
                handler: handleDeleteForEveryone
              }] : []),
              {
                text: 'Cancel',
                role: 'cancel' as const
              }
            ]}
          />
        </IonContent>

        <div className="message-input-container">
          {/* Mention Suggestions Drop-up */}
          {showMentions && (
            <div className="mention-suggestions">
              {mentionSuggestions.map((u) => (
                <div
                  key={u.id}
                  className="mention-suggestion-item"
                  onClick={() => selectMention(u.username)}
                >
                  <IonAvatar className="mention-avatar">
                    {u.profilePicture ? (
                      <img src={u.profilePicture.startsWith('http') ? u.profilePicture : `http://localhost:5000/${u.profilePicture}`} alt={u.username} />
                    ) : (
                      <div className="avatar-placeholder-small">{u.username[0].toUpperCase()}</div>
                    )}
                  </IonAvatar>
                  <div className="mention-info">
                    <span className="mention-username">{u.username}</span>
                    <IonBadge color={u.role === 'admin' ? 'danger' : u.role === 'teacher' ? 'success' : 'primary'} className="mention-role">
                      {u.role}
                    </IonBadge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {replyingTo && (
            <div className="reply-indicator">
              <div className="reply-info">
                <IonIcon icon={arrowUndoOutline} />
                <span>Replying to <strong>{replyingTo.senderUsername}</strong></span>
              </div>
              <IonButton fill="clear" size="small" onClick={cancelReply}>
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </div>
          )}
          <form onSubmit={handleSend} className="message-form">
            <IonItem lines="none" className="message-input-item">
              <IonInput
                ref={inputRef}
                value={newMessage}
                onIonInput={(e: any) => handleInputChange(e.target.value || '')}
                placeholder={replyingTo ? `Reply to ${replyingTo.senderUsername}...` : "Type a message..."}
                disabled={isSending}
              />
            </IonItem>
            <IonButton
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="send-button"
            >
              {isSending ? <IonSpinner name="crescent" /> : <IonIcon icon={sendOutline} />}
            </IonButton>
          </form>
        </div>
      </IonPage>
    </>
  );
};

export default Messages;
