import { ConfirmTemplate, TextTemplate } from '../../lib/line/template'

export const tellWelcome = () => {
  return TextTemplate(
    `友だち追加ありがとうございます。\nこのLINEボットはサイトに反映するメッセージの管理を行うことができます。`,
  )
}

export const askName = () => {
  return TextTemplate('まず、お名前を教えてください。（サイトには公開されません）')
}

export const confirmName = (name: string) => {
  return ConfirmTemplate(`お名前は「${name}」でよろしいですか？`, '名前確認')
}

export const askNameAgain = () => {
  return TextTemplate('もう一度お名前を教えてください。')
}

export const completeRegister = (name: string) => {
  return TextTemplate(
    `登録が完了しました。「${name}」さん、ありがとうございました。投稿されたメッセージの管理をすることができます。`,
  )
}
