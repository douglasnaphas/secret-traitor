import { PubSubEngine } from 'graphql-subscriptions'
import {
    Arg,
    Mutation,
    PubSub,
    Query,
    Resolver,
    Root,
    Subscription,
} from 'type-graphql'

import { Notification } from './typeDefs'
import { NotificationPayload } from './model'

@Resolver()
export class NotificationResolver {
    private autoIncrement = 0

    @Query((returns) => Date)
    currentDate() {
        return new Date()
    }

    // @Mutation((returns) => Boolean)
    // async pushNotification(
    //     @PubSub() pubSub: PubSubEngine,
    //     @Arg('message', { nullable: true }) message?: string
    // ): Promise<boolean> {
    //     const payload: NotificationPayload = {
    //         id: ++this.autoIncrement,
    //         message,
    //     }
    //     await pubSub.publish('NOTIFICATIONS', payload)
    //     return true
    // }

    // @Mutation((returns) => Boolean)
    // async publisherMutation(
    //     @PubSub('NOTIFICATIONS') publish: Publisher<NotificationPayload>,
    //     @Arg('message', { nullable: true }) message?: string
    // ): Promise<boolean> {
    //     await publish({ id: ++this.autoIncrement, message })
    //     return true
    // }

    // @Subscription({ topics: 'NOTIFICATIONS' })
    // notifications(@Root() { id, message }: NotificationPayload): Notification {
    //     return { id, message, date: new Date() }
    // }

    // @Subscription((returns) => Notification, {
    //     topics: 'NOTIFICATIONS',
    //     filter: ({ payload }: ResolverFilterData<NotificationPayload>) =>
    //         payload.id % 2 === 0,
    // })
    // subscriptionWithFilter(@Root() { id, message }: NotificationPayload) {
    //     const newNotification: Notification = { id, message, date: new Date() }
    //     return newNotification
    // }

    // dynamic topic

    // @Mutation((returns) => Boolean)
    // async pubSubMutationToDynamicTopic(
    //     @PubSub() pubSub: PubSubEngine,
    //     @Arg('topic') topic: string,
    //     @Arg('message', { nullable: true }) message?: string
    // ): Promise<boolean> {
    //     const payload: NotificationPayload = {
    //         id: ++this.autoIncrement,
    //         message,
    //     }
    //     await pubSub.publish(topic, payload)
    //     return true
    // }
    //
    // @Subscription({
    //     topics: ({ args }) => args.topic,
    // })
    // subscriptionWithFilterToDynamicTopic(
    //     @Arg('topic') topic: string,
    //     @Root() { id, message }: NotificationPayload
    // ): Notification {
    //     return { id, message, date: new Date() }
    // }
}