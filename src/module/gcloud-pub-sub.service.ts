import { Injectable, Logger } from '@nestjs/common'
import { PubSub } from '@google-cloud/pubsub'
import { GoogleAuthOptions } from '../interfaces/gcloud-pub-sub.interface'
import { PublishOptions } from '@google-cloud/pubsub/build/src/topic'

@Injectable()
export class GcloudPubSubService {
	gcloudPubSubLib: PubSub

	/* istanbul ignore next */
	constructor(
		private readonly googleAuthOptions: GoogleAuthOptions,
		private readonly publishOptions: PublishOptions,
		private readonly logger = new Logger(GcloudPubSubService.name)
	) {
		this.gcloudPubSubLib = new PubSub(googleAuthOptions)
	}

	public publishMessage(
		topic: string,
		data: string | Uint8Array | number[] | ArrayBuffer | SharedArrayBuffer,
		attributes: { [key: string]: string } = {},
		encoding?: BufferEncoding
	): Promise<string> {
		let dataBuffer: Buffer = undefined
		if (typeof data === 'string' && encoding) {
			dataBuffer = Buffer.from(data as string, encoding)
		} else if (Array.isArray(data)) {
			dataBuffer = Buffer.from(data as number[])
		} else if (data instanceof ArrayBuffer) {
			dataBuffer = Buffer.from(data as ArrayBuffer)
		} else if (data instanceof SharedArrayBuffer) {
			dataBuffer = Buffer.from(data as SharedArrayBuffer)
		} else if (data instanceof Uint8Array) {
			dataBuffer = Buffer.from(data as Uint8Array)
		} else {
			dataBuffer = Buffer.from(data as string)
		}
		this.logger.debug(`PubSub message sent to topic: ${topic}`)
		this.logger.debug(dataBuffer)
		return this.gcloudPubSubLib.topic(topic, this.publishOptions).publish(dataBuffer, attributes)
	}
}
