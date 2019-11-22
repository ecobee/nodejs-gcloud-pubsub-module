import { DynamicModule, Module, Provider } from '@nestjs/common'
import { PublishOptions } from '@google-cloud/pubsub/build/src/topic'
import { GcloudPubSubService } from './gcloud-pub-sub.service'
import { PUB_SUB_DEFAULT_BACKOFF_SETTINGS, PUB_SUB_DEFAULT_RETRY_CODES } from '../helpers/constants'
import {
	GcloudPubSubModuleAsyncOptions,
	GcloudPubSubModuleOptions,
	GcloudPubSubOptionsFactory,
} from '../interfaces/gcloud-pub-sub.interface'

const GCLOUDPUBSUB_MODULE_OPTIONS = 'GcloudPubSubModuleOptions'

const defaultPublishOptions: PublishOptions = {
	gaxOpts: {
		retry: {
			retryCodes: PUB_SUB_DEFAULT_RETRY_CODES,
			backoffSettings: {
				...PUB_SUB_DEFAULT_BACKOFF_SETTINGS,
			},
		},
	},
}

const createAsyncProviders = (options: GcloudPubSubModuleAsyncOptions): Provider[] => {
	if (options.useExisting || options.useFactory) {
		return [createAsyncOptionsProvider(options)]
	}
	return [
		createAsyncOptionsProvider(options),
		{
			provide: options.useClass,
			useClass: options.useClass,
		},
	]
}

const createAsyncOptionsProvider = (options: GcloudPubSubModuleAsyncOptions): Provider => {
	if (options.useFactory) {
		return {
			provide: GCLOUDPUBSUB_MODULE_OPTIONS,
			useFactory: options.useFactory,
			inject: options.inject || [],
		}
	}
	return {
		provide: GCLOUDPUBSUB_MODULE_OPTIONS,
		useFactory: async (optionsFactory: GcloudPubSubOptionsFactory) =>
			await optionsFactory.createGcloudPubSubOptions(),
		inject: [options.useExisting || options.useClass],
	}
}

@Module({})
export class GcloudPubSubModule {
	static forRoot(moduleOptions: GcloudPubSubModuleOptions): DynamicModule {
		const { authOptions, publishOptions } = moduleOptions
		const providers = [
			{
				provide: GcloudPubSubService,
				useFactory: async (): Promise<GcloudPubSubService> =>
					new GcloudPubSubService(authOptions, publishOptions || defaultPublishOptions),
			},
		]
		return {
			module: GcloudPubSubModule,
			providers,
			exports: providers,
		}
	}

	static forRootAsync(options: GcloudPubSubModuleAsyncOptions): DynamicModule {
		const asyncProviders = createAsyncProviders(options)
		const providers = [
			...asyncProviders,
			{
				provide: GcloudPubSubService,
				useFactory: async (
					gcloudPubSubModuleOptions: GcloudPubSubModuleOptions
				): Promise<GcloudPubSubService> => {
					const { authOptions, publishOptions } = gcloudPubSubModuleOptions
					return new GcloudPubSubService(authOptions, publishOptions || defaultPublishOptions)
				},
				inject: ['GcloudPubSubModuleOptions'],
			},
		]
		return {
			module: GcloudPubSubModule,
			providers,
			exports: providers,
		}
	}
}
