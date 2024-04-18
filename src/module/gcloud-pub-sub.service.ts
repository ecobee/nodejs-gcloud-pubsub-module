import { Injectable } from '@nestjs/common'
import { PubSub } from '@google-cloud/pubsub'
import type { PublishOptions } from '@google-cloud/pubsub/build/src/topic'

import type { GoogleAuthOptions } from '../interfaces/gcloud-pub-sub.interface'

@Injectable()
export class GcloudPubSubService {
	gcloudPubSubLib: PubSub

	constructor(
		private readonly googleAuthOptions: GoogleAuthOptions,
		private readonly publishOptions: PublishOptions
	) {
		this.gcloudPubSubLib = new PubSub(googleAuthOptions)
	}

	public publishMessage(
		topicName: string,
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

		const messageOptions = {
			data: dataBuffer,
			attributes: attributes,
		}

		const topic = this.gcloudPubSubLib.topic(topicName, this.publishOptions)

		return topic.publishMessage(messageOptions)
	}
}
