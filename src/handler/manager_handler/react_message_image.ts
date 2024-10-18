import { Client, Message as LineMessage } from '@line/bot-sdk'
import { Message } from '../../types/message'
import { messageStatus } from '../../consts/constants'
import sharp from 'sharp'
import { uploadImage } from '../../lib/storage/message'
import { updateMessage } from '../../lib/firestore/message'
import { confirmImage, showImage } from './message'
import { GetUrl } from '../../lib/storage/storage'

const IMAGE_SIZE = 680

export const reactMessageImage = async (
  managerClient: Client,
  eventMessageId: string,
  message: Message,
): Promise<LineMessage[]> => {
  let image = await downloadImageById(managerClient, eventMessageId)

  switch (message.status) {
    case messageStatus.INPUT_IMAGE:
      image = await sharp(image)
        .resize({ width: IMAGE_SIZE, height: IMAGE_SIZE, fit: sharp.fit.inside })
        .toBuffer()
      let path = await uploadImage(image, message)
      message.imageUrl = path
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
