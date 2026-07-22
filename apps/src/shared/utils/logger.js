const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const configuredLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level) {
    return levels[level] <= levels[configuredLevel];
}

function format(level, message, meta) {
    const payload = {
        level,
        message,
        time: new Date().toISOString(),
        ...(meta && Object.keys(meta).length > 0 ? { meta } : {})
    };
    return process.env.NODE_ENV === 'production'
        ? JSON.stringify(payload)
        : `[${payload.time}] ${level.toUpperCase()} ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`;
}

function write(level, message, meta) {
    if (!shouldLog(level)) return;
    const line = format(level, message, meta);
    if (level === 'error') return console.error(line);
    if (level === 'warn') return console.warn(line);
    return console.log(line);
}

module.exports = {
    error(message, meta) {
        write('error', message, meta);
    },
    warn(message, meta) {
        write('warn', message, meta);
    },
    info(message, meta) {
        write('info', message, meta);
    },
    debug(message, meta) {
        write('debug', message, meta);
    }
};
