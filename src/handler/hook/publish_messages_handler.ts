import { Client } from '@line/bot-sdk'
import { Request, Response } from 'express'
import { getNonPublishedApprovedMessages, updateMessage } from '../../lib/firestore/message'
import { publishedMessage } from './message'
import { loadConfig } from '../../config/config'
import moment from 'moment'
import { GetManagerById } from '../../lib/firestore/manager'
import axios from 'axios'

export class publishMessagesHandler {
  constructor(private managerClient: Client) {}

  async handle(req: Request, res: Response) {
    const conf = loadConfig()

    let messages = await getNonPublishedApprovedMessages()
    if (messages.length === 0) {
      return res.status(200).json({
        status: 'new message not found',
      })
    }
    console.log(messages)

    messages.forEach(async (message) => {
      let managerLineId = (await GetManagerById(message.managerId)).lineId
      this.managerClient.pushMessage(managerLineId, [
        publishedMessage(message.id, message.approvedAt.toLocaleDateString(), conf.frontendUrl),
      ])
      message.publishedAt = moment().utcOffset(9).toDate()
      updateMessage(message)
    })

    return res.status(200).json({
      status: 'success',
    })
  }
}
