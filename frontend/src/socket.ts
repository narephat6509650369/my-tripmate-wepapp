import { io, Socket } from "socket.io-client";
import { CONFIG } from "./config/app.config";

let socket: Socket | null = null;

export const initSocket = (userId: string) => {

  if (!socket) {

    socket = io(CONFIG.SOCKET_URL!, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { userId }
    });

    socket.on("connect", () => {
      console.log("🟢 socket connected:", socket?.id);
    });

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