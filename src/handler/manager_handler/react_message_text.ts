import { Client, Message as LineMessage } from '@line/bot-sdk'
import { Message } from '../../types/message'
import { managerStatus, messageStatus } from '../../consts/constants'
import { TextTemplate } from '../../lib/line/template'
import { deleteMessage, updateMessage } from '../../lib/firestore/message'
import {
  askImage,
  completeMessage,
  confirmSubmit,
  discardMessage,
  previewMessage,
  confirmPosition,
  askPosition,
  askPositionAgain,
} from './message'
import { keyword } from '../../consts/keyword'
import { phrase } from '../../consts/phrase'
import { deleteMessageData } from '../../lib/storage/message'
import { Push } from '../../lib/line/line'
import { getManagers, updateManager } from '../../lib/firestore/manager'
import { action } from '../../consts/log'
import { insertLog } from '../../lib/sheet/log'
import { managerSummary, messageSummary } from '../../lib/sheet/summary'
import { Manager } from '../../types/manager'
import { deploy } from '../../lib/github/github'
import { jstDateString } from '../../utils/date'
import { messageOrgStoragePath, messageStoragePath } from '../../consts/message'

export const reactMessageText = async (
  managerClient: Client,
  text: string,
  manager: Manager,
  message: Message,
): Promise<LineMessage[]> => {
  switch (message.status) {
    case messageStatus.INPUT_IMAGE:
      return [askImage()]

    case messageStatus.CONFIRM_IMAGE:
      switch (text) {
        case keyword.YES:
          message.status = messageStatus.INPUT_POSITION
          await updateMessage(message)
          return [askPosition()]
        case keyword.NO:
          message.status = messageStatus.INPUT_IMAGE
          await deleteMessageData(messageStoragePath(message.id))
          await deleteMessageData(messageOrgStoragePath(message.id))
          await updateMessage(message)
          return [askImage()]
        default:
          return [TextTemplate(phrase.yesOrNo)]
      }

    case messageStatus.INPUT_POSITION:
      message.position = text
      message.status = messageStatus.CONFIRM_POSITION
      await updateMessage(message)
      return [confirmPosition(text)]

    case messageStatus.CONFIRM_POSITION:
      switch (text) {
        case keyword.YES:
          message.status = messageStatus.CONFIRM_SUBMIT
          await updateMessage(message)
          return [previewMessage(message.position, message.imageUrl), confirmSubmit()]
        case keyword.NO:
          message.status = messageStatus.INPUT_POSITION
          await updateMessage(message)
          return [askPositionAgain()]
        default:
          return [TextTemplate(phrase.yesOrNo)]
      }

    case messageStatus.CONFIRM_SUBMIT:
      switch (text) {
        case keyword.APPROVE:
          manager.status = managerStatus.IDLE
          await updateManager(manager)
          message.status = messageStatus.APPROVED
          message.isWorkingInProgress = false
          message.approvedAt = new Date()
          await updateMessage(message)
          await Push(
            managerClient,
            (await getManagers()).map((m) => m.lineId),
            [completeMessage()],
          )
          await deploy()
          insertLog(
            jstDateString(new Date()),
            managerSummary(manager),
            action.APPROVE_MESSAGE,
            messageSummary(message),
          )
          // Pushで伝えるので応答はしない
          return []
        case keyword.CANCEL:
          manager.status = managerStatus.IDLE
          await updateManager(manager)
          await deleteMessage(message)
          deleteMessageData(messageStoragePath(message.id)).catch((err) => console.error(err))
          deleteMessageData(messageOrgStoragePath(message.id)).catch((err) => console.error(err))
          return [discardMessage()]
        default:
          return [TextTemplate(phrase.aOrb(keyword.APPROVE, keyword.CANCEL))]
      }
  }
}
