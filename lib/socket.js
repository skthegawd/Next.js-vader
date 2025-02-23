// ✅ Ensure correct WebSocket URL (Match FastAPI WebSocket endpoint)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "wss://vader-yp5n.onrender.com/ws";

console.log("🔌 Connecting to WebSocket at:", SOCKET_URL);

// ✅ Retrieve JWT Token
const getAuthToken = () => localStorage.getItem("access_token");

// ✅ WebSocket Initialization with Token Authentication
const connectWebSocket = () => {
    const token = getAuthToken();
    const wsURL = `${SOCKET_URL}?token=${token}`; // ✅ Attach token as query param
    let socket = new WebSocket(wsURL);

    socket.onopen = () => {
        console.log("✅ [WebSocket] Connected to:", wsURL);
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

    return socket;
};

// ✅ Auto-Reconnect Mechanism
const reconnectWebSocket = () => {
    console.log("🔄 [WebSocket] Attempting Reconnection...");
    setTimeout(() => {
        socket = connectWebSocket();
    }, 3000);  // Wait 3 seconds before retrying
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

export default connectWebSocket;
