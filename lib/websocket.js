class WebSocketHandler {
    constructor() {
        this.socket = null;
        this.messageHandlers = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second delay
    }

    connect() {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        try {
            this.socket = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URL);

            this.socket.onopen = () => {
                console.log('[WebSocket] Connected');
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.messageHandlers.forEach(handler => handler(data));
                } catch (error) {
                    console.error('[WebSocket] Error parsing message:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('[WebSocket] Connection closed');
                this.handleReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
            };
        } catch (error) {
            console.error('[WebSocket] Connection error:', error);
            this.handleReconnect();
        }
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.reconnectDelay *= 2; // Exponential backoff
            console.log(`[WebSocket] Attempting to reconnect in ${this.reconnectDelay}ms...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.error('[WebSocket] Max reconnection attempts reached');
        }
    }

    addMessageHandler(handler) {
        this.messageHandlers.add(handler);
    }

    removeMessageHandler(handler) {
        this.messageHandlers.delete(handler);
    }

    sendMessage(message) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('[WebSocket] Connection not open');
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

const websocketHandler = new WebSocketHandler();
export default websocketHandler; 