export const managerStatus = {
  NONE: '初期状態',
  IDLE: '待機',
  INPUT_NAME: '名前入力',
  CONFIRM_NAME: '名前確認',
  POSTING_MESSAGE: 'メッセージ投稿中',
  DELETE_MESSAGE: 'メッセージ削除',
} as const
export type managerStatusType = (typeof managerStatus)[keyof typeof managerStatus]

export const messageStatus = {
  INPUT_IMAGE: '画像添付',
  CONFIRM_IMAGE: '画像確認',
  INPUT_POSITION: '立場入力',
  CONFIRM_POSITION: '立場確認',
  CONFIRM_SUBMIT: '確認待ち',
  APPROVED: '承認済み',
  CANCELED: 'キャンセル済み',
}

export type messageStatusType = (typeof messageStatus)[keyof typeof messageStatus]
