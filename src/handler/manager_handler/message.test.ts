import { loadConfig } from '../../config/config'
import { keyword } from '../../consts/keyword'
import { ConfirmTemplate, TextTemplate } from '../../lib/line/template'
import {
  askImage,
  confirmImage,
  completeMessage,
  discardMessage,
  previewMessage,
  askPosition,
  confirmPosition,
  askPositionAgain,
  confirmSubmit,
} from './message'

test(`message`, async () => {
  expect(askImage()).toMatchObject(
    TextTemplate(
      'メッセージの写真を送信してください。明るい場所で影が付かないようにしてお願いします。',
    ),
  )

  expect(confirmImage()).toMatchObject(
    ConfirmTemplate('画像の背景抜き処理後はこのようになります。よろしいですか？', '画像確認'),
  )

  expect(askPosition()).toMatchObject(
    ConfirmTemplate(`この画像はどちらからのメッセージですか？`, `立場入力`, [
      keyword.RECIPIENT,
      keyword.PROVIDER,
    ]),
  )
  expect(confirmPosition(keyword.RECIPIENT)).toMatchObject(
    ConfirmTemplate(`${keyword.RECIPIENT}からのメッセージでいいですか？`, `立場確認`),
  )

  expect(askPositionAgain()).toMatchObject(TextTemplate('もう一度、立場を選んでください。'))

  expect(confirmSubmit()).toMatchObject(
    ConfirmTemplate(
      `メッセージの最終確認です。不備や間違いがなければ「${keyword.APPROVE}」を押してください。`,
      '投稿承認',
      [keyword.APPROVE, keyword.CANCEL],
    ),
  )
  expect(completeMessage()).toMatchObject(
    TextTemplate(
      'メッセージの登録が完了しました。数分後にWebサイトに反映されます。少々お待ちください。',
    ),
  )
  expect(discardMessage()).toMatchObject(
    TextTemplate('メッセージの下書きを削除しました。もう一度始める場合は話しかけてください。'),
  )
  let conf = loadConfig()

  expect(
    previewMessage(
      '受給者',
      `https://storage.googleapis.com/${conf.projectId}.appspot.com/messages/20241018-092610.png`,
    ),
  ).toMatchObject({
    type: 'flex',
    altText: '投稿プレビュー',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: `https://storage.googleapis.com/${conf.projectId}.appspot.com/messages/20241018-092610.png`,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '受給者からのメッセージ',
                margin: 'md',
                wrap: true,
              },
            ],
            paddingAll: 'xxl',
          },
        ],
        paddingAll: 'none',
      },
    },
  })
})
