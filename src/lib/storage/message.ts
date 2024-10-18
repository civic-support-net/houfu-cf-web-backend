import { bucket, upload } from './storage'
import { Message } from '../../types/message'

export const deleteMessageData = async (message: Message) => {
  await bucket.file(`messages/${message.id}.png`).delete()
}

export const uploadImage = async (image: Buffer, message: Message) => {
  const path = `messages/${message.id}.png` //images haven't updated
  await upload(image, path)
  bucket.file(path).makePublic()
  return path
}
