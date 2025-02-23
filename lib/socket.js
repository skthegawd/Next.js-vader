// ✅ Ensure correct WebSocket URL (Match FastAPI WebSocket endpoint)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "wss://vader-yp5n.onrender.com/ws";
console.log("🔌 Connecting to WebSocket at:", SOCKET_URL);

// ✅ WebSocket Initialization
let socket = new WebSocket(SOCKET_URL);

// ✅ Event Listeners for Debugging
socket.onopen = () => {
    console.log("✅ [WebSocket] Connected to:", SOCKET_URL);
};

socket.onmessage = (event) => {
    console.log("📩 [WebSocket] Message Received:", event.data);
};

socket.onclose = (event) => {
    console.warn("⚠️ [WebSocket] Disconnected:", event.reason);
    reconnectWebSocket();  // Auto-reconnect if disconnected
};

socket.onerror = (error) => {
    console.error("🚨 [WebSocket] Connection Error:", error);
};

// ✅ Function to Send Messages (Ensure WebSocket is Ready)
export const sendMessage = (message) => {
    if (socket.readyState === WebSocket.OPEN) {
        console.log("📤 Sending message:", message);
        socket.send(JSON.stringify({ text: message }));
    } else {
        console.warn("⚠️ Cannot send message, WebSocket not connected.");
    }
};

// ✅ Auto-Reconnect Mechanism
const reconnectWebSocket = () => {
    console.log("🔄 [WebSocket] Attempting Reconnection...");
    setTimeout(() => {
        socket = new WebSocket(SOCKET_URL);

        socket.onopen = () => {
            console.log("✅ [WebSocket] Reconnected!");
        };

        socket.onmessage = (event) => {
            console.log("📩 [WebSocket] Message Received:", event.data);
        };

        socket.onclose = (event) => {
            console.warn("⚠️ [WebSocket] Disconnected:", event.reason);
            reconnectWebSocket();
        };

        socket.onerror = (error) => {
            console.error("🚨 [WebSocket] Connection Error:", error);
        };
    }, 3000);  // Wait 3 seconds before retrying
};

export default socket;
