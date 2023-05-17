import { TextTemplate } from '../../lib/line/template'

export const approvedPostForRecipient = (subject: string) => {
  return TextTemplate(`「${subject}」の投稿が承認されました。数分後にサイトに反映されます。`)
}

export const rejectedPostForRecipient = (subject: string) => {
  return TextTemplate(
    `「${subject}」の投稿が拒否されました。投稿内容を修正の上、再度投稿してください。`,
  )
}

export const approvedPostForManager = (name: string, subject: string) => {
  return TextTemplate(`「${name}」さんが、「${subject}」の投稿を承認しました。`)
}

export const rejectedPostForManager = (name: string, subject: string) => {
  return TextTemplate(`「${name}」さんが、「${subject}」の投稿を拒否しました。`)
}
