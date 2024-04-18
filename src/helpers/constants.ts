const enum PubSubRetryCodes {
	CANCELLED = 1,
	UNKNOWN = 2,
	DEADLINE_EXCEEDED = 4,
	NOT_FOUND = 5,
	PERMISSION_DENIED = 7,
	RESOURCE_EXHAUSTED = 8,
	ABORTED = 10,
	INTERNAL = 13,
	UNAVALIBLE = 14,
}

export const PUB_SUB_DEFAULT_RETRY_CODES = [
	PubSubRetryCodes.CANCELLED,
	PubSubRetryCodes.UNKNOWN,
	PubSubRetryCodes.DEADLINE_EXCEEDED,
	PubSubRetryCodes.NOT_FOUND,
	PubSubRetryCodes.PERMISSION_DENIED,
	PubSubRetryCodes.RESOURCE_EXHAUSTED,
	PubSubRetryCodes.ABORTED,
	PubSubRetryCodes.INTERNAL,
	PubSubRetryCodes.UNAVALIBLE,
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

export const enum EVENT {
	MESSAGE = 'message',
	ERROR = 'error',
	CLOSE = 'close',
}
