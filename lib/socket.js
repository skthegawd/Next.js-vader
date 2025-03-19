// ✅ WebSocket Connection with Authentication & Auto-Reconnect
const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "wss://vader-yp5n.onrender.com/ws";

console.log("🔗 Connecting to WebSocket at:", SOCKET_BASE_URL);

// Retrieve authentication token
const getAuthToken = () => localStorage.getItem("vader_auth_token");

// WebSocket state
let socket = null;
let reconnectAttempts = 0;
const MAX_RETRIES = 5;

// ✅ WebSocket Initialization with Authentication
const connectWebSocket = () => {
    const token = getAuthToken();
    if (!token) {
        console.error("❌ No token available. WebSocket connection aborted.");
        return;
    }

    const wsURL = `${SOCKET_BASE_URL}?token=${token}`;
    console.log("✅ Connecting to WebSocket:", wsURL);

    socket = new WebSocket(wsURL);

    // ✅ Handle Successful Connection
    socket.onopen = () => {
        console.log("🎉 [WebSocket] Connected successfully.");
        reconnectAttempts = 0; // Reset retries
    };

    // ✅ Handle Incoming Messages
    socket.onmessage = (event) => {
        console.log("📩 [WebSocket] Message Received:", event.data);
    };

    // ✅ Handle Connection Closure
    socket.onclose = (event) => {
        console.warn("⚠️ [WebSocket] Disconnected:", event.reason);
        if (reconnectAttempts < MAX_RETRIES) {
            const retryTime = Math.min(5000, (reconnectAttempts + 1) * 2000); // Exponential backoff
            console.log(`🔄 Retrying WebSocket connection in ${retryTime / 1000} seconds...");
            setTimeout(connectWebSocket, retryTime);
            reconnectAttempts++;
        } else {
            console.error("❌ [WebSocket] Max reconnect attempts reached.");
        }
    };

    // ✅ Handle Errors Gracefully
    socket.onerror = (error) => {
        console.error("❌ [WebSocket] Connection Error:", error);
    };
};

// ✅ Function to Send Messages with Queueing
const messageQueue = [];

export const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("📤 Sending message:", message);
        socket.send(JSON.stringify({ text: message }));
    } else {
        console.warn("⚠️ WebSocket not connected. Queuing message.");
        messageQueue.push(message);
    }
};

// ✅ Ensure Queued Messages are Sent
const flushQueue = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        while (messageQueue.length > 0) {
            const queuedMessage = messageQueue.shift();
            sendMessage(queuedMessage);
        }
    }
};

// ✅ Initialize WebSocket
connectWebSocket();

export default connectWebSocket;