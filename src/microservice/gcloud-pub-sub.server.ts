import { PubSub, Subscription, Message } from '@google-cloud/pubsub'
import { Server, CustomTransportStrategy } from '@nestjs/microservices'
import { GCloudPubSubServerOptions } from '../interfaces/gcloud-pub-sub.interface'
import { MESSAGE, ERROR, CLOSE } from '../helpers/constants'

const NOT_FOUND_ERROR = 5
const RETRY_INTERVAL = 5000

export class GCloudPubSubServer extends Server implements CustomTransportStrategy {
	public client: PubSub = null
	public subscriptions: Subscription[] = []
	public isClosing: boolean = false

	constructor(private readonly options: GCloudPubSubServerOptions) {
		super()
	}

	public listen(callback: () => void) {
		this.isClosing = false
		this.client = new PubSub(this.options.authOptions)
		this.options.subscriptionIds.forEach(subcriptionName => {
			const subscription = this.client.subscription(subcriptionName)
			const handleMessage = this.handleMessageFactory(subcriptionName)
			const handleError = this.handleErrorFactory(subscription)
			subscription.on(MESSAGE, handleMessage.bind(this))
			subscription.on(ERROR, handleError.bind(this))
			subscription.on(CLOSE, this.close.bind(this))
			this.subscriptions.push(subscription)
		})
		callback()
	}

	public handleErrorFactory(subscription: Subscription) {
		return error => {
			if (this.isClosing === false) {
				subscription.close()
				if (error.code === NOT_FOUND_ERROR) {
					setTimeout(() => {
						subscription.open()
					}, RETRY_INTERVAL)
				}
				this.handleError(error)
			}
		}
	}

	public close() {
		this.isClosing = true
		this.subscriptions.forEach(subscription => {
			subscription.close()
		})
	}

	public handleMessageFactory(subscriptionName: string) {
		return async (message: Message) => {
			const handler = this.getHandlerByPattern(subscriptionName)
			if (!handler) {
				message.ack()
				return
			}
			await handler(message)
		}
	}
}
