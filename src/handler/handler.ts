import { Client, middleware } from '@line/bot-sdk'
import express from 'express'
import { loadConfig } from '../config/config'
import { managerLineHandler } from './manager_handler/manager_handler'
import { newFirestore } from '../lib/firestore/firestore'
import { newStorage } from '../lib/storage/storage'
import admin from 'firebase-admin'
import { newSheet } from '../lib/sheet/sheet'
import { hookMiddleware } from './hook/hook_middleware'
import { hookHandler } from './hook/hook_handler'
import { newGithub } from '../lib/github/github'

export const app = express()

const config = loadConfig()

const managerMiddleware = middleware({
  channelSecret: config.managerLineSecret,
})
const managerClient = new Client({
  channelAccessToken: config.managerLineAccessToken,
  channelSecret: config.managerLineSecret,
})

admin.initializeApp()
newFirestore()
newStorage()
newSheet()
newGithub()

app.post('/manager-line', managerMiddleware, (req, res) =>
  new managerLineHandler(managerClient).handle(req, res),
) //* without [(req, res) =>] it was not working. temporary fix.

app.use('/hook', hookMiddleware, new hookHandler(managerClient).handle())

// TODO: 仕様が固まり次第着手します
// app.post('/batch', middleware, (req, res) => lineEvent(client, req, res));

app.get('/batch/ping', (req, res) => {
  res.send('pong2')
})
