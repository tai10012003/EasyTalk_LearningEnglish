let io = null;
const { Server } = require("socket.io");

function initSocket(server) {
    io = new Server(server, { cors: { origin: "http://localhost:5173" } });
    const onlineUsers = new Map();
    global.onlineUsers = onlineUsers;
    io.on("connection", (socket) => {
        console.log("✅ New socket connected:", socket.id);
        socket.on("register", (userId) => {
            onlineUsers.set(userId, socket.id);
        });
        socket.on("disconnect", () => {
            for (const [userId, sockId] of onlineUsers.entries()) {
                if (sockId == socket.id) onlineUsers.delete(userId);
            }
        });
    });
    return io;
}

function getIo() {
    if (!io) throw new Error("Socket.io chưa được khởi tạo!");
    return io;
}

module.exports = { initSocket, getIo };