import { Injectable } from '@nestjs/common'
import { PubSub } from '@google-cloud/pubsub'
import { GoogleAuthOptions } from './interfaces/gcloud-pub-sub.interface'
import { PublishOptions } from '@google-cloud/pubsub/build/src/topic'

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
		topic: string,
		data: string,
		attributes: { [key: string]: string } = {}
	): Promise<string> {
		const dataBuffer = Buffer.from(data)
		return this.gcloudPubSubLib.topic(topic, this.publishOptions).publish(dataBuffer, attributes)
	}
}
