import { useEffect } from 'react';
import { getSocket } from '../utils/socket';

/**
 * Subscribe to one or more socket events.
 * Automatically cleans up listeners when the component unmounts.
 *
 * Usage:
 *   useSocket({
 *     'new-message': (data) => setMessages(prev => [...prev, data.message]),
 *     'hand-update': (data) => setRaisedHands(data.raisedHands),
 *   });
 */
export function useSocket(eventHandlers = {}) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Emit a socket event.
 * Returns the socket's emit function (safe — returns undefined if no socket).
 */
export function useSocketEmit() {
  return (event, data) => {
    const socket = getSocket();
    socket?.emit(event, data);
  };
}
