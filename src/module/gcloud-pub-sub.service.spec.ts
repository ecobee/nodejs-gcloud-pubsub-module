import { Test, TestingModule } from '@nestjs/testing'
import { Topic } from '@google-cloud/pubsub'
import { GcloudPubSubService } from './gcloud-pub-sub.service'
import { mockGoogleAuthOptions, mockPublishOptions } from '../helpers/testHelpers'

jest.mock('@google-cloud/pubsub')

describe('GcloudPubSubService', () => {
	let service: GcloudPubSubService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: GcloudPubSubService,
					useFactory: async (): Promise<GcloudPubSubService> =>
						new GcloudPubSubService(mockGoogleAuthOptions, mockPublishOptions),
				},
			],
		}).compile()

		service = module.get<GcloudPubSubService>(GcloudPubSubService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('gcloudPubSubLib', () => {
		it('initializes gcloudPubSubLib', () => {
			expect(service.gcloudPubSubLib).toBeDefined()
		})
	})

	describe('publishMessage', () => {
		let topic: Topic

		beforeEach(() => {
			topic = new Topic(service.gcloudPubSubLib, 'events')
			jest.mocked(service.gcloudPubSubLib.topic).mockReturnValue(topic)
			jest.mocked(topic.publishMessage).mockReset()
			jest.mocked(topic.publishMessage).mockImplementation(() => Promise.resolve('message-id'))
		})

		it('publishes a string using UTF-8 by default', async () => {
			const attributes = { source: 'test' }

			await expect(service.publishMessage('events', 'caf\u00e9', attributes)).resolves.toBe(
				'message-id'
			)

			expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', mockPublishOptions)
			expect(topic.publishMessage).toHaveBeenCalledTimes(1)
			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([99, 97, 102, 195, 169]),
				attributes,
			})
			expect(Buffer.isBuffer(jest.mocked(topic.publishMessage).mock.calls[0][0].data)).toBe(true)
		})

		it('publishes a Buffer as the expected bytes', async () => {
			const data = Buffer.from([0, 1, 127, 255])
			const attributes = { source: 'test' }

			await expect(service.publishMessage('events', data, attributes)).resolves.toBe('message-id')

			expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', mockPublishOptions)
			expect(topic.publishMessage).toHaveBeenCalledTimes(1)
			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([0, 1, 127, 255]),
				attributes,
			})
			expect(Buffer.isBuffer(jest.mocked(topic.publishMessage).mock.calls[0][0].data)).toBe(true)
		})

		it('publishes an array of numbers as the expected bytes', async () => {
			const data = [0, 1, 127, 255]
			const attributes = { source: 'test' }

			await expect(service.publishMessage('events', data, attributes)).resolves.toBe('message-id')

			expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', mockPublishOptions)
			expect(topic.publishMessage).toHaveBeenCalledTimes(1)
			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([0, 1, 127, 255]),
				attributes,
			})
			expect(Buffer.isBuffer(jest.mocked(topic.publishMessage).mock.calls[0][0].data)).toBe(true)
		})

		it('publishes an ArrayBuffer as the expected bytes', async () => {
			const data = new Uint8Array([0, 1, 127, 255]).buffer
			const attributes = { source: 'test' }

			await expect(service.publishMessage('events', data, attributes)).resolves.toBe('message-id')

			expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', mockPublishOptions)
			expect(topic.publishMessage).toHaveBeenCalledTimes(1)
			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([0, 1, 127, 255]),
				attributes,
			})
			expect(Buffer.isBuffer(jest.mocked(topic.publishMessage).mock.calls[0][0].data)).toBe(true)
		})

		it('publishes a SharedArrayBuffer as the expected bytes', async () => {
			const data = new SharedArrayBuffer(4)
			new Uint8Array(data).set([0, 1, 127, 255])
			const attributes = { source: 'test' }

			await expect(service.publishMessage('events', data, attributes)).resolves.toBe('message-id')

			expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', mockPublishOptions)
			expect(topic.publishMessage).toHaveBeenCalledTimes(1)
			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([0, 1, 127, 255]),
				attributes,
			})
			expect(Buffer.isBuffer(jest.mocked(topic.publishMessage).mock.calls[0][0].data)).toBe(true)
		})

		it('publishes a Uint8Array as the expected bytes', async () => {
			const data = new Uint8Array([0, 1, 127, 255])
			const attributes = { source: 'test' }

			await expect(service.publishMessage('events', data, attributes)).resolves.toBe('message-id')

			expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', mockPublishOptions)
			expect(topic.publishMessage).toHaveBeenCalledTimes(1)
			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([0, 1, 127, 255]),
				attributes,
			})
			expect(Buffer.isBuffer(jest.mocked(topic.publishMessage).mock.calls[0][0].data)).toBe(true)
		})

		it('publishes a Uint8Array view without surrounding bytes', async () => {
			const data = new Uint8Array([42, 0, 1, 127, 255, 42]).subarray(1, 5)
			const attributes = { source: 'test' }

			await expect(service.publishMessage('events', data, attributes)).resolves.toBe('message-id')

			expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', mockPublishOptions)
			expect(topic.publishMessage).toHaveBeenCalledTimes(1)
			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([0, 1, 127, 255]),
				attributes,
			})
			expect(Buffer.isBuffer(jest.mocked(topic.publishMessage).mock.calls[0][0].data)).toBe(true)
		})

		it('publishes a string using binary encoding', async () => {
			const attributes = { source: 'test' }

			await expect(
				service.publishMessage('events', 'caf\u00e9', attributes, 'binary')
			).resolves.toBe('message-id')

			expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', mockPublishOptions)
			expect(topic.publishMessage).toHaveBeenCalledTimes(1)
			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([99, 97, 102, 233]),
				attributes,
			})
			expect(Buffer.isBuffer(jest.mocked(topic.publishMessage).mock.calls[0][0].data)).toBe(true)
		})

		it('defaults attributes to an empty object', async () => {
			await service.publishMessage('events', 'hello')

			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from('hello'),
				attributes: {},
			})
		})

		it('decodes a hex-encoded string before publishing', async () => {
			await service.publishMessage('events', '00017fff', {}, 'hex')

			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.from([0, 1, 127, 255]),
				attributes: {},
			})
		})

		it('preserves an empty payload and its attributes', async () => {
			const attributes = { source: 'test' }

			await service.publishMessage('events', '', attributes)

			expect(topic.publishMessage).toHaveBeenCalledWith({
				data: Buffer.alloc(0),
				attributes,
			})
		})

		it('propagates publishing errors', async () => {
			const error = new Error('Publishing failed')
			jest.mocked(topic.publishMessage).mockImplementation(() => Promise.reject(error))

			await expect(service.publishMessage('events', 'hello')).rejects.toBe(error)
		})
	})
})
