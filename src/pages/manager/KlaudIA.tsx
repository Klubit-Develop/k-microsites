import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from '@tanstack/react-router';
import { useNotifications } from '@/hooks/useNotifications';
import { useChat } from '@/hooks/useChat';
import { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

const KlaudIA = () => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<'notifications' | 'chats'>('chats');
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');

    // Notificaciones
    const { 
        notifications, 
        unreadCount, 
        isConnected: notifConnected, 
        loading: notifLoading,
        markAsRead: markNotifAsRead,
        deleteNotification,
        refetch: refetchNotifications
    } = useNotifications();

    // Chat - sin chatId para la lista
    const chatList = useChat();

    // Chat - con chatId para la conversación
    const chatConversation = useChat(selectedChatId || undefined);

    const handleLogout = () => {
        logout();
        navigate({ to: '/' });
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChatId) return;
        
        await chatConversation.sendMessage(messageInput);
        setMessageInput('');
    };

    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId);
    };

    const handleBackToList = () => {
        setSelectedChatId(null);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-6">
            <h1 className="text-3xl font-bold font-['N27'] text-[#252E39]">
                KlaudIA
            </h1>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${notifConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-600">Notif</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${chatList.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-600">Chat</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setActiveTab('notifications'); setSelectedChatId(null); }}
                    className={`px-4 py-2 rounded-lg ${
                        activeTab === 'notifications' 
                            ? 'bg-[#252E39] text-white' 
                            : 'bg-gray-100'
                    }`}
                >
                    Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                    onClick={() => { setActiveTab('chats'); setSelectedChatId(null); }}
                    className={`px-4 py-2 rounded-lg ${
                        activeTab === 'chats' 
                            ? 'bg-[#252E39] text-white' 
                            : 'bg-gray-100'
                    }`}
                >
                    Chats {chatList.totalUnread > 0 && `(${chatList.totalUnread})`}
                </button>
            </div>

            <div className="w-full max-w-2xl space-y-4">
                {/* NOTIFICACIONES */}
                {activeTab === 'notifications' && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Notificaciones</h2>
                            <button
                                onClick={refetchNotifications}
                                disabled={notifLoading}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                {notifLoading ? 'Cargando...' : 'Actualizar'}
                            </button>
                        </div>

                        {notifLoading && notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Cargando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No tienes notificaciones</div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        className={`p-4 rounded-lg border ${
                                            notif.status === 'UNREAD' 
                                                ? 'bg-blue-50 border-blue-200' 
                                                : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-semibold">{notif.title}</p>
                                                <p className="text-sm text-gray-600">{notif.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {dayjs(notif.createdAt).fromNow()}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {notif.status === 'UNREAD' && (
                                                    <button
                                                        onClick={() => markNotifAsRead(notif.id)}
                                                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded"
                                                    >
                                                        Leer
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notif.id)}
                                                    className="px-3 py-1 text-xs bg-red-500 text-white rounded"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* CHATS - LISTA */}
                {activeTab === 'chats' && !selectedChatId && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Chats</h2>
                            <button
                                onClick={chatList.refetch}
                                disabled={chatList.loading}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                {chatList.loading ? 'Cargando...' : 'Actualizar'}
                            </button>
                        </div>

                        {chatList.loading && chatList.chats.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Cargando...</div>
                        ) : chatList.chats.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No tienes chats</div>
                        ) : (
                            <div className="space-y-2">
                                {chatList.chats.map((chat) => {
                                    const otherUser = chat.creatorId === user?.id 
                                        ? chat.recipient 
                                        : chat.creator;
                                    const isClubChat = !!chat.club;

                                    return (
                                        <div 
                                            key={chat.id} 
                                            onClick={() => handleSelectChat(chat.id)}
                                            className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                                                chat.unreadCount > 0 
                                                    ? 'bg-blue-50 border-blue-200' 
                                                    : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                                                    {isClubChat 
                                                        ? chat.club?.name.charAt(0).toUpperCase()
                                                        : otherUser?.firstName.charAt(0).toUpperCase()
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold">
                                                        {isClubChat 
                                                            ? chat.club?.name 
                                                            : `${otherUser?.firstName} ${otherUser?.lastName}`
                                                        }
                                                    </p>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {chat.lastMessage?.content || 'Sin mensajes'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {chat.lastMessage && (
                                                        <span className="text-xs text-gray-400">
                                                            {dayjs(chat.lastMessage.createdAt).fromNow()}
                                                        </span>
                                                    )}
                                                    {chat.unreadCount > 0 && (
                                                        <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                                                            {chat.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* CHATS - CONVERSACIÓN */}
                {activeTab === 'chats' && selectedChatId && (
                    <>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackToList}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                ← Volver
                            </button>
                            <h2 className="text-xl font-semibold">Conversación</h2>
                        </div>

                        {/* Typing indicator */}
                        {chatConversation.typingUsers.length > 0 && (
                            <div className="text-sm text-gray-500 italic">
                                Escribiendo...
                            </div>
                        )}

                        {/* Messages */}
                        <div className="h-96 overflow-y-auto flex flex-col-reverse gap-2 p-4 border rounded-lg bg-gray-50">
                            {chatConversation.messagesLoading && chatConversation.messages.length === 0 ? (
                                <div className="text-center text-gray-500">Cargando mensajes...</div>
                            ) : chatConversation.messages.length === 0 ? (
                                <div className="text-center text-gray-500">No hay mensajes</div>
                            ) : (
                                <>
                                    {chatConversation.messages.map((msg) => {
                                        const isMe = msg.senderId === user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`max-w-[70%] p-3 rounded-lg ${
                                                    isMe
                                                        ? 'bg-blue-500 text-white self-end ml-auto'
                                                        : 'bg-white border self-start'
                                                }`}
                                            >
                                                <p>{msg.content}</p>
                                                <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {dayjs(msg.createdAt).format('HH:mm')}
                                                    {isMe && (
                                                        <span className="ml-2">
                                                            {msg.isRead ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {chatConversation.hasMoreMessages && (
                                        <button
                                            onClick={chatConversation.loadMore}
                                            className="text-sm text-blue-500 hover:underline mx-auto"
                                        >
                                            Cargar más
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => {
                                    setMessageInput(e.target.value);
                                    chatConversation.sendTyping(true);
                                }}
                                onBlur={() => chatConversation.sendTyping(false)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim()}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                Enviar
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            <button
                onClick={handleLogout}
                className="px-6 py-2 bg-[#252E39] text-white rounded-lg hover:bg-[#1a2129]"
            >
                Cerrar sesión
            </button>
        </div>
    );
};

export default KlaudIA;