import * as GCloudPubSub from '@google-cloud/pubsub'
import { GCloudPubSubServer } from './gcloud-pub-sub.server'
import { mockGoogleAuthOptions } from '../helpers/testHelpers'
import { MESSAGE } from '../helpers/constants'
import { ServerRMQ } from '@nestjs/microservices'

const mockEventHandler = jest.fn((type, handler) => {
	expect(type).toBe(MESSAGE)
	expect(handler).toBeDefined()
})
const mockCloseHandler = jest.fn()
const mockSubscription = jest.fn(name => {
	return {
		on: mockEventHandler,
		close: mockCloseHandler,
	}
})
// @ts-ignore
GCloudPubSub.PubSub = jest.fn().mockImplementation(() => {
	return {
		subscription: mockSubscription,
	}
})

describe('GCloudPubSubServer', () => {
	let server: GCloudPubSubServer
	const subscriptionIds = ['create', 'update', 'delete']
	const patternKey = 'id'

	beforeEach(() => {
		server = new GCloudPubSubServer(mockGoogleAuthOptions, subscriptionIds, patternKey)
	})

	it('Instantiates', () => {
		expect(server.client).toBe(null)
		expect(server.subscriptions.length).toBe(0)
	})

	describe('listen', () => {
		it('Initializes the PubSub client and subscription objects', () => {
			const mockCallback = jest.fn()
			server.listen(mockCallback)
			expect(server.client).not.toBe(null)
			expect(server.subscriptions.length).not.toBe(0)
			expect(mockCallback).toHaveBeenCalled()
			expect(mockEventHandler).toHaveBeenCalledTimes(3)
		})
	})

	describe('close', () => {
		it('Closes all subscriptions', () => {
			server.listen(() => {})
			server.close()
			expect(mockCloseHandler).toHaveBeenCalledTimes(3)
		})
	})

	describe('handleMessage', () => {
		const patternValue = '12345'
		const data = {
			id: patternValue,
		}
		const message = {
			data: Buffer.from(JSON.stringify(data)),
			ack: jest.fn(),
		}

		afterEach(() => {
			message.ack.mockReset()
		})

		it('Acks the message and returns when no handler can be found', async () => {
			server.listen(() => {})
			server.getHandlerByPattern = jest.fn(pattern => {
				expect(pattern).toBe(patternValue)
				return null
			})
			await server.handleMessage(message)
			expect(server.getHandlerByPattern).toHaveBeenCalled()
			expect(message.ack).toHaveBeenCalled()
		})

		it('Calls the handler when a handler is found', async () => {
			const mockHandler = jest.fn()
			server.listen(() => {})
			// @ts-ignore
			server.getHandlerByPattern = jest.fn(pattern => {
				expect(pattern).toBe(patternValue)
				return mockHandler
			})
			await server.handleMessage(message)
			expect(server.getHandlerByPattern).toHaveBeenCalledTimes(1)
			expect(message.ack).not.toHaveBeenCalled()
			expect(mockHandler).toHaveBeenCalled()
		})
	})
})
