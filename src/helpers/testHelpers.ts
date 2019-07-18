import { PublishOptions } from '@google-cloud/pubsub/build/src/topic'
import { GoogleAuthOptions } from '../interfaces/gcloud-pub-sub.interface'
import { PUB_SUB_DEFAULT_RETRY_CODES, PUB_SUB_DEFAULT_BACKOFF_SETTINGS } from './constants'

export const mockGoogleAuthOptions: GoogleAuthOptions = {
	projectId: 'entitlement',
}

export const mockPublishOptions: PublishOptions = {
	gaxOpts: {
		retry: {
			retryCodes: PUB_SUB_DEFAULT_RETRY_CODES,
			backoffSettings: PUB_SUB_DEFAULT_BACKOFF_SETTINGS,
		},
	},
}
