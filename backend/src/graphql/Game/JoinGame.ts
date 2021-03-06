import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    Mutation,
    ObjectType,
    PubSub,
    Resolver,
    Root,
} from 'type-graphql'
import { PubSubEngine } from 'graphql-subscriptions'

import { GameStatus, GameId, IGame } from 'src/entities/Game'
import { Event } from 'src/graphql/Event'
import { GameEvent } from 'src/graphql/GameEvent'
import { DescriptiveError, ApiResponse } from 'src/shared/api'
import { getTopicName, Topics } from 'src/shared/topics'
import { IPlayer, PlayerId } from 'src/entities/Player'
import { Player } from 'src/graphql/Player'
import Context from 'src/shared/Context'

@ObjectType({ implements: [Event, GameEvent] })
export class JoinGameEvent extends GameEvent {
    @Field(() => Player)
    readonly joined: IPlayer

    constructor(game: IGame, player: IPlayer) {
        const state = {
            gameId: game.id,
            gameType: game.type,
            viewingPlayerId: player.id,
        }
        super(state, player.id, JoinGameEvent.name)
        this.joined = player
    }
}

@Resolver(() => JoinGameEvent)
class JoinResolver {
    @Mutation(() => JoinGameEvent)
    async joinGame(
        @Arg('gameId', () => String) gameId: GameId,
        @Arg('playerId', () => String) playerId: PlayerId,
        @Arg('playerNickname', () => String) nickname: string,
        @Ctx() { dataSources: { games, players } }: Context,
        @PubSub() pubSub: PubSubEngine
    ): Promise<ApiResponse<JoinGameEvent>> {
        const game = await games.load(gameId)
        if (!game) {
            return new DescriptiveError(
                'Unable to look up game.',
                'No game with this code found.',
                'Please make sure a game exists before joining.'
            )
        }
        if (game.status !== GameStatus.InLobby) {
            return new DescriptiveError(
                'Unable to join this game.',
                'Games are only joinable when they are in the lobby.',
                'Please join games from the home page or using recently copied links.'
            )
        }
        const player = await players.update(gameId, {
            id: playerId,
            nickname,
        })
        const payload = new JoinGameEvent(game, player)
        await pubSub.publish(getTopicName(Topics.Play, game.id), payload)
        return payload
    }
}
