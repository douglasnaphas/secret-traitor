import {
    Arg,
    Ctx,
    Field,
    ID,
    Mutation,
    ObjectType,
    PubSub,
    Resolver,
} from 'type-graphql'
import { PubSubEngine } from 'graphql-subscriptions'

import { GameId, GameType } from '@entities/Game'
import { PlayerId } from '@entities/Player'
import { VoteValue } from '@entities/AlliesAndEnemies'
import { Event } from '@graphql/Event'
import { GameEvent } from '@graphql/GameEvent'
import { ApiResponse } from '@shared/api'
import { getTopicName, Topics } from '@shared/topics'
import Context from '@shared/Context'

@ObjectType({ implements: [Event, GameEvent] })
class AlliesAndEnemiesCallVetoEvent extends GameEvent {
    constructor(gameId: GameId, playerId: PlayerId) {
        const state = { gameId, playerId, gameType: GameType.AlliesNEnemies }
        super(state, playerId, AlliesAndEnemiesCallVetoEvent.name)
    }
}

@Resolver(() => AlliesAndEnemiesCallVetoEvent)
class AlliesAndEnemiesCallVetoEventResolver {
    @Mutation(() => AlliesAndEnemiesCallVetoEvent)
    async alliesAndEnemiesCallVeto(
        @Arg('gameId', () => ID) gameId: GameId,
        @Arg('playerId', () => ID) playerId: PlayerId,
        @Ctx() { dataSources: { alliesAndEnemies } }: Context,
        @PubSub() pubSub: PubSubEngine
    ): Promise<ApiResponse<AlliesAndEnemiesCallVetoEvent>> {
        const state = await alliesAndEnemies.get(gameId, playerId)
        const result = state.callVeto()
        if ('error' in result) {
            return result.error
        }
        await state.save()
        const payload = new AlliesAndEnemiesCallVetoEvent(gameId, playerId)
        await pubSub.publish(getTopicName(Topics.Play, gameId), payload)
        return payload
    }
}

@ObjectType({ implements: [Event, GameEvent] })
export class AlliesAndEnemiesVetoVoteEvent extends GameEvent {
    @Field(() => VoteValue)
    public readonly vote: VoteValue

    constructor(vote: VoteValue, gameId: GameId, playerId: PlayerId) {
        const state = { gameId, playerId, gameType: GameType.AlliesNEnemies }
        super(state, playerId, AlliesAndEnemiesVetoVoteEvent.name)
        this.vote = vote
    }
}

@Resolver(() => AlliesAndEnemiesVetoVoteEvent)
class AlliesAndEnemiesVetoVoteEventResolver {
    @Mutation(() => AlliesAndEnemiesVetoVoteEvent)
    async alliesAndEnemiesVetoVote(
        @Arg('gameId', () => ID) gameId: GameId,
        @Arg('playerId', () => ID) playerId: PlayerId,
        @Arg('vote', () => VoteValue) vote: VoteValue,
        @Ctx() { dataSources: { alliesAndEnemies } }: Context,
        @PubSub() pubSub: PubSubEngine
    ): Promise<ApiResponse<AlliesAndEnemiesVetoVoteEvent>> {
        const state = await alliesAndEnemies.get(gameId, playerId)
        const result = state.vetoVote(vote)
        if ('error' in result) {
            return result.error
        }
        await state.save()
        const payload = new AlliesAndEnemiesVetoVoteEvent(
            vote,
            gameId,
            playerId
        )
        await pubSub.publish(getTopicName(Topics.Play, gameId), payload)
        return payload
    }
}