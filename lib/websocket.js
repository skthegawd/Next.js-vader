import { API_ENDPOINTS, WS_CONFIG } from './config';
import { logger } from './logger';

// WebSocket message types
export const WS_MESSAGE_TYPES = {
    MODEL_STATUS: 'model_status',
    VOICE_STATUS: 'voice_status',
    WAKEWORD_DETECTED: 'wakeword_detected',
    CHAT_MESSAGE: 'chat_message',
    ERROR: 'error',
    SYSTEM: 'system'
};

class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.messageHandlers = new Map();
        this.statusHandlers = new Set();
        this.connected = false;
    }

    connect() {
        if (!API_ENDPOINTS.WEBSOCKET) {
            logger.error('WebSocket URL is not configured');
            return;
        }

        if (this.ws?.readyState === WebSocket.OPEN) {
            logger.debug('WebSocket already connected');
            return;
        }

        this.ws = new WebSocket(API_ENDPOINTS.WEBSOCKET);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.ws.onopen = () => {
            logger.debug('WebSocket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.notifyStatusChange('connected');
            this.clearReconnectTimer();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                logger.error('Failed to parse WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            logger.debug('WebSocket disconnected');
            this.connected = false;
            this.notifyStatusChange('disconnected');
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            logger.error('WebSocket error:', error);
            this.notifyStatusChange('error');
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            logger.error('Max WebSocket reconnection attempts reached');
            this.notifyStatusChange('failed');
            return;
        }

        this.reconnectTimer = setTimeout(() => {
            logger.debug(`Attempting to reconnect (${this.reconnectAttempts + 1}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
            this.reconnectAttempts++;
            this.connect();
        }, WS_CONFIG.RECONNECT_DELAY);
    }

    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    subscribe(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, new Set());
        }
        this.messageHandlers.get(messageType).add(handler);

        // Return unsubscribe function
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

    handleMessage(message) {
        const { type, data } = message;
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
        this.clearReconnectTimer();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.reconnectAttempts = 0;
        this.connected = false;
        this.messageHandlers.clear();
        this.statusHandlers.clear();
    }
}

// Create singleton instance
const wsService = new WebSocketService();
export default wsService; 