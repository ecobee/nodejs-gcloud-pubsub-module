import { PubSub, Subscription } from '@google-cloud/pubsub'
import { Server, CustomTransportStrategy } from '@nestjs/microservices'
import { GoogleAuthOptions } from '../interfaces/gcloud-pub-sub.interface'

const MESSAGE = 'message'

export class GCloudPubSubServer extends Server implements CustomTransportStrategy {
	private client: PubSub = null
	private subscriptions: Subscription[] = []

	constructor(
		private readonly googleAuthOptions: GoogleAuthOptions,
		private readonly subscriptionNames: string[]
	) {
		super()
	}

	public listen(callback: () => void) {
		this.client = new PubSub(this.googleAuthOptions)
		this.subscriptionNames.forEach(subcriptionName => {
			const subscription = this.client.subscription(subcriptionName)
			subscription.on(MESSAGE, this.handleMessage.bind(this))
			// @todo handle errors
			this.subscriptions.push(subscription)
		})
		callback()
	}

	public close() {
		this.subscriptions.forEach(subscription => {
			subscription.close()
		})
	}

	private async handleMessage(message) {
		const { data } = message
		const dataBuffer = Buffer.from(data)
		const messageObj = JSON.parse(dataBuffer.toString())

		const pattern = messageObj.event
		const handler = this.getHandlerByPattern(pattern)
		if (!handler) {
			message.ack()
			return
		}

		await handler(message)
	}

	private async init() {
		this.client = new PubSub(this.googleAuthOptions)
	}
}
