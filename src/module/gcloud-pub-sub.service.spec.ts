import { Test, TestingModule } from '@nestjs/testing'
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
		describe('Publishing a new message', () => {
			it('handles string as data', () => {
				const topic = 'Homer'
				const data = 'You Tried Your Best and You Failed Miserably. The Lesson Is Never Try'
				const gcloudPubSubLibMock = {
					topic: jest.fn().mockReturnThis(),
					publish: jest.fn((buffer) => {
						expect(buffer).toMatchSnapshot()
					}),
				}

				service.gcloudPubSubLib = gcloudPubSubLibMock as any
				service.publishMessage(topic, data)
				expect(gcloudPubSubLibMock.publish).toHaveBeenCalled()
			})
			it('handles Buffer as data', () => {
				const topic = 'Homer'
				const data = 'You Tried Your Best and You Failed Miserably. The Lesson Is Never Try'
				const gcloudPubSubLibMock = {
					topic: jest.fn().mockReturnThis(),
					publish: jest.fn((buffer) => {
						expect(buffer).toMatchSnapshot()
					}),
				}

				service.gcloudPubSubLib = gcloudPubSubLibMock as any
				service.publishMessage(topic, Buffer.from(data))
				expect(gcloudPubSubLibMock.publish).toHaveBeenCalled()
			})
			it('handles an array of numbers as data', () => {
				const topic = 'Homer'
				const data = [10, 20, 30, 40, 50]
				const gcloudPubSubLibMock = {
					topic: jest.fn().mockReturnThis(),
					publish: jest.fn((buffer) => {
						expect(buffer).toMatchSnapshot()
					}),
				}

				service.gcloudPubSubLib = gcloudPubSubLibMock as any
				service.publishMessage(topic, data)
				expect(gcloudPubSubLibMock.publish).toHaveBeenCalled()
			})
			it('handles an ArrayBuffer as data', () => {
				const topic = 'Homer'
				const data = new ArrayBuffer(1)
				const gcloudPubSubLibMock = {
					topic: jest.fn().mockReturnThis(),
					publish: jest.fn((buffer) => {
						expect(buffer).toMatchSnapshot()
					}),
				}

				service.gcloudPubSubLib = gcloudPubSubLibMock as any
				service.publishMessage(topic, data)
				expect(gcloudPubSubLibMock.publish).toHaveBeenCalled()
			})
			it('handles a SharedArrayBuffer as data', () => {
				const topic = 'Homer'
				const data = new SharedArrayBuffer(1)
				const gcloudPubSubLibMock = {
					topic: jest.fn().mockReturnThis(),
					publish: jest.fn((buffer) => {
						expect(buffer).toMatchSnapshot()
					}),
				}

				service.gcloudPubSubLib = gcloudPubSubLibMock as any
				service.publishMessage(topic, data)
				expect(gcloudPubSubLibMock.publish).toHaveBeenCalled()
			})
			it('handles a Uint8Array as data', () => {
				const topic = 'Homer'
				const data = new Uint8Array([1, 2, 3])
				const gcloudPubSubLibMock = {
					topic: jest.fn().mockReturnThis(),
					publish: jest.fn((buffer) => {
						expect(buffer).toMatchSnapshot()
					}),
				}

				service.gcloudPubSubLib = gcloudPubSubLibMock as any
				service.publishMessage(topic, data)
				expect(gcloudPubSubLibMock.publish).toHaveBeenCalled()
			})
			it('handles a string and binary encoding', () => {
				const topic = 'Homer'
				const data = 'You Tried Your Best and You Failed Miserably. The Lesson Is Never Try'
				const encoding = 'binary'
				const gcloudPubSubLibMock = {
					topic: jest.fn().mockReturnThis(),
					publish: jest.fn((buffer) => {
						expect(buffer).toMatchSnapshot()
					}),
				}

				service.gcloudPubSubLib = gcloudPubSubLibMock as any
				service.publishMessage(topic, data, {}, encoding)
				expect(gcloudPubSubLibMock.publish).toHaveBeenCalled()
			})
		})
	})
})
