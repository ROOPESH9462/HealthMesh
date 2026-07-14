import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Instantiate Socket.IO connection using JWT token handshake
 */
export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true
  });

  return socket;
};

/**
 * Disconnect socket and clean up instance references
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Retrieve current active socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};
export default getSocket;
