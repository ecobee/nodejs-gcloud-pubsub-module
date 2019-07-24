# NodeJS GCloud Pub/Sub module

A Google Cloud Pub/Sub library for the [NestJS](https://github.com/nestjs/nest) framework. Easily subscribe or publish to topics in Google Pub/Sub.

## Features

- Module for sending messages on topics
- Microservice to subscribe to topics in controllers

## Todo

- Add Module for subscribing to topics
- Add Microservice client for sending messages on topics

## Installation

**Yarn**

```bash
yarn add nodejs-gcloud-pubsub-module
```

**NPM**

```bash
npm install nodejs-gcloud-pubsub-module --save
```

## Usage

Please refer to the [interfaces](src/interfaces/gcloud-pub-sub.interface.ts) file to understand parameter and object requirements.

### Publish to a topic

Publishing topics follows the classic NestJS pattern of importing a module and injecting a service via dependency injection

#### Module Setup

Import this module into your module

```ts
import { Module } from '@nestjs/common';
import { GcloudPubSubModule } from 'nodejs-gcloud-pubsub-module'
import * as path from 'path';

@Module({
    imports: [
        GcloudPubSubModule.forRoot(moduleOptions: GcloudPubSubModuleOptions),
    ],
})
export class AppModule {}
```

If you need to populate the `moduleOptions` with dynamic configuration data use the `forRootAsync` method. The following example pulls configuration objects using the [nestjs-config](https://github.com/nestjsx/nestjs-config) module

```ts
import { Module } from '@nestjs/common'
import { GcloudPubSubModule } from 'nodejs-gcloud-pubsub-module'
import { ConfigService } from 'nestjs-config'
import * as path from 'path'

@Module({
	imports: [
		GcloudPubSubModule.forRootAsync({
			useFactory: (config: ConfigService) => {
				const authOptions = config.get('pubsub.authOptions')
				const publishOptions = config.get('pubsub.publishOptions')
				return {
					authOptions /* Authentication options */,
					publishOptions /* Message publishing options */,
				}
			},
			inject: [ConfigService],
		}),
	],
})
export class AppModule {}
```

#### Service

With the module imported you can now publish messages to topics

```ts
import { Injectable } from '@nestjs/common'
import { GcloudPubSubService } from 'nodejs-gcloud-pubsub-module'

const topic = 'projects/MyProjectId/topics/MyTopic'

@Injectable()
export class MyService {
	constructor(private readonly gcloudPubSubService: GcloudPubSubService) {}

	async publish(payload: PubSubMessage) {
		const serializedPayload = JSON.stringify(payload)
		return await this.publishMessage(topic, serializedPayload)
	}
}
```

### Subscribing to topics

To subscribe to pubsub message topics we leverage a custom NestJS Microservice. This has the benefit of allowing us to decorate our controllers as we would for starndard HTTP requests.

Using a Microservice alongside HTTP can be accomplished by creating a Hybrid NestJS application. Refer to [this example](https://github.com/nestjs/nest/blob/master/sample/03-microservices/src/main.ts) to see how this is accomplished.

#### Microservice setup

```ts
import { NestFactory } from '@nestjs/core'
import { GCloudPubSubServer } from 'nodejs-gcloud-pubsub-module'
import { ApplicationModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(ApplicationModule)

	const GCloudPubSubServerOptions = {
		authOptions: {/* Authentication options */}),
		subscriptionIds: ['subscription-name'],
	}

	app.connectMicroservice({
		strategy: new GCloudPubSubServer(GCloudPubSubServerOptions),
	})

	await app.startAllMicroservicesAsync()
	await app.listen(3001)
}
bootstrap()
```

#### Controller

```ts
import { Controller } from '@nestjs/common'
import { Message } from '@google-cloud/pubsub'
import { EventPattern } from '@nestjs/microservices'

@Controller('mycontroller')
export class EntitlementController {
	@EventPattern('subscription-name')
	async handleCreateEntitlement(message: Message) {
		const { data } = message
		const messageData = JSON.parse(data.toString())
		// do stuff with the message
		message.ack()
	}
}
```
