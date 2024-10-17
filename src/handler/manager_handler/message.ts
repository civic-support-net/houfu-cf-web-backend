import { FlexMessage } from '@line/bot-sdk'
import { keyword } from '../../consts/keyword'
import { ConfirmTemplate, TextTemplate } from '../../lib/line/template'
import { GetUrl } from '../../lib/storage/storage'

export const askImage = () => {
  return TextTemplate(
    `メッセージの写真を送信してください。明るい場所で影が付かないようにしてお願いします。`,
  )
}

export const confirmImage = () => {
  return ConfirmTemplate(`画像の背景抜き処理後はこのようになります。よろしいですか？`, `画像確認`)
}

export const askPosition = () => {
  return TextTemplate(`このメッセージを書かれた立場を選んでください。`)
}

export const confirmPosition = (position: string) => {
  return ConfirmTemplate(`立場は「${position}」でいいですか？`, `立場確認`)
}

export const askPositionAgain = () => {
  return TextTemplate(`もう一度、立場を選んでください。`)
}

export const confirmSubmit = () => {
  return ConfirmTemplate(
    `メッセージの最終確認です。不備や間違いがなければ「${keyword.APPROVE}」を押してください。`,
    `投稿承認`,
    [keyword.APPROVE, keyword.CANCEL],
  )
}

export const completeMessage = () => {
  return TextTemplate(
    `メッセージの登録が完了しました。数分後にWebサイトに反映されます。少々お待ちください。`,
  )
}

export const discardMessage = () => {
  return TextTemplate(`メッセージの下書きを削除しました。もう一度始める場合は話しかけてください。`)
}

export const previewMessage = (position: string, imageUrl: string) => {
  return {
    type: 'flex',
    altText: '投稿プレビュー',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: imageUrl,
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
                text: `${position}からのメッセージ`,
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
  } as FlexMessage
}

export const approvedMessage = (name: string, subject: string) => {
  return TextTemplate(`「${name}」さんが、「${subject}」の新しい投稿を送信しました。`)
}

export const askMessageId = () => {
  return TextTemplate('メッセージIDを入力してください。')
}

export const tellOK = () => {
  return TextTemplate('わかりました。')
}

export const deleteMessageSuccess = (subject: string) => {
  return TextTemplate(`「${subject}」の投稿を削除しました。`)
}

export const notFoundMessage = () => {
  return TextTemplate('メッセージが見つかりませんでした。')
}
