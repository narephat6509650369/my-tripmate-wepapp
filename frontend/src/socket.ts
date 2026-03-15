import { io, Socket } from "socket.io-client";
import { CONFIG } from "./config/app.config";

let socket: Socket | null = null;

export const initSocket = (userId: string) => {

  if (!socket) {
    console.log("🔌 connecting socket to:", CONFIG.SOCKET_URL);

    socket = io(CONFIG.SOCKET_URL!, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("🟢 socket connected:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ socket connect error:", err);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 socket disconnected:", reason);
    });

  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 socket disconnected");
    socket.disconnect();
    socket = null;
  }
};