import { Client, Message as LineMessage } from '@line/bot-sdk'
import { Message } from '../../types/message'
import { messageStatus } from '../../consts/constants'
import sharp from 'sharp'
import { uploadImage } from '../../lib/storage/message'
import { updateMessage } from '../../lib/firestore/message'
import { confirmImage, showImage } from './message'
import { GetUrl } from '../../lib/storage/storage'

const IMAGE_SIZE = 680
const thresholdColor = 100
const thresholdAlpha = 200

export const reactMessageImage = async (
  managerClient: Client,
  eventMessageId: string,
  message: Message,
): Promise<LineMessage[]> => {
  let inputBuffer = await downloadImageById(managerClient, eventMessageId)

  switch (message.status) {
    case messageStatus.INPUT_IMAGE:
      // 画像を読み込み、アルファチャンネルを確保
      const image = sharp(inputBuffer)
        .grayscale()
        .threshold(thresholdColor)
        .toColorspace('b-w')
        .resize({ width: IMAGE_SIZE, height: IMAGE_SIZE, fit: sharp.fit.inside })
        .ensureAlpha()

      // アルファチャンネル用のマスクを作成（2値化して反転）
      const alphaChannel = await sharp(inputBuffer)
        .grayscale()
        .threshold(thresholdAlpha)
        .toColourspace('b-w')
        .resize({ width: IMAGE_SIZE, height: IMAGE_SIZE, fit: sharp.fit.inside })
        .negate()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const { data: alphaData, info: alphaInfo } = alphaChannel

      const outputBuffer = await image
        .joinChannel(alphaData, {
          raw: { width: alphaInfo.width, height: alphaInfo.height, channels: 1 },
        })
        .png()
        .toBuffer()
      let path = await uploadImage(outputBuffer, message)
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
