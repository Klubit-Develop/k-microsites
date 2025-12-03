import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';

export const useChat = (chatId?: string) => {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const initialized = useRef(false);

    // Selectors individuales para reactividad
    const chats = useChatStore((state) => state.chats);
    const messages = useChatStore((state) => state.messages);
    const loading = useChatStore((state) => state.loading);
    const messagesLoading = useChatStore((state) => state.messagesLoading);
    const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
    const typingUsers = useChatStore((state) => state.typingUsers);
    const isConnected = useChatStore((state) => state.isConnected);

    // Actions
    const connectSocket = useChatStore((state) => state.connectSocket);
    const joinChat = useChatStore((state) => state.joinChat);
    const leaveChat = useChatStore((state) => state.leaveChat);
    const sendTyping = useChatStore((state) => state.sendTyping);
    const fetchChats = useChatStore((state) => state.fetchChats);
    const fetchMessages = useChatStore((state) => state.fetchMessages);
    const createChat = useChatStore((state) => state.createChat);
    const sendMessage = useChatStore((state) => state.sendMessage);
    const markAsRead = useChatStore((state) => state.markAsRead);
    const deleteChat = useChatStore((state) => state.deleteChat);
    const setActiveChatId = useChatStore((state) => state.setActiveChatId);

    // Calcular totalUnread reactivamente
    const totalUnread = chats.reduce((acc, chat) => acc + chat.unreadCount, 0);

    // Conectar socket y cargar chats una sola vez
    useEffect(() => {
        if (token && user?.id && !initialized.current) {
            initialized.current = true;
            connectSocket(token, user.id);
            fetchChats(token);
        }
    }, [token, user?.id]);

    // Unirse a chat específico cuando cambia
    useEffect(() => {
        if (!token || !chatId) return;

        setActiveChatId(chatId);
        joinChat(chatId);
        fetchMessages(token, chatId);
        markAsRead(token, chatId);

        return () => {
            leaveChat(chatId);
            setActiveChatId(null);
        };
    }, [chatId, token]);

    return {
        chats,
        messages,
        loading,
        messagesLoading,
        hasMoreMessages,
        isConnected,
        typingUsers: chatId ? typingUsers[chatId] || [] : [],
        totalUnread,
        
        createChat: (recipientId?: string, clubId?: string) => 
            token ? createChat(token, recipientId, clubId) : Promise.resolve(null),
        
        sendMessage: (content: string, type?: 'TEXT' | 'USER' | 'ARTIST' | 'EVENT' | 'CLUB', referenceId?: string) =>
            token && chatId ? sendMessage(token, chatId, content, type, referenceId) : Promise.resolve(null),
        
        markAsRead: () => token && chatId && markAsRead(token, chatId),
        
        deleteChat: (id: string) => token && deleteChat(token, id),
        
        sendTyping: (isTyping: boolean) => chatId && sendTyping(chatId, isTyping),
        
        loadMore: () => {
            if (token && chatId && messages.length > 0 && hasMoreMessages) {
                fetchMessages(token, chatId, messages[messages.length - 1].createdAt);
            }
        },
        
        refetch: () => token && fetchChats(token),
    };
};