import {
    Arg,
    FieldResolver,
    Mutation,
    ObjectType,
    PubSub,
    Resolver,
    Root,
} from 'type-graphql'
import { PubSubEngine } from 'graphql-subscriptions'
import head from 'lodash/head'
import { Inject } from 'typedi'

import { IGameDao } from '@daos/Game'
import { IGamePlayerDao } from '@daos/GamePlayer'
import { IPlayerDao } from '@daos/Player'

import { IGame, GameStatus, GameId } from '@entities/Game'
import { GamePlayerId, IGamePlayer } from '@entities/GamePlayer'

import { Event } from '@graphql/Event'
import { GameEvent, IGameEvent } from '@graphql/GameEvent'

import { ApiError, ApiResponse } from '@shared/api'
import { getTopicName, Topics } from '@shared/topics'
import { IPlayer, PlayerId } from '@entities/Player'
import { Player } from '@graphql/Player'

@ObjectType({ implements: [Event, GameEvent] })
export class JoinGameEvent extends GameEvent {
    constructor(gamePlayerId: GamePlayerId, game: IGame, player: IPlayer) {
        const state = { gamePlayerId, gameType: game.type }
        super(state, player.id, JoinGameEvent.name)
    }
}

@Resolver(() => JoinGameEvent)
class JoinResolver {
    constructor(
        @Inject('GamePlayers') private readonly gamePlayerDao: IGamePlayerDao,
        @Inject('Games') private readonly gameDao: IGameDao,
        @Inject('Players') private readonly playerDao: IPlayerDao
    ) {}

    @FieldResolver(() => Player)
    async joined(@Root() event: IGameEvent): Promise<IPlayer | null> {
        return await this.playerDao.get({ id: event.source })
    }

    @Mutation(() => JoinGameEvent)
    async joinGame(
        @Arg('gameCode', () => String) gameCode: string,
        @Arg('playerCode', () => String) playerCode: string,
        @Arg('playerNickname', () => String) playerNickname: string,
        @PubSub() pubSub: PubSubEngine
    ): Promise<ApiResponse<JoinGameEvent>> {
        const game = head(
            await this.gameDao.find({ code: gameCode.toLowerCase() })
        )
        if (!game) {
            return new ApiError(
                'Unable to look up game.',
                'No game with this code found.',
                'Please make sure a game exists before joining.'
            )
        }
        if (game.status !== GameStatus.InLobby) {
            return new ApiError(
                'Unable to join this game.',
                'Games are only joinable when they are in the lobby.',
                'Please join games from the home page or using recently copied links.'
            )
        }
        const player = await this.getAndUpdatePlayer(playerCode, playerNickname)
        const gamePlayer = await this.getGamePlayer(game.id, player.id)
        const payload = new JoinGameEvent(gamePlayer.id, game, player)
        await pubSub.publish(getTopicName(Topics.Play, game.id), payload)
        return payload
    }

    private async getAndUpdatePlayer(
        playerCode: string,
        playerNickname: string
    ) {
        let player = head(await this.playerDao.find({ code: playerCode }))
        if (!player) {
            player = await this.playerDao.new({
                code: playerCode,
                nickname: playerNickname,
            })
        } else {
            player = await this.playerDao.put({
                ...player,
                nickname: playerNickname,
            })
        }
        return player
    }

    private async getGamePlayer(gameId: GameId, playerId: PlayerId) {
        return (
            head(
                await this.gamePlayerDao.find({
                    gameId,
                    playerId,
                })
            ) ||
            (await this.gamePlayerDao.new({
                gameId,
                playerId,
                host: false,
            }))
        )
    }
}
