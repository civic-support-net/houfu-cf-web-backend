import {
  managerStatus,
  managerStatusType,
  messageStatus,
  messageStatusType,
} from '../../consts/constants'
import { keyword } from '../../consts/keyword'
import { phrase } from '../../consts/phrase'
import { newFirestore } from '../../lib/firestore/firestore'
import { TextTemplate } from '../../lib/line/template'
import { GetUrl } from '../../lib/storage/storage'
import { Manager } from '../../types/manager'
import { Message } from '../../types/message'
import {
  askImage,
  askPosition,
  askPositionAgain,
  completeMessage,
  confirmPosition,
  confirmSubmit,
  discardMessage,
  previewMessage,
} from './message'
import { reactMessageText } from './react_message_text'
import admin from 'firebase-admin'

const getMessage = (status: messageStatusType): Message => {
  return {
    id: '230428-161200',
    managerId: 'm0001',
    position: '受給者',
    status: status,
    imageUrl: '20241018-093110.png',
    isWorkingInProgress: true,
    createdAt: new Date('December 15, 1990 01:23:00'),
    approvedAt: null,
    canceledAt: null,
    publishedAt: null,
  }
}

const getManager = (name: string, status: managerStatusType): Manager => {
  return {
    id: 'm0001',
    lineId: 'Uada2abc97aaaaae0a223eb4ddcbbbbbb',
    name: name,
    status: status,
    enable: false,
    createdAt: new Date('December 15, 1990 01:23:00'),
  }
}

jest.mock('../../lib/firestore/message', () => ({
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
}))

jest.mock('../../lib/firestore/manager', () => ({
  updateManager: jest.fn(),
  getManagers: jest.fn().mockReturnValue([]),
}))

jest.mock('../../lib/line/line', () => ({
  Push: jest.fn(),
}))

jest.mock('../../lib/sheet/log', () => ({
  insertLog: jest.fn(),
}))

jest.mock('../../lib/storage/message', () => ({
  deleteMessageData: () => Promise.resolve(),
}))

describe('react_message_text', () => {
  admin.initializeApp()
  newFirestore()
  const managerClient = undefined as any
  const manager = getManager('test', managerStatus.POSTING_MESSAGE)

  it(':画像入力', async () => {
    const message = getMessage(messageStatus.INPUT_IMAGE)
    expect(await reactMessageText(managerClient, '文字列', manager, message)).toMatchObject([
      askImage(),
    ])
  })

  describe(':画像確認', () => {
    it(':はい', async () => {
      const message = getMessage(messageStatus.CONFIRM_IMAGE)
      expect(await reactMessageText(managerClient, keyword.YES, manager, message)).toMatchObject([
        askPosition(),
      ])
    })
    it(':いいえ', async () => {
      const message = getMessage(messageStatus.CONFIRM_IMAGE)
      expect(await reactMessageText(managerClient, keyword.NO, manager, message)).toMatchObject([
        askImage(),
      ])
    })
    it(':その他', async () => {
      const message = getMessage(messageStatus.CONFIRM_IMAGE)
      expect(await reactMessageText(managerClient, 'hoge', manager, message)).toMatchObject([
        TextTemplate(phrase.yesOrNo),
      ])
    })
  })

  it(':立場入力', async () => {
    const message = getMessage(messageStatus.INPUT_POSITION)
    expect(await reactMessageText(managerClient, '受給者', manager, message)).toMatchObject([
      confirmPosition('受給者'),
    ])
  })

  describe(':立場確認', () => {
    it(':はい', async () => {
      const message = getMessage(messageStatus.CONFIRM_POSITION)
      expect(await reactMessageText(managerClient, keyword.YES, manager, message)).toMatchObject([
        previewMessage(message.position, GetUrl(message.imageUrl)),
        confirmSubmit(),
      ])
    })
    it(':いいえ', async () => {
      const message = getMessage(messageStatus.CONFIRM_POSITION)
      expect(await reactMessageText(managerClient, keyword.NO, manager, message)).toMatchObject([
        askPositionAgain(),
      ])
    })
    it(':その他', async () => {
      const message = getMessage(messageStatus.CONFIRM_POSITION)
      expect(await reactMessageText(managerClient, 'hoge', manager, message)).toMatchObject([
        TextTemplate(phrase.yesOrNo),
      ])
    })
  })

  describe(':投稿承認', () => {
    it(':はい', async () => {
      const message = getMessage(messageStatus.CONFIRM_SUBMIT)
      expect(
        await reactMessageText(managerClient, keyword.APPROVE, manager, message),
      ).toMatchObject([])
    })
    it(':いいえ', async () => {
      const message = getMessage(messageStatus.CONFIRM_SUBMIT)
      expect(await reactMessageText(managerClient, keyword.CANCEL, manager, message)).toMatchObject(
        [discardMessage()],
      )
    })
    it(':その他', async () => {
      const message = getMessage(messageStatus.CONFIRM_SUBMIT)
      expect(await reactMessageText(managerClient, 'unknown', manager, message)).toMatchObject([
        TextTemplate(phrase.aOrb(keyword.APPROVE, keyword.CANCEL)),
      ])
    })
  })
})
