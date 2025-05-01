const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

class Logger {
    constructor() {
        this.isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    }

    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const formattedData = data ? JSON.stringify(data, this.errorReplacer) : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message} ${formattedData}`.trim();
    }

    errorReplacer(key, value) {
        if (value instanceof Error) {
            return {
                message: value.message,
                stack: value.stack,
                ...value
            };
        }
        return value;
    }

    debug(message, data) {
        if (this.isDebugMode) {
            console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, data));
        }
    }

    info(message, data) {
        console.info(this.formatMessage(LOG_LEVELS.INFO, message, data));
    }

    warn(message, data) {
        console.warn(this.formatMessage(LOG_LEVELS.WARN, message, data));
    }

    error(message, error) {
        console.error(this.formatMessage(LOG_LEVELS.ERROR, message, error));
    }

    group(label) {
        console.group(label);
    }

    groupEnd() {
        console.groupEnd();
    }

    // Track performance
    time(label) {
        console.time(label);
    }

    timeEnd(label) {
        console.timeEnd(label);
    }
}

export const logger = new Logger();
export default logger; 