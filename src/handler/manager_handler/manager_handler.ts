import {
  Client,
  FollowEvent,
  Message as LineMessage,
  MessageAPIResponseBase,
  MessageEvent,
  UnfollowEvent,
  WebhookEvent,
} from '@line/bot-sdk'
import { Request, Response } from 'express'
import { managerStatus, messageStatus } from '../../consts/constants'
import { keyword } from '../../consts/keyword'
import { phrase } from '../../consts/phrase'
import { createManager, getManagerByLineId, updateManager } from '../../lib/firestore/manager'
import { QuickReplyTemplate, TextTemplate } from '../../lib/line/template'
import { Manager } from '../../types/manager'
import { askName, askNameAgain, completeRegister, confirmName, tellWelcome } from './setup'
import {
  createMessage,
  deleteMessage,
  getMessageById,
  getWorkingMessageByManagerId,
  updateMessage,
} from '../../lib/firestore/message'
import { askMessageId, deleteMessageSuccess, notFoundMessage, askImage, tellOK } from './message'
import { insertLog } from '../../lib/sheet/log'
import { action } from '../../consts/log'
import { deleteMessageData } from '../../lib/storage/message'
import { messageSummary } from '../../lib/sheet/summary'
import { deploy } from '../../lib/github/github'
import { Message } from '../../types/message'
import { reactMessageImage } from './react_message_image'
import { reactMessageText } from './react_message_text'
import { format } from 'date-fns'
import { jstDateString } from '../../utils/date'

export class managerLineHandler {
  constructor(private managerClient: Client) {}

  async handle(req: Request, res: Response) {
    console.log('manager_handler: called')
    if (!req.body.events || req.body.events.length === 0) {
      console.log('manager_handler: no events')
      return res.sendStatus(200)
    }

    //events[0]のみ対応、複数送信は要件になっておらず保留中
    const event: WebhookEvent = req.body.events[0]
    console.log(`manager_handler: event.type = ${event.type}`)

    let result: MessageAPIResponseBase = undefined

    // handleEventが必要なDB処理などを実行しユーザー返答Message配列のPromiseを返してくる。
    // this.clientは渡さなくてよくなる
    const messages = await handleEvent(this.managerClient, event).catch((err) => {
      if (err instanceof Error) {
        // LINEでエラーを検知したいのでログ出力
        console.error(err)
        // 異常時は定型メッセージで応答
        return [TextTemplate(phrase.systemError)]
      }
    })

    // replyTokenかつ応答メッセージがある場合、replyMessageを実行
    if ('replyToken' in event) {
      if (messages && messages.length > 0) {
        result = await this.managerClient.replyMessage(event.replyToken, messages)
      } else {
        console.log('manager_handler: no messages')
      }
    } else {
      console.log('manager_handler: no replyToken')
    }

    // すべてが終わり、resultsをBodyとしてhttpの200を返してる
    return res.status(200).json({
      status: 'success',
      result,
    })
  }
}

export const handleEvent = async (
  managerClient: Client,
  event: WebhookEvent,
): Promise<LineMessage[] | void> => {
  let manager = await getManagerByLineId(event.source.userId)
  let message: Message | undefined = undefined
  if (manager === undefined) {
    manager = await createManager(event.source.userId)
  } else {
    message = await getWorkingMessageByManagerId(manager.id)
  }

  if (event.type === 'unfollow') {
    const lineUnfollowEvent = event as UnfollowEvent
    const messagesByUnfollow = await reactUnfollow(managerClient, lineUnfollowEvent, manager)
    return messagesByUnfollow
  } else if (event.type === 'follow') {
    const lineFollowEvent = event as FollowEvent
    const messagesByFollow = await reactFollow(managerClient, lineFollowEvent, manager)
    return messagesByFollow
  } else if (event.type === 'message') {
    const lineMessageEvent = event as MessageEvent
    const messagesByMessage = await reactMessage(managerClient, lineMessageEvent, manager, message)
    return messagesByMessage
  }

  return Promise.resolve([TextTemplate(`イベントタイプ(${event.type})には対応していません。`)])
}

const reactUnfollow = async (
  managerClient: Client,
  event: WebhookEvent,
  manager: Manager,
): Promise<LineMessage[] | void> => {
  manager.enable = false
  await updateManager(manager)
  return []
}

const reactFollow = async (
  managerClient: Client,
  event: FollowEvent,
  manager: Manager,
): Promise<LineMessage[] | void> => {
  manager.enable = true
  if (manager.name === '') {
    // 名前入力から再開
    manager.status = managerStatus.INPUT_NAME
    await updateManager(manager)
    return [tellWelcome(), askName()]
  } else {
    await updateManager(manager)
    return [tellWelcome()]
  }
}

const reactMessage = async (
  managerClient: Client,
  event: MessageEvent,
  manager: Manager,
  message: Message,
): Promise<LineMessage[] | void> => {
  if (event.message.type === 'text') {
    //　テキストメッセージの場合
    switch (manager.status) {
      case managerStatus.IDLE:
        switch (event.message.text) {
          case keyword.POST_MESSAGE:
            manager.status = managerStatus.POSTING_MESSAGE
            await updateManager(manager)
            const message = await createMessage(manager)
            await updateMessage(message)

            return [askImage()]
          case keyword.DELETE_MESSAGE:
            manager.status = managerStatus.DELETE_MESSAGE
            await updateManager(manager)
            return [askMessageId()]
          case keyword.DO_NOTHING:
            return [tellOK()]
          default:
            return [
              QuickReplyTemplate('こんにちは！何をしますか？', [
                keyword.POST_MESSAGE,
                keyword.DELETE_MESSAGE,
                keyword.DO_NOTHING,
              ]),
            ]
        }
      case managerStatus.INPUT_NAME:
        manager.status = managerStatus.CONFIRM_NAME
        manager.name = event.message.text
        await updateManager(manager)
        return [confirmName(manager.name)]

      case managerStatus.CONFIRM_NAME:
        switch (event.message.text) {
          case keyword.YES:
            manager.status = managerStatus.IDLE
            manager.enable = true
            await updateManager(manager)
            return [completeRegister(manager.name)]
          case keyword.NO:
            manager.status = managerStatus.INPUT_NAME
            manager.name = ''
            await updateManager(manager)
            return [askNameAgain()]
          default:
            return [TextTemplate(phrase.yesOrNo)]
        }

      case managerStatus.POSTING_MESSAGE:
        return reactMessageText(managerClient, event.message.text, manager, message)

      case managerStatus.DELETE_MESSAGE:
        const targetMessage = await getMessageById(event.message.text)
        manager.status = managerStatus.IDLE
        await updateManager(manager)
        if (targetMessage === undefined) {
          return [notFoundMessage()]
        } else {
          await deleteMessage(targetMessage)
          deleteMessageData(targetMessage).catch((err) => console.error(err))
          await deploy()
          insertLog(
            jstDateString(new Date()),
            manager.name,
            action.DELETE_MESSAGE,
            messageSummary(targetMessage),
          )
          return [deleteMessageSuccess(targetMessage.id)]
        }

      default:
        return [TextTemplate(phrase.notSupportedCase(`manager.status: ${manager.status}`))]
    }
  } else if (event.message.type === 'image') {
    if (message && message.status === messageStatus.INPUT_IMAGE) {
      return reactMessageImage(managerClient, event.message.id, message)
    } else {
      return [TextTemplate(phrase.notSupportedCase('今の会話では画像を受け付けていません。'))]
    }
  }

  return [TextTemplate(phrase.notSupportedCase(`event.message.type: ${event.message.type}`))]
}
