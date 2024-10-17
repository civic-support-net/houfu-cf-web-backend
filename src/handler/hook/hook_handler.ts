import { Client } from '@line/bot-sdk'
import { Request, Response } from 'express'
import { Router } from 'express'
import { publishMessagesHandler } from './publish_messages_handler'

export class hookHandler {
  constructor(private managerClient: Client) {}

  handle() {
    const hooks = Router()

    hooks.post('/publish_messages', (req, res) =>
      new publishMessagesHandler(this.managerClient).handle(req, res),
    )
    hooks.get('test', (req: Request, res: Response) => {
      res.send('test')
    })

    return hooks
  }
}
