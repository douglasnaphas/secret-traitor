import {
    Arg,
    Ctx,
    ID,
    Mutation,
    ObjectType,
    PubSub,
    Resolver,
} from 'type-graphql'
import { PubSubEngine } from 'graphql-subscriptions'

import { GameId, GameType } from 'src/entities/Game'
import { PlayerId } from 'src/entities/Player'
import { Event } from 'src/graphql/Event'
import { GameEvent } from 'src/graphql/GameEvent'
import { ApiResponse } from 'src/shared/api'
import { getTopicName, Topics } from 'src/shared/topics'
import Context from 'src/shared/Context'

@ObjectType({ implements: [Event, GameEvent] })
class AlliesAndEnemiesFirstHandDiscardEvent extends GameEvent {
    constructor(gameId: GameId, viewingPlayerId: PlayerId) {
        const state = {
            gameId,
            viewingPlayerId,
            gameType: GameType.AlliesNEnemies,
        }
        super(
            state,
            viewingPlayerId,
            AlliesAndEnemiesFirstHandDiscardEvent.name
        )
    }
}

@Resolver(() => AlliesAndEnemiesFirstHandDiscardEvent)
class AlliesAndEnemiesFirstHandDiscardEventResolver {
    @Mutation(() => AlliesAndEnemiesFirstHandDiscardEvent)
    async alliesAndEnemiesFirstHandDiscard(
        @Arg('gameId', () => ID) gameId: GameId,
        @Arg('playerId', () => ID) viewingPlayerId: PlayerId,
        @Arg('index', () => Number) index: 0 | 1 | 2,
        @Ctx() { dataSources: { alliesAndEnemies } }: Context,
        @PubSub() pubSub: PubSubEngine
    ): Promise<ApiResponse<AlliesAndEnemiesFirstHandDiscardEvent>> {
        const state = await alliesAndEnemies.load(gameId, viewingPlayerId)
        const result = state.firstHand(index)
        if ('error' in result) {
            return result.error
        }
        await state.save()
        const payload = new AlliesAndEnemiesFirstHandDiscardEvent(
            gameId,
            viewingPlayerId
        )
        await pubSub.publish(getTopicName(Topics.Play, gameId), payload)
        return payload
    }
}
