import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export type ClientInfo = { clientId: string; username: string };

export function useHostSocket(
  username: string,
  onClientList: (clients: ClientInfo[]) => void,
  onAnswer: (data: any) => void,
  onICE: (data: any) => void,
  onUserDisconnected: (userId: string) => void
): React.MutableRefObject<Socket | null> {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!username) return;
    socketRef.current = io('http://localhost:4000');
    socketRef.current.emit('join', { clientId: username, role: 'host' });

    socketRef.current.on('client-list', (clients) => {
      // eslint-disable-next-line no-console
      console.log('[SOCKET EVENT] client-list', clients);
      onClientList(clients);
    });
    socketRef.current.on('answer', onAnswer);
    socketRef.current.on('ice-candidate', onICE);
    socketRef.current.on('user-disconnected', onUserDisconnected);

    return () => {
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line
  }, [username]);

  return socketRef;
}
