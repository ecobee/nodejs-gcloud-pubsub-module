const ABORTED = 10
const CANCELLED = 1
const DEADLINE_EXCEEDED = 4
const INTERNAL = 13
const RESOURCE_EXHAUSTED = 8
const UNAVAILABLE = 14
const UNKNOWN = 2
const NOT_FOUND = 5
const PERMISSION_DENIED = 7

export const PUB_SUB_DEFAULT_RETRY_CODES = [
	ABORTED,
	CANCELLED,
	DEADLINE_EXCEEDED,
	INTERNAL,
	RESOURCE_EXHAUSTED,
	UNAVAILABLE,
	UNKNOWN,
	NOT_FOUND,
	PERMISSION_DENIED,
]

export const PUB_SUB_DEFAULT_BACKOFF_SETTINGS = {
	initialRetryDelayMillis: 100,
	retryDelayMultiplier: 1.3,
	maxRetryDelayMillis: 60000,
	initialRpcTimeoutMillis: 12000,
	rpcTimeoutMultiplier: 1.0,
	maxRpcTimeoutMillis: 30000,
	totalTimeoutMillis: 600000,
}

export const MESSAGE = 'message'
export const ERROR = 'error'
export const CLOSE = 'close'
