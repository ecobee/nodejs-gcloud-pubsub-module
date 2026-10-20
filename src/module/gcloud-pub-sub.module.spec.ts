import { Module } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PubSub, Topic } from '@google-cloud/pubsub'
import { GcloudPubSubModule } from './gcloud-pub-sub.module'
import { GcloudPubSubService } from './gcloud-pub-sub.service'
import { GcloudPubSubOptionsFactory } from '../interfaces/gcloud-pub-sub.interface'
import { mockGoogleAuthOptions } from '../helpers/testHelpers'
import { PUB_SUB_DEFAULT_BACKOFF_SETTINGS, PUB_SUB_DEFAULT_RETRY_CODES } from '../helpers/constants'

jest.mock('@google-cloud/pubsub')

const customPublishOptions = { batching: { maxMessages: 10 } }

class OptionsFactory implements GcloudPubSubOptionsFactory {
	createGcloudPubSubOptions() {
		return { authOptions: mockGoogleAuthOptions, publishOptions: customPublishOptions }
	}
}

@Module({
	providers: [OptionsFactory],
	exports: [OptionsFactory],
})
class OptionsModule {}

describe('GcloudPubSubModule', () => {
	let module: TestingModule

	beforeEach(() => {
		jest.clearAllMocks()
	})

	afterEach(async () => {
		await module?.close()
	})

	async function expectPublishOptions(expectedOptions: object) {
		const service = module.get(GcloudPubSubService)
		const topic = new Topic(service.gcloudPubSubLib, 'events')
		jest.mocked(service.gcloudPubSubLib.topic).mockReturnValue(topic)
		jest.mocked(topic.publishMessage).mockImplementation(() => Promise.resolve('message-id'))

		await expect(service.publishMessage('events', 'hello')).resolves.toBe('message-id')

		expect(PubSub).toHaveBeenCalledWith(mockGoogleAuthOptions)
		expect(service.gcloudPubSubLib.topic).toHaveBeenCalledWith('events', expectedOptions)
	}

	it('registers a service with custom publishing options', async () => {
		module = await Test.createTestingModule({
			imports: [
				GcloudPubSubModule.forRoot({
					authOptions: mockGoogleAuthOptions,
					publishOptions: customPublishOptions,
				}),
			],
		}).compile()

		await expectPublishOptions(customPublishOptions)
	})

	it('uses default retry settings when publishing options are omitted', async () => {
		module = await Test.createTestingModule({
			imports: [GcloudPubSubModule.forRoot({ authOptions: mockGoogleAuthOptions })],
		}).compile()

		await expectPublishOptions({
			gaxOpts: {
				retry: {
					retryCodes: PUB_SUB_DEFAULT_RETRY_CODES,
					backoffSettings: PUB_SUB_DEFAULT_BACKOFF_SETTINGS,
				},
			},
		})
	})

	it('supports an async options factory without injected dependencies', async () => {
		module = await Test.createTestingModule({
			imports: [
				GcloudPubSubModule.forRootAsync({
					useFactory: async () => ({
						authOptions: mockGoogleAuthOptions,
						publishOptions: customPublishOptions,
					}),
				}),
			],
		}).compile()

		await expectPublishOptions(customPublishOptions)
	})

	it('uses default retry settings for an async factory without publishing options', async () => {
		module = await Test.createTestingModule({
			imports: [
				GcloudPubSubModule.forRootAsync({
					useFactory: () => ({ authOptions: mockGoogleAuthOptions }),
				}),
			],
		}).compile()

		await expectPublishOptions({
			gaxOpts: {
				retry: {
					retryCodes: PUB_SUB_DEFAULT_RETRY_CODES,
					backoffSettings: PUB_SUB_DEFAULT_BACKOFF_SETTINGS,
				},
			},
		})
	})

	it('injects factory dependencies exported by imported modules', async () => {
		const useFactory = jest.fn((options: OptionsFactory) => options.createGcloudPubSubOptions())
		module = await Test.createTestingModule({
			imports: [
				GcloudPubSubModule.forRootAsync({
					imports: [OptionsModule],
					inject: [OptionsFactory],
					useFactory,
				}),
			],
		}).compile()

		expect(useFactory).toHaveBeenCalledWith(expect.any(OptionsFactory))
		await expectPublishOptions(customPublishOptions)
	})

	it('creates options using useClass', async () => {
		module = await Test.createTestingModule({
			imports: [GcloudPubSubModule.forRootAsync({ useClass: OptionsFactory })],
		}).compile()

		await expectPublishOptions(customPublishOptions)
	})

	it('reuses an options provider exported by an imported module', async () => {
		module = await Test.createTestingModule({
			imports: [
				GcloudPubSubModule.forRootAsync({
					imports: [OptionsModule],
					useExisting: OptionsFactory,
				}),
			],
		}).compile()

		await expectPublishOptions(customPublishOptions)
	})

	it('propagates errors from the async options factory', async () => {
		const error = new Error('Configuration failed')

		await expect(
			Test.createTestingModule({
				imports: [
					GcloudPubSubModule.forRootAsync({
						useFactory: async () => {
							throw error
						},
					}),
				],
			}).compile()
		).rejects.toBe(error)
	})
})
