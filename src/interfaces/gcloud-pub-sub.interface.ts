import { Type } from '@nestjs/common'
import { ModuleMetadata } from '@nestjs/common/interfaces'
import { PublishOptions } from '@google-cloud/pubsub/build/src/topic'
import { SubscriberOptions } from '@google-cloud/pubsub/build/src/subscriber'

export interface GCloudPubSubServerOptions {
	authOptions: GoogleAuthOptions
	subscriptionIds: string[]
	subscriberOptions?: SubscriberOptions
}

export type GcloudPubSubModuleOptions = {
	authOptions: GoogleAuthOptions
	publishOptions: PublishOptions
}

export interface Message {
	topic: string
	message: string
	attributes: { [key: string]: string }
}

interface CredentialBody {
	client_email?: string
	private_key?: string
}

export interface GoogleAuthOptions {
	/** Path to a .json, .pem, or .p12 key file */
	keyFilename?: string
	/** Path to a .json, .pem, or .p12 key file */
	keyFile?: string
	credentials?: CredentialBody
	/** Required scopes for the desired API request */
	scopes?: string | string[]
	projectId?: string
	uri?: string
}

export interface SubscriberOptions {
	ackDeadline?: number
	flowControl?: FlowControlOptions
	batching?: BatchOptions
	streamingOptions?: MessageStreamOptions
}

export interface MessageStreamOptions {
	highWaterMark?: number
	maxStreams?: number
	timeout?: number
}

export interface BatchOptions {
	maxMessages?: number
	maxMilliseconds?: number
}

export interface FlowControlOptions {
	allowExcessMessages?: boolean
	maxBytes?: number
	maxExtension?: number
	maxMessages?: number
}

export interface GcloudPubSubOptionsFactory {
	createGcloudPubSubOptions(): Promise<GcloudPubSubModuleOptions> | GcloudPubSubModuleOptions
}

export interface GcloudPubSubModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useExisting?: Type<GcloudPubSubOptionsFactory>
	useClass?: Type<GcloudPubSubOptionsFactory>
	useFactory?: (...args: any[]) => Promise<GcloudPubSubModuleOptions> | GcloudPubSubModuleOptions
	inject?: any[]
}
