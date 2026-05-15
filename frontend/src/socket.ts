import { io, Socket } from "socket.io-client";
import { CONFIG } from "./config/app.config";

let socket: Socket | null = null;

export const initSocket = (userId: string) => {

  if (!socket) {
    socket = io(CONFIG.SOCKET_URL!, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
