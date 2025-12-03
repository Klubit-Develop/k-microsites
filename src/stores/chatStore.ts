import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar: string | null;
}

interface Message {
    id: string;
    content: string;
    type: 'TEXT' | 'USER' | 'ARTIST' | 'EVENT' | 'CLUB';
    isRead: boolean;
    createdAt: string;
    senderId: string;
    sender: User;
    referenceId?: string;
}

interface Chat {
    id: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    creatorId: string;
    recipientId: string | null;
    clubId: string | null;
    creator: User;
    recipient: User | null;
    club: {
        id: string;
        name: string;
        slug: string;
        logo: string | null;
    } | null;
    lastMessage: Message | null;
    unreadCount: number;
}

interface ChatStore {
    // State
    chats: Chat[];
    messages: Message[];
    activeChatId: string | null;
    loading: boolean;
    messagesLoading: boolean;
    hasMoreMessages: boolean;
    typingUsers: Record<string, string[]>;
    isConnected: boolean;

    // Socket
    connectSocket: (token: string, userId: string) => void;
    disconnectSocket: () => void;
    joinChat: (chatId: string) => void;
    leaveChat: (chatId: string) => void;
    sendTyping: (chatId: string, isTyping: boolean) => void;

    // API
    fetchChats: (token: string) => Promise<void>;
    fetchMessages: (token: string, chatId: string, cursor?: string) => Promise<void>;
    createChat: (token: string, recipientId?: string, clubId?: string) => Promise<Chat | null>;
    sendMessage: (token: string, chatId: string, content: string, type?: Message['type'], referenceId?: string) => Promise<Message | null>;
    markAsRead: (token: string, chatId: string) => Promise<void>;
    deleteChat: (token: string, chatId: string) => Promise<void>;

    // Helpers
    setActiveChatId: (chatId: string | null) => void;
    getTotalUnread: () => number;
}

