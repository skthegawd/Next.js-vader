import { io } from 'socket.io-client';

// ✅ Ensure correct WebSocket URL (Match backend FastAPI endpoint)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'wss://vader-yp5n.onrender.com/ws';
console.log("🔌 Connecting to WebSocket at:", SOCKET_URL);

// ✅ Enhanced Socket Initialization with Better Reconnection Handling
const socket = io(SOCKET_URL, {
    transports: ["websocket"],  // Use only WebSocket (no polling fallback)
    reconnection: true,
    reconnectionAttempts: 10,   // Increased attempts for better stability
    reconnectionDelay: 3000,    // Wait 3 seconds before retrying
    timeout: 5000               // Auto-disconnect after 5 seconds if no response
});

// ✅ Event Listeners for Debugging
socket.on("connect", () => {
    console.log("✅ [WebSocket] Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.warn("⚠️ [WebSocket] Disconnected:", reason);
});

socket.on("connect_error", (error) => {
    console.error("🚨 [WebSocket] Connection Error:", error);
});

socket.on("reconnect_attempt", (attempt) => {
    console.log(`🔄 [WebSocket] Reconnecting (Attempt ${attempt})...`);
});

socket.on("reconnect_failed", () => {
    console.error("❌ [WebSocket] Reconnection Failed! Server might be down.");
});

// ✅ Handle Incoming Messages
socket.on("message", (data) => {
    console.log("📩 [WebSocket] Message Received:", data);
});

// ✅ Function to Send Messages (Ensure WebSocket is Ready)
export const sendMessage = (message) => {
    if (socket.connected) {
        console.log("📤 Sending message:", message);
        socket.emit("message", { text: message });
    } else {
        console.warn("⚠️ Cannot send message, WebSocket not connected.");
    }
};

export default socket;
