import { Server } from "socket.io";

let io: Server;

// เก็บ userId -> socketId
const onlineUsers: Record<string, string> = {};

export const initSocket = (server: any) => {

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    }
  });

  io.on("connection", (socket) => {

    const userId = socket.handshake.auth.userId;

    console.log("User connected:", socket.id);
    console.log("Auth userId:", userId);

    if (userId) {
      onlineUsers[userId] = socket.id;

      //join user room (ใช้สำหรับ notify ส่วนตัว)
      socket.join(`user_${userId}`);
    }

    console.log("onlineUsers:", onlineUsers);

    socket.on("join_trip", (tripId: string) => {

      const room = `trip_${tripId}`;

      socket.join(room);

      console.log(`socket ${socket.id} joined room ${room}`);

    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
      delete onlineUsers[userId];
    });

  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
};

export const getUserSocket = (userId: string) => {
  return onlineUsers[userId];
};