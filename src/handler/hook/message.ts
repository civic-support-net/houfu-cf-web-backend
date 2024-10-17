import { TextTemplate } from '../../lib/line/template'

export const publishedMessage = (id: string, at: string, url: string) => {
  return TextTemplate(
    `新しいメッセージ（ID:${id}, 投稿承認日時:${at}）がサイトに反映されました。\n${url}`,
  )
}
