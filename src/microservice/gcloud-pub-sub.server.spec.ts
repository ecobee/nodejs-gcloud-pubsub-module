import * as GCloudPubSub from '@google-cloud/pubsub'
import { GCloudPubSubServer } from './gcloud-pub-sub.server'
import { mockGoogleAuthOptions, mockSubscriberOptions } from '../helpers/testHelpers'
import { MESSAGE } from '../helpers/constants'

const INVALID_ARGUMENT = 3
const NOT_FOUND_ERROR = 5
const TIMEOUT = 20000

const mockEventHandler = jest.fn((type, handler) => {
	expect(type).toBeDefined()
	expect(handler).toBeDefined()
})
const mockCloseHandler = jest.fn()
const mockSubscription = jest.fn(name => {
	return {
		on: mockEventHandler,
		close: mockCloseHandler,
	}
})

jest.mock('@google-cloud/pubsub', () => ({
	__esModule: true,
	PubSub: jest.fn().mockImplementation(() => {
		return {
			subscription: mockSubscription,
		}
	}),
}))

describe('GCloudPubSubServer', () => {
	let server: GCloudPubSubServer
	const subscriptionIds = ['create', 'update', 'delete']

	beforeEach(() => {
		server = new GCloudPubSubServer({
			authOptions: mockGoogleAuthOptions,
			subscriptionIds,
			subscriberOptions: mockSubscriberOptions,
		})
	})

	it('Instantiates', () => {
		expect(server.client).toBe(null)
		expect(server.subscriptions.length).toBe(0)
		expect(server.options).toMatchInlineSnapshot(`
				Object {
				  "authOptions": Object {
				    "projectId": "entitlement",
				  },
				  "subscriberOptions": Object {
				    "flowControl": Object {
				      "allowExcessMessages": false,
				      "maxMessages": 5,
				    },
				  },
				  "subscriptionIds": Array [
				    "create",
				    "update",
				    "delete",
				  ],
				}
		`)
	})

	it('Instantiates without subscriberOptions', () => {
		const server2 = new GCloudPubSubServer({
			authOptions: mockGoogleAuthOptions,
			subscriptionIds,
		})
		expect(server2.client).toBe(null)
		expect(server2.subscriptions.length).toBe(0)
		expect(server2.options).toMatchInlineSnapshot(`
		Object {
		  "authOptions": Object {
		    "projectId": "entitlement",
		  },
		  "subscriptionIds": Array [
		    "create",
		    "update",
		    "delete",
		  ],
		}
	`)
	})

	describe('listen', () => {
		it('Initializes the PubSub client and subscription objects', () => {
			const mockCallback = jest.fn()
			server.listen(mockCallback)
			expect(server.isShuttingDown).toStrictEqual(false)
			expect(server.client).not.toBe(null)
			expect(server.subscriptions.length).not.toBe(0)
			expect(mockCallback).toHaveBeenCalled()
			expect(mockEventHandler).toHaveBeenCalledTimes(6)
		})

		it('Initializes the PubSub client and subscription objects without subscriber options', () => {
			const server2 = new GCloudPubSubServer({
				authOptions: mockGoogleAuthOptions,
				subscriptionIds,
			})
			const mockCallback = jest.fn()
			server2.listen(mockCallback)
			expect(mockCallback).toHaveBeenCalled()
		})

		it('Resets isShuttingDown state', () => {
			const mockCallback = jest.fn()
			server.isShuttingDown = true
			server.listen(mockCallback)
			expect(server.isShuttingDown).toStrictEqual(false)
		})
	})

	describe('close', () => {
		it('Closes all subscriptions, and sets closing flag to appropriate state', () => {
			server.listen(() => {})
			expect(server.isShuttingDown).toStrictEqual(false)
			server.close()
			expect(server.isShuttingDown).toStrictEqual(true)
			expect(mockCloseHandler).toHaveBeenCalledTimes(3)
		})
	})

	describe('handleMessageFactory', () => {
		const data = {
			id: '12345',
		}
		const message = {
			id: 'test-message-id',
			data: Buffer.from(JSON.stringify(data)),
			ack: jest.fn(),
		}

		afterEach(() => {
			message.ack.mockReset()
		})

		it('Acks the message and returns when no handler can be found', async () => {
			server.listen(() => {})
			const subscriptionName = 'my-subscription'
			server.getHandlerByPattern = jest.fn(pattern => {
				expect(pattern).toBe(subscriptionName)
				return null
			})
			const handleMessage = await server.handleMessageFactory(subscriptionName)
			// @ts-ignore
			handleMessage(message)
			expect(server.getHandlerByPattern).toHaveBeenCalled()
			expect(message.ack).toHaveBeenCalled()
		})

		it('Calls the handler when a handler is found', async () => {
			const mockHandler = jest.fn()
			const subscriptionName = 'my-subscription'
			server.listen(() => {})
			// @ts-ignore
			server.getHandlerByPattern = jest.fn(pattern => {
				expect(pattern).toBe(subscriptionName)
				return mockHandler
			})
			const handleMessage = await server.handleMessageFactory(subscriptionName)
			// @ts-ignore
			handleMessage(message)
			expect(server.getHandlerByPattern).toHaveBeenCalledTimes(1)
			expect(message.ack).not.toHaveBeenCalled()
			expect(mockHandler).toHaveBeenCalled()
		})
	})

	describe('handleErrorFactory', () => {
		const subscriptionName = 'my-test-subscription'

		it('calls instance handleError method and does not retry close/open subscription', () => {
			const subscription = {
				close: jest.fn(),
				open: jest.fn(),
			}
			const error = {
				code: INVALID_ARGUMENT,
			}
			// @ts-ignore
			server.handleError = jest.fn()
			// @ts-ignore
			const handleError = server.handleErrorFactory(subscription, subscriptionName)
			// @ts-ignore
			handleError(error)
			expect(subscription.close).not.toHaveBeenCalled()
			expect(subscription.open).not.toHaveBeenCalled()
			// @ts-ignore
			expect(server.handleError).toHaveBeenCalledWith(error)
		})

		it('retries calling open on the subscription when error is in PUB_SUB_DEFAULT_RETRY_CODES', done => {
			jest.setTimeout(TIMEOUT)
			const subscription = {
				close: jest.fn(),
				open: jest.fn(() => {
					done()
				}),
			}
			const error = {
				code: NOT_FOUND_ERROR,
			}
			// @ts-ignore
			server.handleError = jest.fn()
			// @ts-ignore
			const handleError = server.handleErrorFactory(subscription, subscriptionName)
			// @ts-ignore
			handleError(error)
			expect(subscription.close).toHaveBeenCalled()
			// @ts-ignore
			expect(server.handleError).toHaveBeenCalledWith(error)
		})

		it('does not attempt to handle subscription error retry when server is closing', () => {
			jest.setTimeout(TIMEOUT)
			const subscription = {
				close: jest.fn(),
				open: jest.fn(),
			}
			const error = {
				code: NOT_FOUND_ERROR,
			}
			// @ts-ignore
			server.handleError = jest.fn()
			// @ts-ignore
			const handleError = server.handleErrorFactory(subscription, subscriptionName)

			server.isShuttingDown = true

			// @ts-ignore
			handleError(error)

			expect(subscription.close).toHaveBeenCalledTimes(0)
			expect(subscription.open).toHaveBeenCalledTimes(0)

			// @ts-ignore
			expect(server.handleError).toHaveBeenCalledTimes(1)
		})
	})
})
