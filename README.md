# Manager

# Socket example

import { useSocket } from '@/integrations/socket/socket-provider';

const MyComponent = () => {
    const { socket, isConnected } = useSocket();

    // Emitir evento personalizado
    const sendMessage = () => {
        socket?.emit('custom-event', { data: 'hello' });
    };

    // Escuchar evento personalizado
    useEffect(() => {
        socket?.on('custom-response', (data) => {
            console.log('Received:', data);
        });

        return () => {
            socket?.off('custom-response');
        };
    }, [socket]);

    return <div>...</div>;
};