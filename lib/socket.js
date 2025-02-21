import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://vader-yp5n.onrender.com';
console.log("Connecting to WebSocket at:", SOCKET_URL);

const socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    transports: ["websocket"],
});

// Event Listeners for Debugging
socket.on("connect", () => {
    console.log("[WebSocket] Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.warn("[WebSocket] Disconnected:", reason);
});

socket.on("connect_error", (error) => {
    console.error("[WebSocket] Connection Error:", error);
});

export default socket;