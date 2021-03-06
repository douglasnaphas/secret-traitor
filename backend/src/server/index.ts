import express from 'express'
import 'reflect-metadata'
import { ApolloServer } from 'apollo-server-express'
import { createServer } from 'http'

import config from './config'

const app = express()
const server = createServer(app)
const apollo = new ApolloServer(config)
apollo.applyMiddleware({ app, path: '/graphql' })
apollo.applyMiddleware({ app, cors: { credentials: false, origin: false } })
apollo.installSubscriptionHandlers(server)
export default server
