const TRANSIENT_NETWORK_CODES = new Set([
    'ECONNRESET',
    'ECONNREFUSED',
    'ECONNABORTED',
    'ETIMEDOUT',
    'ESOCKETTIMEDOUT',
    'EPIPE',
    'EAI_AGAIN',
    'EHOSTUNREACH',
    'ENETUNREACH'
]);

const TIMEOUT_ERROR_CODE = 'ERESILIENCETIMEOUT';

/**
 * Transient = worth retrying: our own timeout, network errors, 429 and 5xx.
 * Any other HTTP status (4xx) or unknown error is not retried.
 */
const isTransientError = (error) => {
    if (!error) {
        return false;
    }
    if (error.code === TIMEOUT_ERROR_CODE) {
        return true;
    }
    if (Number.isInteger(error.statusCode)) {
        return error.statusCode === 429 || error.statusCode >= 500;
    }
    return typeof error.code === 'string' && TRANSIENT_NETWORK_CODES.has(error.code);
};

/**
 * Exponential backoff with jitter, in [delay / 2, delay], capped at maxDelayMs.
 * @param {number} attempt - 1-based number of the attempt that just failed.
 */
const backoffDelay = (attempt, baseDelayMs, maxDelayMs, random = Math.random) => {
    if (!baseDelayMs || baseDelayMs <= 0) {
        return 0;
    }
    const delay = Math.min(maxDelayMs, baseDelayMs * (2 ** (attempt - 1)));
    return Math.round((delay / 2) + (random() * (delay / 2)));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Race fn() against a timeout. The timer is always cleared once the race settles.
 */
const runWithTimeout = async (fn, timeoutMs, label) => {
    if (!timeoutMs) {
        return fn();
    }
    let timer;
    try {
        return await Promise.race([
            fn(),
            new Promise((_, reject) => {
                timer = setTimeout(() => {
                    const error = new Error(`${label} timeout after ${timeoutMs}ms`);
                    error.code = TIMEOUT_ERROR_CODE;
                    reject(error);
                }, timeoutMs);
            })
        ]);
    }
    finally {
        clearTimeout(timer);
    }
};

module.exports = {
    TIMEOUT_ERROR_CODE,
    isTransientError,
    backoffDelay,
    sleep,
    runWithTimeout
};
