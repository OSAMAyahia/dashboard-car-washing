import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const WS_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/v1').replace(/\/v1$/, '');

/** Subscribe to a branch's live queue. `onUpdate` fires on every work-order change. */
export function useQueueSocket(branchId: string | undefined, onUpdate: () => void) {
  useEffect(() => {
    if (!branchId) return;
    const token = getAccessToken();
    if (!token) return;

    const socket: Socket = io(`${WS_BASE}/ops`, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => socket.emit('subscribe', { branchId }));
    socket.on('queue:update', onUpdate);

    return () => {
      socket.off('queue:update', onUpdate);
      socket.disconnect();
    };
  }, [branchId, onUpdate]);
}
