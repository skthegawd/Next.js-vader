import { logger } from './logger';

// WebSocket message types
export const WS_MESSAGE_TYPES = {
    STREAM: 'stream',
    ERROR: 'error',
    PING: 'ping',
    CHAT_MESSAGE: 'chat_message',
    MODEL_STATUS: 'model_status'
};

class WebSocketService {
    constructor() {
        this.ws = null;
        this.clientId = Math.random().toString(36).substring(7);
        this.messageHandlers = new Map();
        this.statusHandlers = new Set();
        this.connected = false;
    }

    connect() {
        if (!process.env.NEXT_PUBLIC_WS_URL) {
            logger.error('WebSocket URL is not configured');
            return;
        }

        if (this.ws?.readyState === WebSocket.OPEN) {
            logger.debug('WebSocket already connected');
            return;
        }

        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/${this.clientId}`;
        this.ws = new WebSocket(wsUrl);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.ws.onopen = () => {
            logger.debug('WebSocket connected');
            this.connected = true;
            this.notifyStatusChange('connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                logger.error('Failed to parse WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            logger.debug('WebSocket disconnected');
            this.connected = false;
            this.notifyStatusChange('disconnected');
            // Attempt to reconnect after a delay
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = (error) => {
            logger.error('WebSocket error:', error);
            this.notifyStatusChange('error');
        };
    }

    handleMessage(data) {
        const { type } = data;
        
        switch(type) {
            case WS_MESSAGE_TYPES.STREAM:
                // Handle streaming data
                this.handleStreamData(data);
                break;
            case WS_MESSAGE_TYPES.ERROR:
                // Handle error messages
                this.handleError(data);
                break;
            case WS_MESSAGE_TYPES.PING:
                // Handle ping messages
                this.handlePing();
                break;
            default:
                // Handle other message types
                const handlers = this.messageHandlers.get(type);
                if (handlers) {
                    handlers.forEach(handler => {
                        try {
                            handler(data);
                        } catch (error) {
                            logger.error(`Error in message handler for type ${type}:`, error);
                        }
                    });
                }
        }
    }

    handleStreamData(data) {
        const handlers = this.messageHandlers.get(WS_MESSAGE_TYPES.STREAM);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    handleError(data) {
        logger.error('WebSocket error message:', data);
        const handlers = this.messageHandlers.get(WS_MESSAGE_TYPES.ERROR);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    handlePing() {
        // Respond to ping with pong
        this.send(WS_MESSAGE_TYPES.PING, { status: 'pong' });
    }

    subscribe(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, new Set());
        }
        this.messageHandlers.get(messageType).add(handler);

        return () => {
            const handlers = this.messageHandlers.get(messageType);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.messageHandlers.delete(messageType);
                }
            }
        };
    }

    onStatusChange(handler) {
        this.statusHandlers.add(handler);
        return () => this.statusHandlers.delete(handler);
    }

    notifyStatusChange(status) {
        this.statusHandlers.forEach(handler => handler(status));
    }

    send(type, data) {
        if (!this.connected) {
            logger.error('Cannot send message: WebSocket is not connected');
            return false;
        }

        try {
            this.ws.send(JSON.stringify({ type, data }));
            return true;
        } catch (error) {
            logger.error('Failed to send WebSocket message:', error);
            return false;
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.messageHandlers.clear();
        this.statusHandlers.clear();
    }
}

// Create singleton instance
const wsService = new WebSocketService();
export default wsService; 