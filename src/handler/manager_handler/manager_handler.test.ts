import { WebhookEvent } from '@line/bot-sdk'
import { managerStatus, managerStatusType, messageStatus } from '../../consts/constants'
import { Manager } from '../../types/manager'
import { handleEvent } from '../manager_handler/manager_handler'
import { askName, askNameAgain, completeRegister, confirmName, tellWelcome } from './setup'
import { keyword } from '../../consts/keyword'
import { askImage, askMessageId, deleteMessageSuccess, notFoundMessage, tellOK } from './message'
import { QuickReplyTemplate, TextTemplate } from '../../lib/line/template'
import { phrase } from '../../consts/phrase'
import { Message } from '../../types/message'

const getManager = (name: string, status: managerStatusType): Manager => {
  return {
    id: 'r0001',
    lineId: 'Uada2abc97aaaaae0a223eb4ddcbbbbbb',
    name: name,
    status: status,
    enable: false,
    createdAt: new Date('December 15, 1990 01:23:00'),
  }
}

const getMessage = (): Message => {
  return {
    id: '20241017-081020',
    managerId: 'm0001',
    position: '受給者',
    status: messageStatus.APPROVED,
    imageUrl: 'https://example.com',
    isWorkingInProgress: false,
    createdAt: new Date('December 15, 1990 01:23:00'),
    approvedAt: null,
    canceledAt: null,
    publishedAt: null,
  }
}

const getEvent = (type: string, messageType: string, messageText: string) => {
  return {
    type: type,
    source: { userId: 'Uada2abc97aaaaae0a223eb4ddcbbbbbb' },
    message: { type: messageType, text: messageText },
  } as WebhookEvent
}

const mockGetManagerByLineId = jest.fn()
jest.mock('../../lib/firestore/manager', () => ({
  createManager: () => getManager('', managerStatus.NONE),
  updateManager: jest.fn(),
  getManagerByLineId: () => mockGetManagerByLineId(),
}))

const mockGetMessageById = jest.fn()
jest.mock('../../lib/firestore/message', () => ({
  createMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  getWorkingMessageByManagerId: jest.fn(),
  getMessageById: () => mockGetMessageById(),
}))

jest.mock('../../lib/github/github', () => ({
  deploy: jest.fn(),
}))

jest.mock('../../lib/sheet/log', () => ({
  insertLog: jest.fn(),
}))

jest.mock('../../lib/storage/message', () => ({
  // deleteMessageData: jest.fn(),
  deleteMessageData: () => Promise.reject(),
}))

let consoleErrorMock
beforeEach(() => {
  consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  consoleErrorMock.mockRestore()
})

// unfollow
describe('manager_handler unfollow', () => {
  const event = getEvent('unfollow', '', '')
  const managerClient = undefined as any
  it(':何も無し', async () => {
    mockGetManagerByLineId.mockImplementation(() => getManager('二郎', managerStatus.NONE))
    expect(await handleEvent(managerClient, event)).toMatchObject([])
  })
})

// follow
describe('manager_handler follow', () => {
  const event = getEvent('follow', '', '')
  const managerClient = undefined as any

  it(':初フォロー', async () => {
    mockGetManagerByLineId.mockImplementation(() => undefined)

    expect(await handleEvent(managerClient, event)).toMatchObject([tellWelcome(), askName()])
  })

  it(':再フォローして名前なし', async () => {
    mockGetManagerByLineId.mockImplementation(() => getManager('', managerStatus.NONE))

    expect(await handleEvent(managerClient, event)).toMatchObject([tellWelcome(), askName()])
  })

  it(':再フォローして名前あり', async () => {
    mockGetManagerByLineId.mockImplementation(() => getManager('太郎', managerStatus.NONE))

    expect(await handleEvent(managerClient, event)).toMatchObject([tellWelcome()])
  })
})