let socket: Socket | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
    chats: [],
    messages: [],
    activeChatId: null,
    loading: false,
    messagesLoading: false,
    hasMoreMessages: true,
    typingUsers: {},
    isConnected: false,

    // === SOCKET ===

    connectSocket: (token: string, userId: string) => {
        if (socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        if (socket) {
            socket.disconnect();
            socket = null;
        }

        console.log('Connecting chat socket...');
        
        socket = io(API_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('Chat socket connected:', socket?.id);
            set({ isConnected: true });
        });

        socket.on('disconnect', () => {
            console.log('Chat socket disconnected');
            set({ isConnected: false });
        });

        socket.on('connect_error', (error) => {
            console.error('Chat socket connection error:', error);
            set({ isConnected: false });
        });

        // Nuevo chat creado
        socket.on('chat:new', (chat: Chat) => {
            console.log('New chat received:', chat);
            set((state) => {
                const exists = state.chats.find((c) => c.id === chat.id);
                if (exists) return state;
                return { chats: [chat, ...state.chats] };
            });
        });

        // Nuevo mensaje (para lista de chats)
        socket.on('chat:newMessage', (data: { chatId: string; message: Message }) => {
            console.log('New message notification:', data);
            
            set((state) => ({
                chats: state.chats
                    .map((chat) => {
                        if (chat.id === data.chatId) {
                            const isFromMe = data.message.senderId === userId;
                            return {
                                ...chat,
                                lastMessage: data.message,
                                unreadCount: isFromMe ? chat.unreadCount : chat.unreadCount + 1,
                                updatedAt: data.message.createdAt,
                            };
                        }
                        return chat;
                    })
                    .sort((a, b) =>
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    ),
            }));
        });

        // Mensaje en chat activo
        socket.on('chat:message', (message: Message) => {
            console.log('Message in active chat:', message);
            const { activeChatId } = get();

            if (activeChatId && message.senderId !== userId) {
                set((state) => {
                    const exists = state.messages.find((m) => m.id === message.id);
                    if (exists) return state;
                    return { messages: [message, ...state.messages] };
                });
            }
        });

        // Mensajes leídos
        socket.on('chat:read', (data: { chatId: string; readBy: string }) => {
            console.log('Messages read:', data);
            
            if (data.readBy !== userId) {
                set((state) => ({
                    chats: state.chats.map((chat) =>
                        chat.id === data.chatId ? { ...chat, unreadCount: 0 } : chat
                    ),
                    messages: state.messages.map((msg) =>
                        msg.senderId === userId ? { ...msg, isRead: true } : msg
                    ),
                }));
            }
        });

        // Typing
        socket.on('chat:typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
            if (data.userId === userId) return;
            
            set((state) => {
                const chatTyping = state.typingUsers[data.chatId] || [];

                if (data.isTyping && !chatTyping.includes(data.userId)) {
                    return {
                        typingUsers: {
                            ...state.typingUsers,
                            [data.chatId]: [...chatTyping, data.userId],
                        },
                    };
                } else if (!data.isTyping) {
                    return {
                        typingUsers: {
                            ...state.typingUsers,
                            [data.chatId]: chatTyping.filter((id) => id !== data.userId),
                        },
                    };
                }
                return state;
            });
        });

        // Chat eliminado
        socket.on('chat:deleted', (data: { chatId: string }) => {
            console.log('Chat deleted:', data);
            set((state) => ({
                chats: state.chats.filter((c) => c.id !== data.chatId),
                activeChatId: state.activeChatId === data.chatId ? null : state.activeChatId,
                messages: state.activeChatId === data.chatId ? [] : state.messages,
            }));
        });
    },

    disconnectSocket: () => {
        if (socket) {
            console.log('Disconnecting chat socket...');
            socket.disconnect();
            socket = null;
            set({ isConnected: false });
        }
    },

    joinChat: (chatId: string) => {
        if (socket?.connected) {
            console.log('Joining chat room:', chatId);
            socket.emit('chat:join', chatId);
        }
    },

    leaveChat: (chatId: string) => {
        if (socket?.connected) {
            console.log('Leaving chat room:', chatId);
            socket.emit('chat:leave', chatId);
        }
    },

    sendTyping: (chatId: string, isTyping: boolean) => {
        if (socket?.connected) {
            socket.emit('chat:typing', { chatId, isTyping });
        }
    },

    // === API ===

    fetchChats: async (token: string) => {
        try {
            set({ loading: true });

            const response = await fetch(`${API_URL}/v2/chats`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                set({ chats: data.data.chats || [] });
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            set({ loading: false });
        }
    },

    fetchMessages: async (token: string, chatId: string, cursor?: string) => {
        try {
            set({ messagesLoading: true });

            const url = new URL(`${API_URL}/v2/chats/${chatId}/messages`);
            url.searchParams.set('limit', '50');
            if (cursor) url.searchParams.set('cursor', cursor);

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const newMessages = data.data.messages || [];

                set((state) => ({
                    messages: cursor ? [...state.messages, ...newMessages] : newMessages,
                    hasMoreMessages: newMessages.length === 50,
                }));
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            set({ messagesLoading: false });
        }
    },

    createChat: async (token: string, recipientId?: string, clubId?: string) => {
        try {
            const response = await fetch(`${API_URL}/v2/chats`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipientId, clubId }),
            });

            if (response.ok) {
                const data = await response.json();
                const chat = data.data.chat;

                set((state) => {
                    const exists = state.chats.find((c) => c.id === chat.id);
                    if (exists) return state;
                    return { chats: [chat, ...state.chats] };
                });

                return chat;
            }
            return null;
        } catch (error) {
            console.error('Error creating chat:', error);
            return null;
        }
    },

    sendMessage: async (token: string, chatId: string, content: string, type = 'TEXT', referenceId?: string) => {
        if (!content.trim()) return null;

        try {
            const response = await fetch(`${API_URL}/v2/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, type, referenceId }),
            });

            if (response.ok) {
                const data = await response.json();
                const message = data.data.message;

                // Agregar mensaje propio inmediatamente
                set((state) => {
                    const exists = state.messages.find((m) => m.id === message.id);
                    if (exists) return state;
                    return { messages: [message, ...state.messages] };
                });

                return message;
            }
            return null;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    },

    markAsRead: async (token: string, chatId: string) => {
        try {
            await fetch(`${API_URL}/v2/chats/${chatId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            set((state) => ({
                chats: state.chats.map((chat) =>
                    chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
                ),
            }));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    },

    deleteChat: async (token: string, chatId: string) => {
        try {
            const response = await fetch(`${API_URL}/v2/chats/${chatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                set((state) => ({
                    chats: state.chats.filter((c) => c.id !== chatId),
                    activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
                    messages: state.activeChatId === chatId ? [] : state.messages,
                }));
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    },

    // === HELPERS ===

    setActiveChatId: (chatId: string | null) => {
        set({ activeChatId: chatId, messages: [], hasMoreMessages: true });
    },

    getTotalUnread: () => {
        return get().chats.reduce((acc, chat) => acc + chat.unreadCount, 0);
    },
}));