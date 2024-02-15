import { PubSub, Subscription, Message } from '@google-cloud/pubsub'
import { Server, CustomTransportStrategy } from '@nestjs/microservices'

import { MESSAGE, ERROR, PUB_SUB_DEFAULT_RETRY_CODES } from '../helpers/constants'
import { GCloudPubSubServerOptions } from '../interfaces/gcloud-pub-sub.interface'
/* istanbul ignore next */

const RETRY_INTERVAL = 5000

export class GCloudPubSubServer /* istanbul ignore next */
	extends Server
	implements CustomTransportStrategy
{
	public client: PubSub = null
	public subscriptions: Subscription[] = []
	public isShuttingDown: boolean = false

	constructor(public readonly options: GCloudPubSubServerOptions) {
		super()
	}

	public listen(callback: () => void) {
		this.isShuttingDown = false
		this.client = new PubSub(this.options.authOptions)
		this.options.subscriptionIds.forEach((subcriptionName) => {
			const subscription = this.client.subscription(
				subcriptionName,
				this.options.subscriberOptions || {}
			)
			const handleMessage = this.handleMessageFactory(subcriptionName)
			const handleError = this.handleErrorFactory(subscription, subcriptionName)
			subscription.on(MESSAGE, handleMessage.bind(this))
			subscription.on(ERROR, handleError)
			this.subscriptions.push(subscription)
		})
		callback()
	}

	public handleErrorFactory(subscription: Subscription, subcriptionName: string) {
		return (error): void => {
			this.handleError(error)
			if (!this.isShuttingDown && PUB_SUB_DEFAULT_RETRY_CODES.includes(error.code)) {
				this.logger.warn(`Closing subscription: ${subcriptionName}`)
				subscription.close()
				setTimeout(() => {
					this.logger.warn(`Opening subscription: ${subcriptionName}`)
					subscription.open()
				}, RETRY_INTERVAL)
			}
		}
	}

	public close() {
		this.isShuttingDown = true
		this.subscriptions.forEach((subscription) => {
			subscription.close()
		})
	}

	public handleMessageFactory(subscriptionName: string) {
		return async (message: Message) => {
			const handler = this.getHandlerByPattern(subscriptionName)
			if (!handler) {
				this.logger.warn(`ack message with no active handler: ${message.id}`)
				message.ack()
				return
			}
			await handler(message)
		}
	}
}
