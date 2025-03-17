import { Client, Message as LineMessage } from '@line/bot-sdk'
import { Message } from '../../types/message'
import { messageStatus } from '../../consts/constants'
import sharp from 'sharp'
import { uploadImage } from '../../lib/storage/message'
import { updateMessage } from '../../lib/firestore/message'
import { confirmImage, showImage } from './message'
import { GetUrl } from '../../lib/storage/storage'
import { messageOrgStoragePath, messageStoragePath } from '../../consts/message'

// デザインの5:3を維持する
const IMAGE_WIDTH = 800
const IMAGE_HEIGHT = 480
const threshold = 128

export const reactMessageImage = async (
  managerClient: Client,
  eventMessageId: string,
  message: Message,
): Promise<LineMessage[]> => {
  let inputBuffer = await downloadImageById(managerClient, eventMessageId)

  switch (message.status) {
    case messageStatus.INPUT_IMAGE:
      // オリジナル画像をアップロードする
      const orgPath = messageOrgStoragePath(message.id)
      await uploadImage(inputBuffer, orgPath)

      // 画像を読み込み、リサイズ & クロップ
      let image = sharp(inputBuffer)
        .resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .grayscale() // グレースケール化（二値化しやすくする）

      // 画像を取得（rawデータとしてピクセル情報を取得）
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })

      // RGBAのデータを作成（ピクセル単位で処理）
      const rgbaData = Buffer.alloc(info.width * info.height * 4)
      for (let i = 0; i < info.width * info.height; i++) {
        const grayValue = data[i] // グレースケール画像のピクセル値
        const binaryValue = grayValue > threshold ? 255 : 0 // 反転して二値化
        rgbaData[i * 4] = binaryValue // R
        rgbaData[i * 4 + 1] = binaryValue // G
        rgbaData[i * 4 + 2] = binaryValue // B
        rgbaData[i * 4 + 3] = grayValue > threshold ? 0 : 255 // A (透過処理)
      }

      // RGBA画像を作成
      const outputBuffer = await sharp(rgbaData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4,
        },
      })
        .png()
        .toBuffer()

      const path = messageStoragePath(message.id)
      await uploadImage(outputBuffer, path)
      message.imageUrl = GetUrl(path)
      message.status = messageStatus.CONFIRM_IMAGE
      await updateMessage(message)
      return [showImage(GetUrl(path)), confirmImage()]
  }
}

const downloadImageById = async (client: Client, id: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    client.getMessageContent(id).then((stream) => {
      const content = []
      stream
        .on('data', (chunk) => {
          content.push(Buffer.from(chunk))
        })
        .on('error', reject)
        .on('end', () => {
          resolve(Buffer.concat(content))
        })
    })
  })
}
