import { io } from "socket.io-client";
import { CONFIG } from "./config/app.config";

const socket = io(CONFIG.SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"]
});

export default socket;