// message
describe('manager_handler message', () => {
  const managerClient = undefined as any

  it(':投稿開始', async () => {
    mockGetManagerByLineId.mockImplementation(() => getManager('登録管理者', managerStatus.IDLE))
    const event = getEvent('message', 'text', keyword.POST_MESSAGE)
    expect(await handleEvent(managerClient, event)).toMatchObject([askImage()])
  })

  it(':投稿削除', async () => {
    const event = getEvent('message', 'text', keyword.DELETE_MESSAGE)
    expect(await handleEvent(managerClient, event)).toMatchObject([askMessageId()])
  })

  it(':何もしない', async () => {
    const event = getEvent('message', 'text', keyword.DO_NOTHING)
    expect(await handleEvent(managerClient, event)).toMatchObject([tellOK()])
  })

  it(':話しかける', async () => {
    const event = getEvent('message', 'text', 'やぁ')
    expect(await handleEvent(managerClient, event)).toMatchObject([
      QuickReplyTemplate('こんにちは！何をしますか？', [
        keyword.POST_MESSAGE,
        keyword.DELETE_MESSAGE,
        keyword.DO_NOTHING,
      ]),
    ])
  })

  it(':名前入力', async () => {
    mockGetManagerByLineId.mockImplementation(() => getManager('', managerStatus.INPUT_NAME))
    const event = getEvent('message', 'text', '防府丸')
    expect(await handleEvent(managerClient, event)).toMatchObject([confirmName('防府丸')])
  })

  describe(':名前確認', () => {
    it(':はい', async () => {
      mockGetManagerByLineId.mockImplementation(() =>
        getManager('冷蔵太郎', managerStatus.CONFIRM_NAME),
      )
      const event = getEvent('message', 'text', keyword.YES)
      expect(await handleEvent(managerClient, event)).toMatchObject([completeRegister('冷蔵太郎')])
    })
    it(':いいえ', async () => {
      mockGetManagerByLineId.mockImplementation(() =>
        getManager('冷蔵太郎', managerStatus.CONFIRM_NAME),
      )
      const event = getEvent('message', 'text', keyword.NO)
      expect(await handleEvent(managerClient, event)).toMatchObject([askNameAgain()])
    })
    it(':不明', async () => {
      mockGetManagerByLineId.mockImplementation(() =>
        getManager('冷蔵太郎', managerStatus.CONFIRM_NAME),
      )
      const event = getEvent('message', 'text', 'unknown')
      expect(await handleEvent(managerClient, event)).toMatchObject([TextTemplate(phrase.yesOrNo)])
    })
  })

  // managerStatus.POSTING_MESSAGEは、reactMessageTextで処理するのでテスト不要

  describe(':メッセージ削除', () => {
    it(':メッセージなし', async () => {
      mockGetManagerByLineId.mockImplementation(() => getManager('', managerStatus.DELETE_MESSAGE))
      mockGetMessageById.mockImplementation(() => undefined)
      const event = getEvent('message', 'text', 'notexist')
      expect(await handleEvent(managerClient, event)).toMatchObject([notFoundMessage()])
    })

    it(':削除成功', async () => {
      mockGetManagerByLineId.mockImplementation(() => getManager('', managerStatus.DELETE_MESSAGE))
      const message = getMessage()
      mockGetMessageById.mockImplementation(() => message)
      const event = getEvent('message', 'text', message.id)
      expect(await handleEvent(managerClient, event)).toMatchObject([
        deleteMessageSuccess(message.id),
      ])
    })
  })

  describe(':manager.status 未対応', () => {
    it(':メッセージなし', async () => {
      mockGetManagerByLineId.mockImplementation(() =>
        getManager('', 'undefined' as managerStatusType),
      )
      const event = getEvent('message', 'text', 'notexist')
      expect(await handleEvent(managerClient, event)).toMatchObject([
        TextTemplate(phrase.notSupportedCase('manager.status: undefined')),
      ])
    })
  })
})
