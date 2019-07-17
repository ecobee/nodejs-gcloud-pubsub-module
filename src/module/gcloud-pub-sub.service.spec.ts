import { Test, TestingModule } from '@nestjs/testing'
import { Topic, PubSub } from '@google-cloud/pubsub'
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
		it('Publishes a new message', async () => {
			const topic = 'Homer'
			const data = 'You Tried Your Best and You Failed Miserably. The Lesson Is Never Try'
			const gcloudPubSubLibMock = {
				topic: jest.fn().mockReturnThis(),
				publish: jest.fn(buffer => {
					expect(buffer).toMatchSnapshot()
				}),
			}
			service.gcloudPubSubLib = gcloudPubSubLibMock as any
			service.publishMessage(topic, data)
			expect(gcloudPubSubLibMock.publish).toHaveBeenCalled()
		})
	})
})
