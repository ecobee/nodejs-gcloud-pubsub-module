import { PubSub, Subscription } from '@google-cloud/pubsub'
import { Server, CustomTransportStrategy } from '@nestjs/microservices'
import { GoogleAuthOptions } from '../interfaces/gcloud-pub-sub.interface'
import { MESSAGE } from '../helpers/constants'

export class GCloudPubSubServer extends Server implements CustomTransportStrategy {
	public client: PubSub = null
	public subscriptions: Subscription[] = []

	constructor(
		private readonly googleAuthOptions: GoogleAuthOptions,
		private readonly subscriptionIds: string[],
		private readonly patternKey: string
	) {
		super()
	}

	public listen(callback: () => void) {
		this.client = new PubSub(this.googleAuthOptions)
		this.subscriptionIds.forEach(subcriptionName => {
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

	public async handleMessage(message) {
		const { data } = message
		const dataBuffer = Buffer.from(data)
		const messageObj = JSON.parse(dataBuffer.toString())

		const pattern = messageObj[this.patternKey]
		const handler = this.getHandlerByPattern(pattern)
		if (!handler) {
			message.ack()
			return
		}
		await handler(message)
	}
}
